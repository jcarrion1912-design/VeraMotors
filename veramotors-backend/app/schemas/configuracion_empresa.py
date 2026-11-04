from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ConfiguracionEmpresaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    desarrollador: Optional[str] = Field(default=None, max_length=200)
    ruc: str = Field(..., pattern=r"^\d{11}$")
    direccion: Optional[str] = Field(default=None, max_length=255)
    telefono: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=150)
    igv: Decimal = Field(default=Decimal("18"), ge=0, le=100)
    moneda: str = Field(default="PEN - Soles (S/)", max_length=50)


class ConfiguracionEmpresaUpdate(ConfiguracionEmpresaBase):
    pass


class ConfiguracionEmpresaResponse(ConfiguracionEmpresaBase):
    empresa_id: int

    class Config:
        from_attributes = True
