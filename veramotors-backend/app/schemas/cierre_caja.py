from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================
# CREAR CIERRE
# ============================================================

class CierreCajaCreate(BaseModel):

    fecha_apertura: datetime

    usuario_id: int

    monto_inicial: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_efectivo: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_yape: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_plin: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_tarjeta: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_transferencia: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_ventas: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    total_esperado: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    monto_real: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    diferencia: Decimal = Decimal("0")

    observaciones: Optional[str] = None

    estado: str = "Cerrada"


# ============================================================
# RESPUESTA
# ============================================================

class CierreCajaResponse(BaseModel):

    cierre_caja_id: int

    fecha_apertura: datetime

    fecha_cierre: datetime

    usuario_id: int

    monto_inicial: Decimal

    total_efectivo: Decimal

    total_yape: Decimal

    total_plin: Decimal

    total_tarjeta: Decimal

    total_transferencia: Decimal

    total_ventas: Decimal

    total_esperado: Decimal

    monto_real: Decimal

    diferencia: Decimal

    observaciones: Optional[str]

    estado: str

    class Config:
        from_attributes = True