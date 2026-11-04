from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.inventario import Inventario
from app.models.movimiento_inventario import MovimientoInventario
from app.models.recepcion import Recepcion
from app.models.detalle_recepcion import DetalleRecepcion
from app.schemas.recepcion import RecepcionCreate, RecepcionResponse

router = APIRouter()
CENTAVO = Decimal("0.01")


def _redondear_monto(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def _obtener_detalles_orden(compra: Compra) -> Dict[int, dict]:
    detalles: Dict[int, dict] = {}
    for detalle in compra.detalles:
        item_id = int(detalle.item_id)
        cantidad = Decimal(str(detalle.cantidad))
        acumulado = detalles.setdefault(
            item_id,
            {
                "cantidad_ordenada": Decimal("0"),
                "importe": Decimal("0"),
                "descripcion": detalle.item.nombre_nomenclatura,
            },
        )
        acumulado["cantidad_ordenada"] += cantidad
        acumulado["importe"] += cantidad * Decimal(str(detalle.precio_unitario))
    for acumulado in detalles.values():
        cantidad = acumulado["cantidad_ordenada"]
        acumulado["precio_unitario"] = (
            _redondear_monto(acumulado["importe"] / cantidad)
            if cantidad
            else Decimal("0")
        )
    return detalles


def _obtener_cantidades_recibidas(
    db: Session,
    compra_id: int,
) -> Dict[int, Decimal]:
    filas = (
        db.query(
            DetalleRecepcion.item_id,
            func.sum(DetalleRecepcion.cantidad_recibida),
        )
        .join(Recepcion, Recepcion.recepcion_id == DetalleRecepcion.recepcion_id)
        .filter(
            Recepcion.compra_id == compra_id,
            Recepcion.estado == "Confirmada",
            DetalleRecepcion.item_id.isnot(None),
        )
        .group_by(DetalleRecepcion.item_id)
        .all()
    )
    return {
        int(item_id): Decimal(str(cantidad or 0))
        for item_id, cantidad in filas
    }


def _confirmar_recepcion(
    db: Session,
    recepcion_id: int,
    usuario_id: int,
) -> Recepcion:
    compra_id = (
        db.query(Recepcion.compra_id)
        .filter(Recepcion.recepcion_id == recepcion_id)
        .scalar()
    )
    if compra_id is None:
        raise HTTPException(status_code=404, detail="Recepción no encontrada.")

    compra = (
        db.query(Compra)
        .filter(Compra.compra_id == compra_id)
        .with_for_update(of=Compra)
        .first()
    )
    recepcion = (
        db.query(Recepcion)
        .filter(Recepcion.recepcion_id == recepcion_id)
        .with_for_update(of=Recepcion)
        .first()
    )
    if not compra or not recepcion:
        raise HTTPException(status_code=404, detail="Recepción u orden de compra no encontrada.")

    if recepcion.estado == "Confirmada":
        return recepcion
    if recepcion.estado != "Registrada":
        raise HTTPException(status_code=409, detail="La recepción no se encuentra pendiente de confirmación.")

    detalles_orden = _obtener_detalles_orden(compra)
    recibidos_previamente = _obtener_cantidades_recibidas(db, compra.compra_id)
    detalles_recepcion = sorted(recepcion.detalles, key=lambda detalle: detalle.item_id or 0)

    if not detalles_recepcion:
        raise HTTPException(status_code=422, detail="La recepción no contiene artículos.")

    cantidades_por_item: Dict[int, Decimal] = {}
    for detalle in detalles_recepcion:
        if detalle.item_id is None or detalle.item_id not in detalles_orden:
            raise HTTPException(status_code=422, detail="La recepción contiene un artículo ajeno a la orden de compra.")
        cantidad = Decimal(str(detalle.cantidad_recibida))
        if cantidad <= 0:
            raise HTTPException(status_code=422, detail="La cantidad recibida debe ser mayor que cero.")
        cantidades_por_item[detalle.item_id] = (
            cantidades_por_item.get(detalle.item_id, Decimal("0")) + cantidad
        )

    items = {}
    for item_id, cantidad in cantidades_por_item.items():
        item_orden = detalles_orden[item_id]
        cantidad_pendiente = (
            item_orden["cantidad_ordenada"]
            - recibidos_previamente.get(item_id, Decimal("0"))
        )
        if cantidad > cantidad_pendiente:
            raise HTTPException(
                status_code=409,
                detail=f"La cantidad recibida del artículo {item_id} supera lo pendiente ({cantidad_pendiente}).",
            )
        item = (
            db.query(Inventario)
            .filter(Inventario.item_id == item_id)
            .with_for_update(of=Inventario)
            .first()
        )
        if not item:
            raise HTTPException(status_code=404, detail=f"El artículo {item_id} ya no existe en inventario.")
        items[item_id] = item

    for detalle in detalles_recepcion:
        item_id = int(detalle.item_id)
        item_orden = detalles_orden[item_id]
        cantidad = Decimal(str(detalle.cantidad_recibida))
        recibido_antes = recibidos_previamente.get(item_id, Decimal("0"))
        cantidad_pendiente = (
            item_orden["cantidad_ordenada"] - recibido_antes - cantidad
        )
        detalle.cantidad_ordenada = item_orden["cantidad_ordenada"]
        detalle.cantidad_pendiente = cantidad_pendiente
        detalle.descripcion = item_orden["descripcion"]
        detalle.precio_unitario = item_orden["precio_unitario"]
        detalle.total = _redondear_monto(cantidad * detalle.precio_unitario)

        item = items[item_id]
        stock_anterior = Decimal(str(item.stock_actual))
        stock_nuevo = stock_anterior + cantidad
        item.stock_actual = stock_nuevo
        db.add(
            MovimientoInventario(
                item_id=item_id,
                usuario_id=usuario_id,
                tipo_movimiento="Entrada",
                cantidad=cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                referencia=f"Recepcion-{recepcion.recepcion_id}",
                observaciones=recepcion.observaciones,
            )
        )

    recepcion.estado = "Confirmada"
    db.flush()
    recibidos_actualizados = _obtener_cantidades_recibidas(db, compra.compra_id)
    detalles_confirmados = (
        db.query(DetalleRecepcion)
        .join(Recepcion, Recepcion.recepcion_id == DetalleRecepcion.recepcion_id)
        .filter(
            Recepcion.compra_id == compra.compra_id,
            Recepcion.estado == "Confirmada",
            DetalleRecepcion.item_id.in_(list(cantidades_por_item)),
        )
        .all()
    )
    for detalle in detalles_confirmados:
        orden = detalles_orden.get(int(detalle.item_id))
        if orden:
            detalle.cantidad_pendiente = max(
                orden["cantidad_ordenada"]
                - recibidos_actualizados.get(int(detalle.item_id), Decimal("0")),
                Decimal("0"),
            )

    compra.estado = (
        "Recibida"
        if all(
            recibidos_actualizados.get(item_id, Decimal("0")) >= detalle["cantidad_ordenada"]
            for item_id, detalle in detalles_orden.items()
        )
        else "Parcial"
    )
    return recepcion


@router.get("", response_model=List[RecepcionResponse])
def listar_recepciones(
    proveedor_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Recepcion)

    if proveedor_id:
        query = query.filter(Recepcion.proveedor_id == proveedor_id)

    if estado and estado != "Todos":
        query = query.filter(Recepcion.estado == estado)

    return query.order_by(Recepcion.recepcion_id.desc()).all()


@router.get("/{recepcion_id}", response_model=RecepcionResponse)
def obtener_recepcion(
    recepcion_id: int,
    db: Session = Depends(get_db),
):
    recepcion = db.query(Recepcion).filter(Recepcion.recepcion_id == recepcion_id).first()
    if not recepcion:
        raise HTTPException(status_code=404, detail="Recepción no encontrada.")
    return recepcion


@router.post("", response_model=RecepcionResponse, status_code=201)
def crear_recepcion(
    datos: RecepcionCreate,
    db: Session = Depends(get_db),
):
    try:
        if datos.recepcion_id is not None:
            if datos.confirmar:
                recepcion = _confirmar_recepcion(db, datos.recepcion_id, datos.usuario_id)
            else:
                recepcion = (
                    db.query(Recepcion)
                    .filter(Recepcion.recepcion_id == datos.recepcion_id)
                    .first()
                )
                if not recepcion:
                    raise HTTPException(status_code=404, detail="Recepción no encontrada.")
            db.commit()
            db.refresh(recepcion)
            return recepcion

        if datos.compra_id is None:
            raise HTTPException(status_code=422, detail="Debe indicar la orden de compra.")

        compra = (
            db.query(Compra)
            .filter(Compra.compra_id == datos.compra_id)
            .with_for_update(of=Compra)
            .first()
        )
        if not compra:
            raise HTTPException(status_code=404, detail="Orden de compra no encontrada.")
        if datos.proveedor_id is not None and datos.proveedor_id != compra.proveedor_id:
            raise HTTPException(status_code=422, detail="El proveedor no coincide con la orden de compra.")

        detalles_orden = _obtener_detalles_orden(compra)
        if not detalles_orden:
            raise HTTPException(status_code=409, detail="La orden de compra no tiene artículos registrados.")

        borrador_existente = (
            db.query(Recepcion)
            .filter(
                Recepcion.compra_id == compra.compra_id,
                Recepcion.estado == "Registrada",
            )
            .first()
        )
        if borrador_existente:
            raise HTTPException(
                status_code=409,
                detail=f"La orden ya tiene una recepción pendiente de confirmación ({borrador_existente.recepcion_id}).",
            )

        recibidos = _obtener_cantidades_recibidas(db, compra.compra_id)
        cantidades_solicitadas: Dict[int, Decimal] = {}
        for detalle in datos.detalles:
            if detalle.item_id is None or detalle.item_id not in detalles_orden:
                raise HTTPException(status_code=422, detail="La recepción contiene un artículo ajeno a la orden de compra.")
            cantidad = Decimal(str(detalle.cantidad_recibida))
            if cantidad <= 0:
                raise HTTPException(status_code=422, detail="La cantidad recibida debe ser mayor que cero.")
            cantidades_solicitadas[detalle.item_id] = (
                cantidades_solicitadas.get(detalle.item_id, Decimal("0")) + cantidad
            )

        if not cantidades_solicitadas:
            raise HTTPException(status_code=422, detail="Indique al menos una cantidad recibida.")

        for item_id, cantidad in cantidades_solicitadas.items():
            pendiente = (
                detalles_orden[item_id]["cantidad_ordenada"]
                - recibidos.get(item_id, Decimal("0"))
            )
            if cantidad > pendiente:
                raise HTTPException(
                    status_code=409,
                    detail=f"La cantidad recibida del artículo {item_id} supera lo pendiente ({pendiente}).",
                )

        recepcion = Recepcion(
            compra_id=compra.compra_id,
            proveedor_id=compra.proveedor_id,
            usuario_id=datos.usuario_id,
            estado="Registrada",
            observaciones=datos.observaciones,
        )
        for item_id, cantidad in cantidades_solicitadas.items():
            item_orden = detalles_orden[item_id]
            pendiente_nuevo = (
                item_orden["cantidad_ordenada"]
                - recibidos.get(item_id, Decimal("0"))
                - cantidad
            )
            recepcion.detalles.append(
                DetalleRecepcion(
                    item_id=item_id,
                    descripcion=item_orden["descripcion"],
                    cantidad_ordenada=item_orden["cantidad_ordenada"],
                    cantidad_recibida=cantidad,
                    cantidad_pendiente=pendiente_nuevo,
                    precio_unitario=item_orden["precio_unitario"],
                    total=_redondear_monto(cantidad * item_orden["precio_unitario"]),
                )
            )

        db.add(recepcion)
        db.flush()
        if datos.confirmar:
            _confirmar_recepcion(db, recepcion.recepcion_id, datos.usuario_id)

        db.commit()
        db.refresh(recepcion)
        return recepcion
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo registrar la recepción por un conflicto de datos.")
