from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.database import get_db
from app.models.cotizacion import Cotizacion
from app.models.detalle_cotizacion import DetalleCotizacion
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.cliente import Cliente
from app.models.vehiculo import Vehiculo
from app.schemas.cotizacion import CotizacionAprobacionRequest, CotizacionCreate, CotizacionResponse

router = APIRouter()


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
        "detalles": c.detalles or []
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

        subtotal = datos.subtotal
        descuentos = datos.descuentos
        impuestos = datos.impuestos
        total = datos.total

        if (subtotal is None or subtotal == 0) and datos.detalles:
            subtotal = sum((Decimal(str(d.cantidad)) * Decimal(str(d.precio_unitario)) for d in datos.detalles), Decimal("0"))
        if (descuentos is None or descuentos == 0) and datos.detalles:
            descuentos = sum((Decimal(str(d.descuento)) for d in datos.detalles), Decimal("0"))
        if (impuestos is None or impuestos == 0) and datos.detalles:
            impuestos = sum((Decimal(str(d.impuesto)) for d in datos.detalles), Decimal("0"))
        if (total is None or total == 0) and datos.detalles:
            total = (subtotal or Decimal("0")) - (descuentos or Decimal("0"))

        cotizacion = Cotizacion(
            codigo_cotizacion=codigo,
            cliente_id=datos.cliente_id,
            vehiculo_id=datos.vehiculo_id,
            subtotal=subtotal if subtotal is not None else Decimal("0"),
            descuentos=descuentos if descuentos is not None else Decimal("0"),
            impuestos=impuestos if impuestos is not None else Decimal("0"),
            total=total if total is not None else Decimal("0"),
            estado=datos.estado or "Pendiente",
            observaciones=datos.observaciones
        )
        db.add(cotizacion)
        db.flush()

        if datos.detalles:
            for d in datos.detalles:
                det_total = d.total if (d.total is not None and d.total > 0) else (
                    (Decimal(str(d.cantidad)) * Decimal(str(d.precio_unitario)))
                    - Decimal(str(d.descuento or 0))
                    + Decimal(str(d.impuesto or 0))
                )
                det = DetalleCotizacion(
                    cotizacion_id=cotizacion.cotizacion_id,
                    item_id=d.item_id,
                    descripcion=d.descripcion,
                    cantidad=d.cantidad,
                    precio_unitario=d.precio_unitario,
                    descuento=d.descuento,
                    impuesto=d.impuesto,
                    total=det_total
                )
                db.add(det)

        db.commit()
        db.refresh(cotizacion)

        return _serializar_cotizacion(cotizacion)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))