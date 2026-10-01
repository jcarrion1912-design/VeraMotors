from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PagoCreate(BaseModel):
    factura_id: int
    usuario_id: int
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str = Field(..., min_length=1, max_length=30)
    observaciones: Optional[str] = Field(default=None, max_length=2000)


class PagoResponse(BaseModel):
    pago_id: int
    cuenta_cobrar_id: int
    factura_id: int
    cierre_caja_id: int
    usuario_id: int
    fecha: datetime
    monto: Decimal
    metodo_pago: str
    observaciones: Optional[str] = None
    numero_comprobante: str
    cliente_nombre: str

    class Config:
        from_attributes = True
