from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CitaCreate(BaseModel):

    cliente_id: int

    vehiculo_id: Optional[int] = None

    fecha_hora_inicio: datetime

    fecha_hora_fin: datetime

    estado: str = "Pendiente"

    observaciones: Optional[str] = None


class CitaResponse(CitaCreate):

    cita_id: int

    cliente_nombre: Optional[str] = None

    vehiculo_placa: Optional[str] = None

    cliente_nombre: Optional[str] = None

    vehiculo_placa: Optional[str] = None

    class Config:
        from_attributes = True