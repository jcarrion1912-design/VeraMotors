from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class DetalleRecepcionBase(BaseModel):
    item_id: Optional[int] = None
    descripcion: str = Field(..., min_length=1, max_length=255)
    cantidad_ordenada: Decimal = Field(default=Decimal("0"), ge=0)
    cantidad_recibida: Decimal = Field(default=Decimal("0"), ge=0)
    cantidad_pendiente: Decimal = Field(default=Decimal("0"), ge=0)
    precio_unitario: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)


class DetalleRecepcionCreate(DetalleRecepcionBase):
    pass


class RecepcionCreate(BaseModel):
    compra_id: int
    proveedor_id: int
    usuario_id: int
    estado: str = Field(default="Confirmada")
    observaciones: Optional[str] = None
    confirmar: bool = True
    detalles: List[DetalleRecepcionCreate] = Field(default_factory=list)


class RecepcionResponse(BaseModel):
    recepcion_id: int
    compra_id: int
    proveedor_id: int
    usuario_id: int
    fecha_recepcion: datetime
    estado: str
    observaciones: Optional[str] = None
    detalles: List[DetalleRecepcionBase] = Field(default_factory=list)

    class Config:
        from_attributes = True
