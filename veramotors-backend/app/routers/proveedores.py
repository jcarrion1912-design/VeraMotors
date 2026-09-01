from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.proveedor import Proveedor
from app.schemas.proveedor import (
    ProveedorCreate,
    ProveedorResponse
)

router = APIRouter()


@router.get("", response_model=List[ProveedorResponse])
def listar_proveedores(
    activo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Proveedor)

    if activo is not None:
        query = query.filter(Proveedor.activo == activo)

    proveedores = query.order_by(Proveedor.proveedor_id.asc()).all()
    return proveedores


@router.get("/{proveedor_id}", response_model=ProveedorResponse)
def obtener_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.proveedor_id == proveedor_id
    ).first()

    if not proveedor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado."
        )

    return proveedor


@router.post("", response_model=ProveedorResponse, status_code=201)
def crear_proveedor(
    datos: ProveedorCreate,
    db: Session = Depends(get_db)
):
    proveedor = Proveedor(**datos.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(
    proveedor_id: int,
    datos: ProveedorCreate,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.proveedor_id == proveedor_id
    ).first()

    if not proveedor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado."
        )

    for key, value in datos.model_dump().items():
        setattr(proveedor, key, value)

    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.delete("/{proveedor_id}", status_code=204)
def eliminar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.proveedor_id == proveedor_id
    ).first()

    if not proveedor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado."
        )

    db.delete(proveedor)
    db.commit()
    return None
