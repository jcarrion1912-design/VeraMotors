from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.compra import Compra
from app.models.proveedor import Proveedor
from app.schemas.compra import (
    CompraCreate,
    CompraResponse
)

router = APIRouter()


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


@router.post("", response_model=CompraResponse, status_code=201)
def crear_compra(
    datos: CompraCreate,
    db: Session = Depends(get_db)
):
    compra = Compra(**datos.model_dump())
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra


@router.put("/{compra_id}", response_model=CompraResponse)
def actualizar_compra(
    compra_id: int,
    datos: CompraCreate,
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

    for key, value in datos.model_dump().items():
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
