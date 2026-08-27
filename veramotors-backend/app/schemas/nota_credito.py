from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class NotaCreditoCreate(BaseModel):

    factura_id: int

    cliente_id: int

    tipo_nota: str = Field(
        ...,
        max_length=50
    )

    motivo: str = Field(
        ...,
        min_length=1,
        max_length=255
    )

    subtotal: Decimal = Field(
        ...,
        ge=0
    )

    impuestos: Decimal = Field(
        ...,
        ge=0
    )

    total: Decimal = Field(
        ...,
        ge=0
    )


class NotaCreditoResponse(BaseModel):

    nota_credito_id: int

    factura_id: int

    cliente_id: int

    tipo_nota: str

    serie: str

    correlativo: int

    numero_nota: str

    fecha_emision: datetime

    motivo: str

    subtotal: Decimal

    impuestos: Decimal

    total: Decimal

    estado_sunat: str = "Pendiente"
    codigo_sunat: str | None = None
    respuesta_sunat: str | None = None
    fecha_envio_sunat: datetime | None = None
    cliente_nombre: str | None = None
    numero_factura: str | None = None

    class Config:
        from_attributes = True