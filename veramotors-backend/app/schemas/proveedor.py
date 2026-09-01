from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProveedorBase(BaseModel):
    ruc: str = Field(..., max_length=11)
    razon_social: str = Field(..., max_length=200)
    nombre_comercial: Optional[str] = None
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = Field(default=True)


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorResponse(ProveedorBase):
    proveedor_id: int
    fecha_registro: datetime

    class Config:
        from_attributes = True
