from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class OrdenServicioBase(BaseModel):
    codigo_ods: str
    numero_ticket: str
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


class OrdenServicioResponse(OrdenServicioBase):
    ods_id: int
    fecha_ingreso: datetime
    cliente_nombre: Optional[str] = None
    vehiculo_placa: Optional[str] = None

    class Config:
        from_attributes = True
