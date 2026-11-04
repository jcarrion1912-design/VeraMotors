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
from app.models.proveedor import Proveedor
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.schemas.compra import (
    CompraCreate,
    CompraResponse,
    DetalleCompraResponse
)

router = APIRouter()

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

    compras = query.order_by(Compra.compra_id.desc()).all()
    return compras


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


@router.get("/{compra_id}/detalles", response_model=List[DetalleCompraResponse])
def listar_detalles_compra(
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
