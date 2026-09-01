from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class CuentaBancariaBase(BaseModel):
    banco: str = Field(..., max_length=100)
    nombre_cuenta: str = Field(..., max_length=150)
    numero_cuenta: str = Field(..., max_length=50)
    tipo_cuenta: str = Field(..., max_length=30)
    moneda: str = Field(default="PEN", max_length=10)
    saldo_actual: Decimal = Field(default=Decimal("0"), ge=0)
    activo: bool = Field(default=True)


class CuentaBancariaCreate(CuentaBancariaBase):
    pass


class CuentaBancariaResponse(CuentaBancariaBase):
    cuenta_bancaria_id: int

    class Config:
        from_attributes = True
