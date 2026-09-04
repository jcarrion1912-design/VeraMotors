from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DetalleNotaDebitoBase(BaseModel):
    item_id: int | None = None
    descripcion: str = Field(..., min_length=1, max_length=300)
    cantidad: Decimal = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    impuesto: Decimal = Field(..., ge=0)
    total: Decimal = Field(..., ge=0)


class DetalleNotaDebitoResponse(DetalleNotaDebitoBase):
    detalle_nota_debito_id: int
    nota_debito_id: int

    class Config:
        from_attributes = True


class NotaDebitoCreate(BaseModel):
    factura_id: int
    cliente_id: int
    tipo_nota: str = Field(..., max_length=50)

    codigo_motivo: str = Field(..., max_length=10)
    motivo: str = Field(..., min_length=1, max_length=255)

    subtotal: Decimal = Field(..., ge=0)
    impuestos: Decimal = Field(..., ge=0)
    total: Decimal = Field(..., ge=0)

    detalles: list[DetalleNotaDebitoBase] = Field(
        default_factory=list
    )


class NotaDebitoResponse(BaseModel):
    nota_debito_id: int
    factura_id: int
    cliente_id: int

    tipo_nota: str
    serie: str
    correlativo: int
    numero_nota: str

    fecha_emision: datetime

    codigo_motivo: str
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

    detalles: list[DetalleNotaDebitoResponse] = Field(
        default_factory=list
    )

    class Config:
        from_attributes = True