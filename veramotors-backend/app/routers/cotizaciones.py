from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.database import get_db
from app.models.cotizacion import Cotizacion
from app.models.detalle_cotizacion import DetalleCotizacion
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.inventario import Inventario
from app.schemas.cotizacion import (
    CotizacionAprobacionRequest,
    CotizacionCreate,
    CotizacionResponse,
    CotizacionUpdate,
    DetalleCotizacionBase,
)

router = APIRouter()
CENTAVO = Decimal("0.01")


def _redondear_monto(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def _calcular_detalles(
    datos: List[DetalleCotizacionBase],
    db: Session,
    solo_activos: bool = True,
):
    ids_items = [detalle.item_id for detalle in datos if detalle.item_id is not None]
    if len(ids_items) != len(set(ids_items)):
        raise HTTPException(
            status_code=422,
            detail="Cada producto del inventario solo puede aparecer una vez en una cotización.",
        )

    items_por_id = {}
    if ids_items:
        consulta_items = db.query(Inventario).filter(Inventario.item_id.in_(ids_items))
        if solo_activos:
            consulta_items = consulta_items.filter(Inventario.activo.is_(True))
        items = consulta_items.all()
        items_por_id = {item.item_id: item for item in items}
        faltantes = [item_id for item_id in ids_items if item_id not in items_por_id]
        if faltantes:
            raise HTTPException(
                status_code=422,
                detail=f"Los productos del inventario {faltantes} no existen o están inactivos.",
            )

    detalles_calculados = []
    subtotal = Decimal("0")
    descuentos = Decimal("0")
    impuestos = Decimal("0")

    for detalle in datos:
        cantidad = Decimal(str(detalle.cantidad))
        precio = _redondear_monto(Decimal(str(detalle.precio_unitario)))
        descuento = _redondear_monto(Decimal(str(detalle.descuento or 0)))
        bruto = _redondear_monto(cantidad * precio)
        if descuento > bruto:
            raise HTTPException(
                status_code=422,
                detail=f"El descuento de '{detalle.descripcion}' supera su importe bruto.",
            )

        base_imponible = bruto - descuento
        if detalle.item_id is not None:
            tasa_impuesto = Decimal(str(items_por_id[detalle.item_id].impuesto or 0))
            impuesto = _redondear_monto(base_imponible * tasa_impuesto / Decimal("100"))
        else:
            impuesto = _redondear_monto(Decimal(str(detalle.impuesto or 0)))

        total_detalle = _redondear_monto(base_imponible + impuesto)
        detalles_calculados.append(
            {
                "item_id": detalle.item_id,
                "descripcion": detalle.descripcion,
                "cantidad": cantidad,
                "precio_unitario": precio,
                "descuento": descuento,
                "impuesto": impuesto,
                "total": total_detalle,
            }
        )
        subtotal += bruto
        descuentos += descuento
        impuestos += impuesto

    return (
        detalles_calculados,
        _redondear_monto(subtotal),
        _redondear_monto(descuentos),
        _redondear_monto(impuestos),
        _redondear_monto(subtotal - descuentos + impuestos),
    )


def _serializar_detalle_cotizacion(detalle):
    return {
        "detalle_cotizacion_id": detalle.detalle_cotizacion_id,
        "cotizacion_id": detalle.cotizacion_id,
        "item_id": detalle.item_id,
        "descripcion": detalle.descripcion,
        "cantidad": detalle.cantidad,
        "precio_unitario": detalle.precio_unitario,
        "descuento": detalle.descuento,
        "impuesto": detalle.impuesto,
        "total": detalle.total,
        "item_nombre": detalle.item.nombre_nomenclatura if getattr(detalle, "item", None) else None,
        "item_codigo": detalle.item.codigo_referencia if getattr(detalle, "item", None) else None,
    }


def _serializar_cotizacion(c: Cotizacion):
    return {
        "id": c.cotizacion_id,
        "cotizacion_id": c.cotizacion_id,
        "codigo_cotizacion": c.codigo_cotizacion,
        "cliente_id": c.cliente_id,
        "vehiculo_id": c.vehiculo_id,
        "fecha": c.fecha,
        "subtotal": c.subtotal,
        "descuentos": c.descuentos,
        "impuestos": c.impuestos,
        "total": c.total,
        "estado": c.estado,
        "observaciones": c.observaciones,
        "aprobado_por": c.aprobado_por,
        "fecha_aprobacion": c.fecha_aprobacion,
        "rechazado_por": c.rechazado_por,
        "fecha_rechazo": c.fecha_rechazo,
        "motivo_rechazo": c.motivo_rechazo,
        "cliente_nombre": c.cliente.nombre_razon_social if c.cliente else None,
        "cliente_documento": c.cliente.documento_identidad if c.cliente else None,
        "vehiculo_placa": c.vehiculo.placa if c.vehiculo else None,
        "vehiculo_modelo": f"{c.vehiculo.marca} {c.vehiculo.modelo}" if c.vehiculo else None,
        "detalles": [_serializar_detalle_cotizacion(detalle) for detalle in (c.detalles or [])]
    }


@router.get("", response_model=List[CotizacionResponse])
def listar_cotizaciones(cliente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Cotizacion)
    if cliente_id:
        query = query.filter(Cotizacion.cliente_id == cliente_id)
    cotizaciones = query.order_by(Cotizacion.cotizacion_id.desc()).all()
    return [_serializar_cotizacion(c) for c in cotizaciones]


@router.get("/{cotizacion_id}", response_model=CotizacionResponse)
def obtener_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    c = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == cotizacion_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
    return _serializar_cotizacion(c)


@router.post("/{cotizacion_id}/aprobar", response_model=CotizacionResponse)
def aprobar_cotizacion(cotizacion_id: int, datos: CotizacionAprobacionRequest, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    c = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == cotizacion_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
    if c.estado != "Pendiente":
        raise HTTPException(status_code=409, detail=f"La cotización ya no está pendiente (estado actual: {c.estado}).")

    c.estado = "Aprobada"
    c.aprobado_por = datos.usuario_id
    c.fecha_aprobacion = datetime.utcnow()
    c.rechazado_por = None
    c.fecha_rechazo = None
    c.motivo_rechazo = None

    db.commit()
    db.refresh(c)
    return _serializar_cotizacion(c)


@router.post("/{cotizacion_id}/rechazar", response_model=CotizacionResponse)
def rechazar_cotizacion(cotizacion_id: int, datos: CotizacionAprobacionRequest, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    c = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == cotizacion_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
    if c.estado != "Pendiente":
        raise HTTPException(status_code=409, detail=f"La cotización ya no está pendiente (estado actual: {c.estado}).")
    if not datos.motivo:
        raise HTTPException(status_code=400, detail="Debe indicar el motivo del rechazo.")

    c.estado = "Rechazada"
    c.rechazado_por = datos.usuario_id
    c.fecha_rechazo = datetime.utcnow()
    c.motivo_rechazo = datos.motivo
    c.aprobado_por = None
    c.fecha_aprobacion = None

    db.commit()
    db.refresh(c)
    return _serializar_cotizacion(c)


@router.post("", response_model=CotizacionResponse, status_code=201)
def crear_cotizacion(datos: CotizacionCreate, db: Session = Depends(get_db)):
    try:
        detalles, subtotal, descuentos, impuestos, total = _calcular_detalles(
            datos.detalles,
            db,
            solo_activos=False,
        )

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(ConfiguracionCorrelativo.tipo_documento == "COTIZACION", ConfiguracionCorrelativo.activo == True)
            .with_for_update()
            .first()
        )

        if not configuracion:
            codigo = f"COT-{1000 + db.query(Cotizacion).count() + 1}"
        else:
            codigo = f"{configuracion.prefijo}-{configuracion.siguiente_correlativo}"
            configuracion.siguiente_correlativo += 1

        cotizacion = Cotizacion(
            codigo_cotizacion=codigo,
            cliente_id=datos.cliente_id,
            vehiculo_id=datos.vehiculo_id,
            subtotal=subtotal,
            descuentos=descuentos,
            impuestos=impuestos,
            total=total,
            estado=datos.estado or "Pendiente",
            observaciones=datos.observaciones
        )
        db.add(cotizacion)
        db.flush()

        db.add_all(
            [
                DetalleCotizacion(cotizacion_id=cotizacion.cotizacion_id, **detalle)
                for detalle in detalles
            ]
        )

        db.commit()
        db.refresh(cotizacion)

        return _serializar_cotizacion(cotizacion)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{cotizacion_id}", response_model=CotizacionResponse)
def actualizar_cotizacion(cotizacion_id: int, datos: CotizacionUpdate, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
    if cotizacion.estado != "Pendiente":
        raise HTTPException(status_code=409, detail="Solo se pueden editar cotizaciones pendientes.")

    try:
        cambios = datos.model_dump(exclude_unset=True, exclude={"detalles"})
        for campo, valor in cambios.items():
            setattr(cotizacion, campo, valor)

        if datos.detalles is not None:
            detalles, subtotal, descuentos, impuestos, total = _calcular_detalles(datos.detalles, db)
            cotizacion.detalles.clear()
            cotizacion.detalles.extend(
                [
                    DetalleCotizacion(cotizacion_id=cotizacion.cotizacion_id, **detalle)
                    for detalle in detalles
                ]
            )
            cotizacion.subtotal = subtotal
            cotizacion.descuentos = descuentos
            cotizacion.impuestos = impuestos
            cotizacion.total = total

        db.commit()
        db.refresh(cotizacion)
        return _serializar_cotizacion(cotizacion)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))