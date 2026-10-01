from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PagoProveedorBase(BaseModel):
    factura_proveedor_id: int
    usuario_id: int
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str = Field(default="Transferencia", max_length=30)
    observaciones: Optional[str] = None


class PagoProveedorCreate(PagoProveedorBase):
    pass


class PagoProveedorResponse(PagoProveedorBase):
    pago_proveedor_id: int
    fecha: datetime

    class Config:
        from_attributes = True
