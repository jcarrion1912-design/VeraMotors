from typing import Optional
from pydantic import BaseModel, Field


class ClienteBase(BaseModel):
    tipo_persona: str = Field(..., max_length=20)
    documento_identidad: str = Field(..., max_length=20)
    nombre_razon_social: str = Field(..., max_length=200)
    direccion_ubigeo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    cliente_id: int

    class Config:
        from_attributes = True
