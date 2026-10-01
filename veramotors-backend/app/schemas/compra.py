from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CompraBase(BaseModel):
    codigo_compra: Optional[str] = Field(default=None, max_length=50)
    proveedor_id: int
    usuario_id: int
    tipo_comprobante: Optional[str] = None
    numero_comprobante: Optional[str] = None
    subtotal: Decimal = Field(default=Decimal("0"), ge=0)
    impuestos: Decimal = Field(default=Decimal("0"), ge=0)
    descuentos: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)
    estado: str = Field(default="Registrada")
    observaciones: Optional[str] = None


class CompraCreate(CompraBase):
    pass


class CompraResponse(CompraBase):
    compra_id: int
    fecha_compra: datetime

    class Config:
        from_attributes = True
