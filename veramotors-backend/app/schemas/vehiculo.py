from typing import Optional
from pydantic import BaseModel, Field


class VehiculoBase(BaseModel):
    cliente_id: int
    tipo_vehiculo: str = Field(..., max_length=50)
    placa: str = Field(..., max_length=20)
    marca: str = Field(..., max_length=80)
    modelo: str = Field(..., max_length=80)
    anio: Optional[int] = None
    color: Optional[str] = None
    vin: Optional[str] = None


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoResponse(VehiculoBase):
    vehiculo_id: int
    cliente_nombre: Optional[str] = None

    class Config:
        from_attributes = True
