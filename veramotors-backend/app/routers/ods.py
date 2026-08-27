from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.ods import OrdenServicio
from app.schemas.ods import OrdenServicioResponse

router = APIRouter()


@router.get("", response_model=List[OrdenServicioResponse])
def listar_ods(cliente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(OrdenServicio)
    if cliente_id:
        query = query.filter(OrdenServicio.cliente_id == cliente_id)
    ods_list = query.order_by(OrdenServicio.ods_id.desc()).all()
    resultado = []
    for o in ods_list:
        resultado.append({
            "ods_id": o.ods_id,
            "codigo_ods": o.codigo_ods,
            "numero_ticket": o.numero_ticket,
            "cita_id": o.cita_id,
            "cliente_id": o.cliente_id,
            "vehiculo_id": o.vehiculo_id,
            "cotizacion_id": o.cotizacion_id,
            "asesor_id": o.asesor_id,
            "tecnico_id": o.tecnico_id,
            "estado_actual": o.estado_actual,
            "fecha_ingreso": o.fecha_ingreso,
            "tipo_procedimiento": o.tipo_procedimiento,
            "kilometraje_ingreso": o.kilometraje_ingreso,
            "inspeccion_json": o.inspeccion_json,
            "estado_aprobacion_cliente": o.estado_aprobacion_cliente,
            "cliente_nombre": o.cliente.nombre_razon_social if o.cliente else None,
            "vehiculo_placa": o.vehiculo.placa if o.vehiculo else None
        })
    return resultado


@router.get("/{ods_id}", response_model=OrdenServicioResponse)
def obtener_ods(ods_id: int, db: Session = Depends(get_db)):
    o = db.query(OrdenServicio).filter(OrdenServicio.ods_id == ods_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")
    return {
        "ods_id": o.ods_id,
        "codigo_ods": o.codigo_ods,
        "numero_ticket": o.numero_ticket,
        "cita_id": o.cita_id,
        "cliente_id": o.cliente_id,
        "vehiculo_id": o.vehiculo_id,
        "cotizacion_id": o.cotizacion_id,
        "asesor_id": o.asesor_id,
        "tecnico_id": o.tecnico_id,
        "estado_actual": o.estado_actual,
        "fecha_ingreso": o.fecha_ingreso,
        "tipo_procedimiento": o.tipo_procedimiento,
        "kilometraje_ingreso": o.kilometraje_ingreso,
        "inspeccion_json": o.inspeccion_json,
        "estado_aprobacion_cliente": o.estado_aprobacion_cliente,
        "cliente_nombre": o.cliente.nombre_razon_social if o.cliente else None,
        "vehiculo_placa": o.vehiculo.placa if o.vehiculo else None
    }