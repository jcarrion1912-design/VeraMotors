from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoResponse

router = APIRouter()


@router.get("", response_model=List[VehiculoResponse])
def listar_vehiculos(cliente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Vehiculo)
    if cliente_id:
        query = query.filter(Vehiculo.cliente_id == cliente_id)
    vehiculos = query.order_by(Vehiculo.vehiculo_id.asc()).all()
    resultado = []
    for v in vehiculos:
        resultado.append({
            "vehiculo_id": v.vehiculo_id,
            "cliente_id": v.cliente_id,
            "tipo_vehiculo": v.tipo_vehiculo,
            "placa": v.placa,
            "marca": v.marca,
            "modelo": v.modelo,
            "anio": v.anio,
            "color": v.color,
            "vin": v.vin,
            "cliente_nombre": v.cliente.nombre_razon_social if v.cliente else None
        })
    return resultado


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
def obtener_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehiculo).filter(Vehiculo.vehiculo_id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return {
        "vehiculo_id": v.vehiculo_id,
        "cliente_id": v.cliente_id,
        "tipo_vehiculo": v.tipo_vehiculo,
        "placa": v.placa,
        "marca": v.marca,
        "modelo": v.modelo,
        "anio": v.anio,
        "color": v.color,
        "vin": v.vin,
        "cliente_nombre": v.cliente.nombre_razon_social if v.cliente else None
    }


@router.post("", response_model=VehiculoResponse, status_code=201)
def crear_vehiculo(datos: VehiculoCreate, db: Session = Depends(get_db)):
    v = Vehiculo(**datos.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return {
        "vehiculo_id": v.vehiculo_id,
        "cliente_id": v.cliente_id,
        "tipo_vehiculo": v.tipo_vehiculo,
        "placa": v.placa,
        "marca": v.marca,
        "modelo": v.modelo,
        "anio": v.anio,
        "color": v.color,
        "vin": v.vin,
        "cliente_nombre": v.cliente.nombre_razon_social if v.cliente else None
    }