from pydantic import BaseModel, ConfigDict
from datetime import date, datetime, time
from typing import Optional


class MarcadoEntrada(BaseModel):
    user_id: int
    fecha: date
    observaciones: Optional[str] = None


class MarcadoSalida(BaseModel):
    asistencia_id: int


class ActualizarAsistencia(BaseModel):
    hora_entrada: Optional[time] = None
    hora_salida: Optional[time] = None
    estado: Optional[str] = None
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


class AsistenciaReporteResponse(BaseModel):
    asistencia_id: int
    user_id: int
    nombre_usuario: str
    rol_usuario: str
    fecha: date
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    estado: str
    observaciones: Optional[str] = None