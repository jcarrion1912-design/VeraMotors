from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.ods import OrdenServicio
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.schemas.ods import (
    OrdenServicioResponse,
    OrdenServicioBase,
    OrdenServicioUpdate
)

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


@router.post("", response_model=OrdenServicioResponse, status_code=201)
def crear_ods(
    datos: OrdenServicioBase,
    db: Session = Depends(get_db)
):
    try:
        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento == "ODS",
                ConfiguracionCorrelativo.activo == True
            )
            .with_for_update()
            .first()
        )

        codigo = datos.codigo_ods
        ticket = datos.numero_ticket
        if configuracion:
            codigo = f"{configuracion.prefijo}-{configuracion.siguiente_correlativo:05d}"
            ticket = f"TK-{configuracion.siguiente_correlativo:05d}"
            configuracion.siguiente_correlativo += 1

        payload_dict = datos.model_dump()
        payload_dict["codigo_ods"] = codigo
        payload_dict["numero_ticket"] = ticket

        ods = OrdenServicio(**payload_dict)
        db.add(ods)
        db.commit()
        db.refresh(ods)

        return {
            "ods_id": ods.ods_id,
            "codigo_ods": ods.codigo_ods,
            "numero_ticket": ods.numero_ticket,
            "cita_id": ods.cita_id,
            "cliente_id": ods.cliente_id,
            "vehiculo_id": ods.vehiculo_id,
            "cotizacion_id": ods.cotizacion_id,
            "asesor_id": ods.asesor_id,
            "tecnico_id": ods.tecnico_id,
            "estado_actual": ods.estado_actual,
            "fecha_ingreso": ods.fecha_ingreso,
            "tipo_procedimiento": ods.tipo_procedimiento,
            "kilometraje_ingreso": ods.kilometraje_ingreso,
            "inspeccion_json": ods.inspeccion_json,
            "estado_aprobacion_cliente": ods.estado_aprobacion_cliente,
            "cliente_nombre": ods.cliente.nombre_razon_social if ods.cliente else None,
            "vehiculo_placa": ods.vehiculo.placa if ods.vehiculo else None
        }
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error de integridad en los datos de la ODS: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ocurrió un error al registrar la Orden de Servicio: {str(e)}"
        )


@router.put("/{ods_id}", response_model=OrdenServicioResponse)
@router.patch("/{ods_id}", response_model=OrdenServicioResponse)
def actualizar_ods(
    ods_id: int,
    datos: OrdenServicioUpdate,
    db: Session = Depends(get_db)
):
    o = db.query(OrdenServicio).filter(OrdenServicio.ods_id == ods_id).first()
    
    if not o:
        raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")

    try:
        for key, value in datos.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(o, key, value)

        db.commit()
        db.refresh(o)

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
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error de integridad: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar ODS: {str(e)}")


@router.delete("/{ods_id}", status_code=204)
def eliminar_ods(ods_id: int, db: Session = Depends(get_db)):
    o = db.query(OrdenServicio).filter(OrdenServicio.ods_id == ods_id).first()
    
    if not o:
        raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")

    db.delete(o)
    db.commit()
    return None