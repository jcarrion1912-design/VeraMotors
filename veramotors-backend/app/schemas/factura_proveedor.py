from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class DetalleFacturaProveedorBase(BaseModel):
    descripcion: str = Field(..., min_length=1, max_length=255)
    cantidad: Decimal = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(..., ge=0)


class DetalleFacturaProveedorCreate(DetalleFacturaProveedorBase):
    pass


class FacturaProveedorBase(BaseModel):
    proveedor_id: int
    compra_id: Optional[int] = None
    recepcion_id: Optional[int] = None
    tipo_comprobante: str = Field(..., min_length=1, max_length=30)
    serie: str = Field(..., min_length=1, max_length=20)
    numero: str = Field(..., min_length=1, max_length=30)
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime] = None
    subtotal: Decimal = Field(default=Decimal("0"), ge=0)
    igv: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)
    moneda: str = Field(default="PEN", max_length=10)
    estado: str = Field(default="Pendiente", max_length=30)
    observaciones: Optional[str] = None


class FacturaProveedorCreate(FacturaProveedorBase):
    detalles: List[DetalleFacturaProveedorCreate] = Field(default_factory=list)


class FacturaProveedorResponse(FacturaProveedorBase):
    factura_proveedor_id: int
    detalles: List[DetalleFacturaProveedorBase] = Field(default_factory=list)

    class Config:
        from_attributes = True
