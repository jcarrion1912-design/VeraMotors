from datetime import datetime
from decimal import Decimal
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.cliente import Cliente
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.detalle_factura import DetalleFactura
from app.models.detalle_remision import DetalleRemision
from app.models.factura import Factura
from app.models.inventario import Inventario
from app.models.movimiento_inventario import MovimientoInventario
from app.models.remision import Remision
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.remision import (
    DespachoRequest,
    RemisionCreate,
    RemisionEstadoUpdate,
    RemisionResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

ESTADOS_FACTURA_NO_VALIDOS = {"ANULADO", "RECHAZADO"}


def _serializar_remision(db: Session, remision: Remision) -> dict[str, Any]:
    cliente = db.query(Cliente).filter(Cliente.cliente_id == remision.cliente_id).first()
    factura = remision.factura
    return {
        "remision_id": remision.remision_id,
        "cliente_id": remision.cliente_id,
        "vehiculo_id": remision.vehiculo_id,
        "ods_id": remision.ods_id,
        "factura_id": remision.factura_id,
        "usuario_despacho_id": remision.usuario_despacho_id,
        "fecha_despacho": remision.fecha_despacho,
        "tipo_remision": remision.tipo_remision,
        "serie": remision.serie,
        "correlativo": remision.correlativo,
        "numero_remision": remision.numero_remision,
        "fecha_emision": remision.fecha_emision,
        "motivo_traslado": remision.motivo_traslado,
        "punto_partida": remision.punto_partida,
        "punto_llegada": remision.punto_llegada,
        "estado": remision.estado,
        "estado_sunat": remision.estado_sunat,
        "codigo_sunat": remision.codigo_sunat,
        "respuesta_sunat": remision.respuesta_sunat,
        "fecha_envio_sunat": remision.fecha_envio_sunat,
        "cliente_nombre": cliente.nombre_razon_social if cliente else None,
        "cliente_documento": cliente.documento_identidad if cliente else None,
        "numero_comprobante": factura.numero_comprobante if factura else None,
        "detalles": [
            {
                "detalle_remision_id": detail.detalle_remision_id,
                "remision_id": detail.remision_id,
                "factura_detalle_id": detail.factura_detalle_id,
                "item_id": detail.item_id,
                "descripcion": detail.descripcion,
                "cantidad": detail.cantidad,
            }
            for detail in remision.detalles
        ],
    }


def _validar_factura_confirmada(factura: Factura) -> None:
    estado_sunat = (factura.estado_sunat or "").strip().upper()
    if factura.estado_pago != "Pagado" or estado_sunat in ESTADOS_FACTURA_NO_VALIDOS:
        raise HTTPException(
            status_code=409,
            detail="Solo una venta facturada, pagada y no anulada/rechazada puede generar guía.",
        )


@router.get("/ventas-disponibles")
def listar_ventas_disponibles(db: Session = Depends(get_db)):
    facturas = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .outerjoin(Remision, Remision.factura_id == Factura.factura_id)
        .filter(
            Factura.estado_pago == "Pagado",
            ~Factura.estado_sunat.in_(ESTADOS_FACTURA_NO_VALIDOS),
            Remision.remision_id.is_(None),
            Factura.factura_id.in_(db.query(DetalleFactura.factura_id)),
        )
        .order_by(Factura.fecha_emision.desc(), Factura.factura_id.desc())
        .all()
    )

    resultado = []
    for factura in facturas:
        cliente = db.query(Cliente).filter(Cliente.cliente_id == factura.cliente_id).first()
        resultado.append({
            "factura_id": factura.factura_id,
            "numero_comprobante": factura.numero_comprobante,
            "fecha_emision": factura.fecha_emision,
            "estado_pago": factura.estado_pago,
            "estado_sunat": factura.estado_sunat,
            "total": factura.total,
            "cliente_id": factura.cliente_id,
            "cliente_nombre": cliente.nombre_razon_social if cliente else None,
            "cliente_documento": cliente.documento_identidad if cliente else None,
            "detalles": [
                {
                    "factura_detalle_id": detail.detalle_factura_id,
                    "item_id": detail.item_id,
                    "descripcion": detail.descripcion,
                    "cantidad_vendida": detail.cantidad,
                    "cantidad_disponible": detail.cantidad,
                }
                for detail in factura.detalles
            ],
        })
    return resultado


@router.get("", response_model=list[RemisionResponse])
def listar_remisiones(db: Session = Depends(get_db)):
    remisiones = (
        db.query(Remision)
        .options(joinedload(Remision.detalles), joinedload(Remision.factura))
        .order_by(Remision.remision_id.desc())
        .all()
    )
    return [_serializar_remision(db, item) for item in remisiones]


@router.post("", response_model=RemisionResponse, status_code=201)
def crear_remision(datos: RemisionCreate, db: Session = Depends(get_db)):
    try:
        factura = (
            db.query(Factura)
            .options(selectinload(Factura.detalles))
            .filter(Factura.factura_id == datos.factura_id)
            .with_for_update(of=Factura)
            .first()
        )
        if not factura:
            raise HTTPException(status_code=404, detail="Venta/factura no encontrada.")
        _validar_factura_confirmada(factura)

        existente = db.query(Remision.remision_id).filter(Remision.factura_id == factura.factura_id).first()
        if existente:
            raise HTTPException(status_code=409, detail="Esta venta ya tiene una guía de remisión.")

        cliente = db.query(Cliente).filter(Cliente.cliente_id == factura.cliente_id).first()
        if not cliente or not cliente.nombre_razon_social.strip() or not cliente.documento_identidad.strip():
            raise HTTPException(status_code=400, detail="La venta no tiene un cliente con nombre y documento válidos.")

        if not factura.detalles:
            raise HTTPException(status_code=400, detail="La venta no tiene líneas de detalle.")

        if datos.vehiculo_id is not None:
            vehiculo = db.query(Vehiculo).filter(
                Vehiculo.vehiculo_id == datos.vehiculo_id,
                Vehiculo.cliente_id == cliente.cliente_id,
            ).first()
            if not vehiculo:
                raise HTTPException(status_code=400, detail="El vehículo no pertenece al cliente de la venta.")

        lineas_venta = {line.detalle_factura_id: line for line in factura.detalles}
        lineas_guia = {line.factura_detalle_id: line for line in datos.detalles}
        if len(lineas_guia) != len(datos.detalles) or set(lineas_guia) != set(lineas_venta):
            raise HTTPException(status_code=400, detail="La guía debe contener cada línea de la venta exactamente una vez.")

        for detalle_id, linea_guia in lineas_guia.items():
            linea_venta = lineas_venta[detalle_id]
            if linea_guia.cantidad > Decimal(str(linea_venta.cantidad)):
                raise HTTPException(status_code=400, detail=f"La cantidad excede la venta en la línea {detalle_id}.")
            if linea_venta.item_id is not None:
                item = db.query(Inventario.item_id).filter(Inventario.item_id == linea_venta.item_id).first()
                if not item:
                    raise HTTPException(status_code=400, detail=f"El producto {linea_venta.item_id} ya no existe en inventario.")
            if not linea_venta.descripcion.strip():
                raise HTTPException(status_code=400, detail=f"La línea {detalle_id} no tiene descripción.")

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento == "REMISION",
                ConfiguracionCorrelativo.activo.is_(True),
            )
            .with_for_update()
            .first()
        )
        if not configuracion:
            raise HTTPException(status_code=409, detail="No existe configuración activa para REMISION.")

        correlativo = configuracion.siguiente_correlativo
        serie = configuracion.prefijo
        remision = Remision(
            cliente_id=factura.cliente_id,
            vehiculo_id=datos.vehiculo_id,
            ods_id=factura.ods_id,
            factura_id=factura.factura_id,
            tipo_remision=datos.tipo_remision,
            serie=serie,
            correlativo=correlativo,
            numero_remision=f"{serie}-{correlativo:06d}",
            motivo_traslado=datos.motivo_traslado.strip(),
            punto_partida=datos.punto_partida.strip() if datos.punto_partida else None,
            punto_llegada=datos.punto_llegada.strip(),
            estado="Pendiente",
            estado_sunat="Pendiente",
        )
        for detalle_id, linea_guia in lineas_guia.items():
            linea_venta = lineas_venta[detalle_id]
            remision.detalles.append(DetalleRemision(
                factura_detalle_id=detalle_id,
                item_id=linea_venta.item_id,
                descripcion=linea_venta.descripcion,
                cantidad=linea_guia.cantidad,
            ))

        db.add(remision)
        configuracion.siguiente_correlativo = correlativo + 1
        db.commit()
        db.refresh(remision)
        return _serializar_remision(db, remision)
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as error:
        db.rollback()
        if "uq_remisiones_factura_id" in str(error):
            raise HTTPException(status_code=409, detail="Esta venta ya tiene una guía de remisión.")
        raise HTTPException(status_code=400, detail="No se pudo registrar la guía; revisa las relaciones y los datos enviados.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ocurrió un error al registrar la guía de remisión.")


@router.get("/{remision_id}/documentos")
def obtener_documentos_relacionados(remision_id: int, db: Session = Depends(get_db)):
    remision = (
        db.query(Remision)
        .options(joinedload(Remision.detalles), joinedload(Remision.factura))
        .filter(Remision.remision_id == remision_id)
        .first()
    )
    if not remision:
        raise HTTPException(status_code=404, detail="Guía de remisión no encontrada.")

    cliente = db.query(Cliente).filter(Cliente.cliente_id == remision.cliente_id).first()
    factura = remision.factura
    vehiculo = db.query(Vehiculo).filter(Vehiculo.vehiculo_id == remision.vehiculo_id).first() if remision.vehiculo_id else None
    return {
        "guia": _serializar_remision(db, remision),
        "venta": {
            "factura_id": factura.factura_id,
            "numero_comprobante": factura.numero_comprobante,
            "estado_pago": factura.estado_pago,
            "estado_sunat": factura.estado_sunat,
            "total": factura.total,
        } if factura else None,
        "cliente": {
            "cliente_id": cliente.cliente_id,
            "nombre_razon_social": cliente.nombre_razon_social,
            "documento_identidad": cliente.documento_identidad,
            "direccion_ubigeo": cliente.direccion_ubigeo,
        } if cliente else None,
        "vehiculo": {
            "vehiculo_id": vehiculo.vehiculo_id,
            "placa": vehiculo.placa,
            "marca": vehiculo.marca,
            "modelo": vehiculo.modelo,
        } if vehiculo else None,
        "detalles_venta": [
            {
                "factura_detalle_id": line.detalle_factura_id,
                "item_id": line.item_id,
                "descripcion": line.descripcion,
                "cantidad_vendida": line.cantidad,
            }
            for line in factura.detalles
        ] if factura else [],
    }


@router.get("/{remision_id}", response_model=RemisionResponse)
def obtener_remision(remision_id: int, db: Session = Depends(get_db)):
    remision = (
        db.query(Remision)
        .options(joinedload(Remision.detalles), joinedload(Remision.factura))
        .filter(Remision.remision_id == remision_id)
        .first()
    )
    if not remision:
        raise HTTPException(status_code=404, detail="Guía de remisión no encontrada.")
    return _serializar_remision(db, remision)


@router.post("/{remision_id}/despacho", response_model=RemisionResponse)
def registrar_despacho(
    remision_id: int,
    datos: DespachoRequest,
    db: Session = Depends(get_db),
):
    try:
        remision = (
            db.query(Remision)
            .options(joinedload(Remision.detalles), joinedload(Remision.factura))
            .filter(Remision.remision_id == remision_id)
            .with_for_update(of=Remision)
            .first()
        )
        if not remision:
            raise HTTPException(status_code=404, detail="Guía de remisión no encontrada.")
        if remision.estado != "Pendiente":
            raise HTTPException(status_code=409, detail="Solo se puede despachar una guía pendiente.")
        if not remision.factura_id or not remision.detalles:
            raise HTTPException(status_code=409, detail="La guía no está vinculada a una venta válida.")

        _validar_factura_confirmada(remision.factura)
        usuario = db.query(Usuario).filter(Usuario.user_id == datos.usuario_id, Usuario.activo.is_(True)).first()
        if not usuario:
            raise HTTPException(status_code=400, detail="El usuario de despacho no existe o está inactivo.")

        for detalle in remision.detalles:
            if detalle.cantidad <= 0:
                raise HTTPException(status_code=400, detail="La guía contiene cantidades inválidas.")
            if detalle.item_id is None:
                continue

            item = (
                db.query(Inventario)
                .filter(Inventario.item_id == detalle.item_id)
                .with_for_update(of=Inventario)
                .first()
            )
            if not item:
                raise HTTPException(status_code=409, detail=f"El producto {detalle.item_id} ya no existe en inventario.")

            cantidad = Decimal(str(detalle.cantidad))
            stock_anterior = Decimal(str(item.stock_actual))
            if cantidad > stock_anterior:
                raise HTTPException(
                    status_code=409,
                    detail=f"Stock insuficiente para {item.nombre_nomenclatura}. Disponible: {stock_anterior}.",
                )
            stock_nuevo = stock_anterior - cantidad
            item.stock_actual = stock_nuevo
            db.add(MovimientoInventario(
                item_id=item.item_id,
                usuario_id=usuario.user_id,
                tipo_movimiento="Salida",
                cantidad=cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                referencia=remision.numero_remision,
                observaciones=f"Despacho de venta {remision.factura.numero_comprobante}",
            ))

        remision.estado = "En tránsito"
        remision.usuario_despacho_id = usuario.user_id
        remision.fecha_despacho = datetime.now()
        db.commit()
        db.refresh(remision)
        return _serializar_remision(db, remision)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Error registrando despacho para remision_id=%s", remision_id)
        raise HTTPException(status_code=500, detail="No se pudo registrar el despacho.")


@router.patch("/{remision_id}/estado", response_model=RemisionResponse)
def cambiar_estado_remision(
    remision_id: int,
    datos: RemisionEstadoUpdate,
    db: Session = Depends(get_db),
):
    remision = (
        db.query(Remision)
        .options(joinedload(Remision.detalles), joinedload(Remision.factura))
        .filter(Remision.remision_id == remision_id)
        .with_for_update(of=Remision)
        .first()
    )
    if not remision:
        raise HTTPException(status_code=404, detail="Guía de remisión no encontrada.")

    transiciones = {
        ("Pendiente", "Anulada"),
        ("En tránsito", "Entregada"),
    }
    if (remision.estado, datos.estado) not in transiciones:
        raise HTTPException(status_code=409, detail=f"No se permite cambiar de {remision.estado} a {datos.estado}.")

    remision.estado = datos.estado
    try:
        db.commit()
        db.refresh(remision)
        return _serializar_remision(db, remision)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo actualizar el estado de la guía.")
