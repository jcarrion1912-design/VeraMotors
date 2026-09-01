from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class MovimientoBancarioBase(BaseModel):
    cuenta_bancaria_id: int
    usuario_id: int
    tipo_movimiento: str = Field(..., max_length=20)
    concepto: str = Field(..., max_length=255)
    monto: Decimal = Field(..., gt=0)
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class MovimientoBancarioCreate(MovimientoBancarioBase):
    pass


class MovimientoBancarioResponse(MovimientoBancarioBase):
    movimiento_bancario_id: int
    fecha: datetime

    class Config:
        from_attributes = True
