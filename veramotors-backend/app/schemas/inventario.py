from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class InventarioBase(BaseModel):
    tipo: str = Field(..., max_length=50)
    categoria_id: int
    codigo_referencia: str = Field(..., max_length=100)
    nombre_nomenclatura: str = Field(..., max_length=200)
    unidad_medida: str = Field(..., max_length=30)
    costo_compra: Decimal = Field(default=Decimal("0"), ge=0)
    margen_ganancia: Decimal = Field(default=Decimal("0"), ge=0)
    precio_venta: Decimal = Field(default=Decimal("0"), ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)


class InventarioCreate(InventarioBase):
    pass


class InventarioResponse(InventarioBase):
    item_id: int
    categoria_nombre: Optional[str] = None

    class Config:
        from_attributes = True
