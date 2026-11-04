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
    recepcion_id: Optional[int] = Field(default=None, gt=0)
    compra_id: Optional[int] = Field(default=None, gt=0)
    proveedor_id: Optional[int] = Field(default=None, gt=0)
    usuario_id: int
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    confirmar: bool = True
    detalles: List[DetalleRecepcionCreate] = Field(default_factory=list)


class DetalleRecepcionResponse(DetalleRecepcionBase):
    detalle_recepcion_id: int

    class Config:
        from_attributes = True


class RecepcionResponse(BaseModel):
    recepcion_id: int
    compra_id: int
    proveedor_id: int
    usuario_id: int
    fecha_recepcion: datetime
    estado: str
    observaciones: Optional[str] = None
    detalles: List[DetalleRecepcionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
