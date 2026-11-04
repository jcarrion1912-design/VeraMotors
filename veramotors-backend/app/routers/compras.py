from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, ProgrammingError
from typing import List, Optional

from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.database import get_db
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.inventario import Inventario
<<<<<<< HEAD
=======
from app.models.proveedor import Proveedor
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.schemas.compra import (
    CompraCreate,
    CompraResponse,
    DetalleCompraResponse
)

router = APIRouter()
CENTAVO = Decimal("0.01")


def _redondear_monto(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)

MENSAJE_MIGRACION = (
    "Falta preparar la tabla de ítems de compra. "
    "Ejecuta migracion_fase6_compras_empresa.py en el backend."
)


@router.get("", response_model=List[CompraResponse])
def listar_compras(
    proveedor_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Compra)

    if proveedor_id:
        query = query.filter(Compra.proveedor_id == proveedor_id)

    if estado and estado != "Todos":
        query = query.filter(Compra.estado == estado)

    return query.order_by(Compra.compra_id.desc()).all()


@router.get("/{compra_id}", response_model=CompraResponse)
def obtener_compra(
    compra_id: int,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.compra_id == compra_id
    ).first()

    if not compra:
        raise HTTPException(
            status_code=404,
            detail="Compra no encontrada."
        )

    return compra


<<<<<<< HEAD
@router.post("", response_model=CompraResponse, status_code=201)
def crear_compra(
    datos: CompraCreate,
    db: Session = Depends(get_db)
):
    if not datos.detalles:
        raise HTTPException(status_code=422, detail="La orden de compra debe incluir al menos un artículo del inventario.")

    ids_items = [detalle.item_id for detalle in datos.detalles]
    if len(ids_items) != len(set(ids_items)):
        raise HTTPException(status_code=422, detail="Cada artículo debe aparecer una sola vez en la orden de compra.")

    items = (
        db.query(Inventario)
        .filter(Inventario.item_id.in_(ids_items), Inventario.activo.is_(True))
        .all()
    )
    items_por_id = {item.item_id: item for item in items}
    if len(items_por_id) != len(ids_items):
        raise HTTPException(status_code=422, detail="Uno o más artículos no existen o están inactivos en el inventario.")

    subtotal = Decimal("0")
    descuentos = Decimal("0")
    impuestos = Decimal("0")
    detalles_calculados = []

    for detalle in datos.detalles:
        cantidad = Decimal(str(detalle.cantidad))
        precio_unitario = _redondear_monto(Decimal(str(detalle.precio_unitario)))
        descuento = _redondear_monto(Decimal(str(detalle.descuento)))
        impuesto = _redondear_monto(Decimal(str(detalle.impuesto)))
        importe_bruto = _redondear_monto(cantidad * precio_unitario)

        if descuento > importe_bruto:
            raise HTTPException(
                status_code=422,
                detail=f"El descuento del artículo {detalle.item_id} supera su importe bruto.",
            )

        total_detalle = _redondear_monto(importe_bruto - descuento + impuesto)
        subtotal += importe_bruto
        descuentos += descuento
        impuestos += impuesto
        detalles_calculados.append(
            {
                "item_id": detalle.item_id,
                "cantidad": cantidad,
                "precio_unitario": precio_unitario,
                "descuento": descuento,
                "impuesto": impuesto,
                "total": total_detalle,
            }
        )

    configuracion = (
        db.query(ConfiguracionCorrelativo)
        .filter(
            ConfiguracionCorrelativo.tipo_documento == "COMPRA",
            ConfiguracionCorrelativo.activo.is_(True),
        )
        .with_for_update()
        .first()
    )
    if not configuracion:
        raise HTTPException(status_code=409, detail="No existe correlativo COMPRA activo en PostgreSQL.")

    compra = Compra(
        **datos.model_dump(
            exclude={
                "codigo_compra",
                "detalles",
                "subtotal",
                "descuentos",
                "impuestos",
                "total",
            }
        ),
        subtotal=_redondear_monto(subtotal),
        descuentos=_redondear_monto(descuentos),
        impuestos=_redondear_monto(impuestos),
        total=_redondear_monto(subtotal - descuentos + impuestos),
        codigo_compra=f"{configuracion.prefijo}-{configuracion.siguiente_correlativo:05d}",
    )
    configuracion.siguiente_correlativo += 1
    db.add(compra)
    try:
        db.flush()
        db.add_all(
            [
                DetalleCompra(compra_id=compra.compra_id, **detalle)
                for detalle in detalles_calculados
            ]
        )
        db.commit()
        db.refresh(compra)
        return compra
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo registrar la compra por un conflicto de datos.")


@router.put("/{compra_id}", response_model=CompraResponse)
def actualizar_compra(
=======
@router.get("/{compra_id}/detalles", response_model=List[DetalleCompraResponse])
def listar_detalles_compra(
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
    compra_id: int,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.compra_id == compra_id
    ).first()

    if not compra:
        raise HTTPException(
            status_code=404,
            detail="Compra no encontrada."
        )

<<<<<<< HEAD
    for key, value in datos.model_dump(exclude_none=True, exclude={"detalles"}).items():
=======
    try:
        return (
            db.query(DetalleCompra)
            .filter(DetalleCompra.compra_id == compra_id)
            .order_by(DetalleCompra.detalle_compra_id.asc())
            .all()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=503, detail=MENSAJE_MIGRACION)


@router.post("", response_model=CompraResponse, status_code=201)
def crear_compra(
    datos: CompraCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    configuracion = (
        db.query(ConfiguracionCorrelativo)
        .filter(
            ConfiguracionCorrelativo.tipo_documento == "COMPRA",
            ConfiguracionCorrelativo.activo.is_(True),
        )
        .with_for_update()
        .first()
    )
    if not configuracion:
        raise HTTPException(status_code=409, detail="No existe correlativo COMPRA activo en PostgreSQL.")

    ids_items = {detalle.item_id for detalle in datos.detalles}
    if ids_items:
        existentes = {
            fila[0]
            for fila in db.query(Inventario.item_id).filter(Inventario.item_id.in_(ids_items)).all()
        }
        faltantes = ids_items - existentes
        if faltantes:
            raise HTTPException(
                status_code=400,
                detail=f"Ítems no encontrados en inventario: {sorted(faltantes)}."
            )

    compra = Compra(
        **datos.model_dump(exclude={"codigo_compra", "detalles"}),
        codigo_compra=f"{configuracion.prefijo}-{configuracion.siguiente_correlativo:05d}",
    )
    configuracion.siguiente_correlativo += 1
    db.add(compra)

    try:
        for detalle in datos.detalles:
            compra.detalles.append(DetalleCompra(**detalle.model_dump()))
        db.commit()
        db.refresh(compra)
        return compra
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=503, detail=MENSAJE_MIGRACION)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo registrar la compra por un conflicto de correlativo.")


@router.put("/{compra_id}", response_model=CompraResponse)
def actualizar_compra(
    compra_id: int,
    datos: CompraCreate,
    db: Session = Depends(get_db),
):
    compra = db.query(Compra).filter(
        Compra.compra_id == compra_id
    ).first()

    if not compra:
        raise HTTPException(
            status_code=404,
            detail="Compra no encontrada."
        )

    for key, value in datos.model_dump(exclude_none=True, exclude={"detalles", "usuario_id"}).items():
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
        setattr(compra, key, value)

    db.commit()
    db.refresh(compra)
    return compra


@router.delete("/{compra_id}", status_code=204)
def eliminar_compra(
    compra_id: int,
    db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(
        Compra.compra_id == compra_id
    ).first()

    if not compra:
        raise HTTPException(
            status_code=404,
            detail="Compra no encontrada."
        )

    db.delete(compra)
    db.commit()
    return None
