from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CajaAperturaCreate(BaseModel):
    usuario_id: int
    monto_inicial: Decimal = Field(default=Decimal("0"), ge=0)
    observaciones: Optional[str] = None


class CajaCierreCreate(BaseModel):
    usuario_id: int
    monto_real: Decimal = Field(..., ge=0)
    observaciones: Optional[str] = None


class CierreCajaResponse(BaseModel):
    cierre_caja_id: int
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    usuario_id: int
    usuario_cierre_id: Optional[int] = None
    monto_inicial: Decimal
    total_efectivo: Decimal
    total_yape: Decimal
    total_plin: Decimal
    total_tarjeta: Decimal
    total_transferencia: Decimal
    total_otros: Decimal
    cantidad_operaciones: int
    total_ventas: Decimal
    total_esperado: Decimal
    monto_real: Decimal
    diferencia: Decimal
    observaciones: Optional[str] = None
    estado: str
    usuario_nombre: Optional[str] = None
    usuario_cierre_nombre: Optional[str] = None
    caja_abierta: bool = False

    class Config:
        from_attributes = True
