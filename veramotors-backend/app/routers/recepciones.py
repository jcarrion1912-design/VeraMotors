from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.database import get_db
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.inventario import Inventario
from app.models.movimiento_inventario import MovimientoInventario
from app.models.proveedor import Proveedor
from app.models.recepcion import Recepcion
from app.models.detalle_recepcion import DetalleRecepcion
from app.schemas.recepcion import RecepcionCreate, RecepcionResponse

router = APIRouter()


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
    usuario_actual: Usuario = Depends(get_current_user),
):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    compra = db.query(Compra).filter(Compra.compra_id == datos.compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada.")

    proveedor = db.query(Proveedor).filter(Proveedor.proveedor_id == datos.proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    if compra.estado == "Recibida":
        raise HTTPException(status_code=409, detail="Esta orden de compra ya fue recibida por completo.")

    # Lo ya recibido en recepciones anteriores limita lo que se puede recibir ahora.
    ordenado_por_item = {}
    for detalle_compra in compra.detalles:
        ordenado_por_item[detalle_compra.item_id] = (
            ordenado_por_item.get(detalle_compra.item_id, Decimal("0")) + Decimal(str(detalle_compra.cantidad))
        )

    recibido_por_item = {}
    filas_previas = (
        db.query(DetalleRecepcion)
        .join(Recepcion, DetalleRecepcion.recepcion_id == Recepcion.recepcion_id)
        .filter(Recepcion.compra_id == compra.compra_id, Recepcion.estado == "Confirmada")
        .all()
    )
    for previa in filas_previas:
        recibido_por_item[previa.item_id] = (
            recibido_por_item.get(previa.item_id, Decimal("0")) + Decimal(str(previa.cantidad_recibida))
        )

    if ordenado_por_item:
        for detalle in datos.detalles:
            if detalle.item_id not in ordenado_por_item:
                raise HTTPException(status_code=400, detail=f"El ítem {detalle.item_id} no pertenece a esta orden de compra.")
            nuevo_total = recibido_por_item.get(detalle.item_id, Decimal("0")) + Decimal(str(detalle.cantidad_recibida))
            if nuevo_total > ordenado_por_item[detalle.item_id]:
                raise HTTPException(status_code=400, detail="La cantidad recibida excede lo pendiente de la orden.")

    recepcion = Recepcion(
        compra_id=datos.compra_id,
        proveedor_id=datos.proveedor_id,
        usuario_id=datos.usuario_id,
        estado=datos.estado or "Confirmada",
        observaciones=datos.observaciones,
    )

    total_recibido = Decimal("0")
    for detalle in datos.detalles:
        cantidad_ordenada = Decimal(str(detalle.cantidad_ordenada))
        cantidad_recibida = Decimal(str(detalle.cantidad_recibida))
        cantidad_pendiente = Decimal(str(detalle.cantidad_pendiente))

        if cantidad_recibida < 0:
            raise HTTPException(status_code=400, detail="La cantidad recibida no puede ser negativa.")

        if cantidad_recibida > cantidad_ordenada:
            raise HTTPException(status_code=400, detail="La cantidad recibida excede la cantidad ordenada.")

        if cantidad_pendiente != max(cantidad_ordenada - cantidad_recibida, Decimal("0")):
            cantidad_pendiente = max(cantidad_ordenada - cantidad_recibida, Decimal("0"))

        detalle_recepcion = DetalleRecepcion(
            item_id=detalle.item_id,
            descripcion=detalle.descripcion,
            cantidad_ordenada=cantidad_ordenada,
            cantidad_recibida=cantidad_recibida,
            cantidad_pendiente=cantidad_pendiente,
            precio_unitario=Decimal(str(detalle.precio_unitario)),
            total=Decimal(str(detalle.total)),
        )
        recepcion.detalles.append(detalle_recepcion)
        total_recibido += cantidad_recibida

    db.add(recepcion)
    db.flush()

    if datos.confirmar:
        for detalle in recepcion.detalles:
            item = db.query(Inventario).filter(Inventario.item_id == detalle.item_id).first()
            if not item:
                raise HTTPException(status_code=404, detail=f"Ítem {detalle.item_id} no encontrado en inventario.")

            stock_anterior = Decimal(str(item.stock_actual))
            stock_nuevo = stock_anterior + Decimal(str(detalle.cantidad_recibida))
            item.stock_actual = stock_nuevo

            movimiento = MovimientoInventario(
                item_id=item.item_id,
                usuario_id=datos.usuario_id,
                tipo_movimiento="Recepcion",
                cantidad=Decimal(str(detalle.cantidad_recibida)),
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                referencia=f"Recepcion-{recepcion.recepcion_id}",
                observaciones=datos.observaciones,
            )
            db.add(movimiento)

            recibido_por_item[detalle.item_id] = (
                recibido_por_item.get(detalle.item_id, Decimal("0")) + Decimal(str(detalle.cantidad_recibida))
            )

        if ordenado_por_item and all(
            recibido_por_item.get(item_id, Decimal("0")) >= cantidad
            for item_id, cantidad in ordenado_por_item.items()
        ):
            compra.estado = "Recibida"

    db.commit()
    db.refresh(recepcion)
    return recepcion
