from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class OrdenServicioBase(BaseModel):
    codigo_ods: Optional[str] = None
    numero_ticket: Optional[str] = None
    cita_id: Optional[int] = None
    cliente_id: int
    vehiculo_id: int
    cotizacion_id: Optional[int] = None
    asesor_id: int
    tecnico_id: int
    estado_actual: str = "Pendiente"
    tipo_procedimiento: Optional[str] = None
    kilometraje_ingreso: Optional[int] = None
    inspeccion_json: Optional[Any] = None
    estado_aprobacion_cliente: str = "Pendiente"


class OrdenServicioUpdate(BaseModel):
    codigo_ods: Optional[str] = None
    numero_ticket: Optional[str] = None
    cita_id: Optional[int] = None
    cliente_id: Optional[int] = None
    vehiculo_id: Optional[int] = None
    cotizacion_id: Optional[int] = None
    asesor_id: Optional[int] = None
    tecnico_id: Optional[int] = None
    estado_actual: Optional[str] = None
    tipo_procedimiento: Optional[str] = None
    kilometraje_ingreso: Optional[int] = None
    inspeccion_json: Optional[Any] = None
    estado_aprobacion_cliente: Optional[str] = None


class OrdenServicioResponse(OrdenServicioBase):
    ods_id: int
    fecha_ingreso: datetime
    cliente_nombre: Optional[str] = None
    vehiculo_placa: Optional[str] = None

    class Config:
        from_attributes = True

