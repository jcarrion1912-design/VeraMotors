from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional

class MarcadoEntrada(BaseModel):
    user_id: int
    observaciones: Optional[str] = None

class MarcadoSalida(BaseModel):
    asistencia_id: int
    observaciones: Optional[str] = None

class AsistenciaResponse(BaseModel):
    asistencia_id: int
    user_id: int
    fecha: date
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    estado: str
    observaciones: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)