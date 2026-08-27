from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


# ============================================================
# DETALLE DE FACTURA
# ============================================================

class DetalleFacturaBase(BaseModel):

    item_id: Optional[int] = None

    descripcion: str = Field(
        ...,
        min_length=1,
        max_length=300
    )

    cantidad: Decimal = Field(
        ...,
        gt=0
    )

    precio_unitario: Decimal = Field(
        ...,
        ge=0
    )

    descuento: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    impuesto: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total: Decimal = Field(
        ...,
        ge=0
    )


class DetalleFacturaResponse(DetalleFacturaBase):

    detalle_factura_id: int
    factura_id: int

    class Config:
        from_attributes = True


# ============================================================
# CREAR FACTURA
# ============================================================

class FacturaCreate(BaseModel):

    ods_id: Optional[int] = None

    cliente_id: int

    tipo_comprobante: str = Field(
        ...,
        max_length=20
    )

    metodo_pago: str = Field(
        ...,
        max_length=30
    )

    subtotal: Decimal = Field(
        ...,
        ge=0
    )

    impuestos: Decimal = Field(
        ...,
        ge=0
    )

    descuentos: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total: Decimal = Field(
        ...,
        ge=0
    )

    detalles: List[DetalleFacturaBase] = Field(
        ...,
        min_length=1
    )


# ============================================================
# RESPUESTA DE FACTURA
# ============================================================

class FacturaResponse(BaseModel):

    factura_id: int

    ods_id: Optional[int]

    cliente_id: int

    tipo_comprobante: str

    serie: str

    correlativo: int

    numero_comprobante: str

    fecha_emision: datetime

    metodo_pago: str

    subtotal: Decimal

    impuestos: Decimal

    descuentos: Decimal

    total: Decimal

    estado_pago: str

    estado_sunat: str

    codigo_sunat: Optional[str]

    respuesta_sunat: Optional[str]

    fecha_envio_sunat: Optional[datetime]

    detalles: List[DetalleFacturaResponse] = []

    class Config:
        from_attributes = True