from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class InventarioBase(BaseModel):
    tipo: str = Field(..., max_length=50)
    categoria_id: int
    codigo_referencia: str = Field(..., max_length=100)
    nombre_nomenclatura: str = Field(..., max_length=200)
    unidad_medida: str = Field(..., max_length=30)

    marca: Optional[str] = Field(default=None, max_length=100)

    stock_actual: Decimal = Field(default=Decimal("0"), ge=0)
    stock_minimo: Decimal = Field(default=Decimal("0"), ge=0)

    costo_compra: Decimal = Field(default=Decimal("0"), ge=0)
    margen_ganancia: Decimal = Field(default=Decimal("0"), ge=0)
    precio_venta: Decimal = Field(default=Decimal("0"), ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)


class InventarioCreate(InventarioBase):
    pass


class InventarioUpdate(BaseModel):
    tipo: Optional[str] = Field(default=None, max_length=50)
    categoria_id: Optional[int] = None
    codigo_referencia: Optional[str] = Field(default=None, max_length=100)
    nombre_nomenclatura: Optional[str] = Field(default=None, max_length=200)
    unidad_medida: Optional[str] = Field(default=None, max_length=30)
    marca: Optional[str] = Field(default=None, max_length=100)

    stock_actual: Optional[Decimal] = Field(default=None, ge=0)
    stock_minimo: Optional[Decimal] = Field(default=None, ge=0)

    costo_compra: Optional[Decimal] = Field(default=None, ge=0)
    margen_ganancia: Optional[Decimal] = Field(default=None, ge=0)
    precio_venta: Optional[Decimal] = Field(default=None, ge=0)
    impuesto: Optional[Decimal] = Field(default=None, ge=0)


class InventarioResponse(InventarioBase):
    item_id: int
    activo: bool
    categoria_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class DetalleSalidaInventario(BaseModel):
    item_id: int = Field(..., gt=0)
    cantidad: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)


class SalidaInventarioCreate(BaseModel):
    usuario_id: int = Field(..., gt=0)
    referencia: str = Field(..., min_length=1, max_length=100)
    observaciones: Optional[str] = None
    detalles: List[DetalleSalidaInventario] = Field(..., min_length=1)