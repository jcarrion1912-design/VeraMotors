from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


# ============================================================
# DETALLE
# ============================================================

class DetalleRemisionCreate(BaseModel):

    item_id: Optional[int] = None

    descripcion: str = Field(
        ...,
        min_length=1,
        max_length=255
    )

    cantidad: Decimal = Field(
        ...,
        gt=0
    )


class DetalleRemisionResponse(DetalleRemisionCreate):

    detalle_remision_id: int

    remision_id: int

    class Config:
        from_attributes = True


# ============================================================
# CREAR REMISIÓN
# ============================================================

class RemisionCreate(BaseModel):

    cliente_id: int

    vehiculo_id: Optional[int] = None

    ods_id: Optional[int] = None

    tipo_remision: str = Field(
        default="Remisión de Bienes",
        max_length=30
    )

    motivo_traslado: str = Field(
        ...,
        max_length=100
    )

    punto_partida: Optional[str] = None

    punto_llegada: Optional[str] = None

    detalles: List[DetalleRemisionCreate] = Field(
        ...,
        min_length=1
    )


# ============================================================
# RESPUESTA
# ============================================================

class RemisionResponse(BaseModel):

    remision_id: int

    cliente_id: int

    vehiculo_id: Optional[int]

    ods_id: Optional[int]

    tipo_remision: str

    serie: str

    correlativo: int

    numero_remision: str

    fecha_emision: datetime

    motivo_traslado: str

    punto_partida: Optional[str]

    punto_llegada: Optional[str]

    estado: str

    estado_sunat: str

    codigo_sunat: Optional[str]

    respuesta_sunat: Optional[str]

    fecha_envio_sunat: Optional[datetime]

    detalles: List[DetalleRemisionResponse] = []

    class Config:
        from_attributes = True