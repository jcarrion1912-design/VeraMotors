from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class RepuestoDiagnosticoCreate(BaseModel):
    item_id: int
    cantidad: Decimal = Field(..., gt=0)


class RepuestoDiagnosticoResponse(BaseModel):
    item_id: int
    codigo_referencia: str
    nombre_nomenclatura: str
    cantidad: Decimal


class DiagnosticoCreate(BaseModel):
    falla_reportada: str = Field(..., min_length=1, max_length=4000)
    comentarios_tecnico: Optional[str] = None
    fotos_urls: List[str] = Field(default_factory=list)
    tiempo_estimado_horas: Optional[Decimal] = Field(default=None, ge=0)
    horas_hombre: Optional[Decimal] = Field(default=None, ge=0)
    repuestos: List[RepuestoDiagnosticoCreate] = Field(default_factory=list)


class DiagnosticoResponse(BaseModel):
    diagnostico_id: int
    ods_id: int
    falla_reportada: str
    comentarios_tecnico: Optional[str] = None
    fotos_urls: Optional[list[str]] = None
    tiempo_estimado_horas: Optional[Decimal] = None
    horas_hombre: Optional[Decimal] = None
    fecha_diagnostico: datetime
    repuestos: List[RepuestoDiagnosticoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DiagnosticosODSResponse(BaseModel):
    ods_id: int
    diagnosticos: List[DiagnosticoResponse] = Field(default_factory=list)
    repuestos: List[RepuestoDiagnosticoResponse] = Field(default_factory=list)
