from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, computed_field


class DetalleCompraCreate(BaseModel):
    item_id: int = Field(..., gt=0)
    cantidad: Decimal = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal("0"), ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)


class InventarioCompraResponse(BaseModel):
    item_id: int
    codigo_referencia: str
    nombre_nomenclatura: str
    marca: Optional[str] = None
    stock_actual: Decimal

    class Config:
        from_attributes = True


class CompraBase(BaseModel):
    codigo_compra: Optional[str] = Field(default=None, max_length=50)
    proveedor_id: int
    usuario_id: int
    tipo_comprobante: Optional[str] = None
    numero_comprobante: Optional[str] = None
    subtotal: Decimal = Field(default=Decimal("0"), ge=0)
    impuestos: Decimal = Field(default=Decimal("0"), ge=0)
    descuentos: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)
    estado: str = Field(default="Registrada")
    observaciones: Optional[str] = None


class DetalleCompraResponse(DetalleCompraCreate):
    detalle_compra_id: int
    compra_id: int
    item: InventarioCompraResponse

    @computed_field
    @property
    def descripcion(self) -> str:
        return self.item.nombre_nomenclatura

    @computed_field
    @property
    def codigo_referencia(self) -> str:
        return self.item.codigo_referencia

    class Config:
        from_attributes = True


class CompraCreate(CompraBase):
    detalles: List[DetalleCompraCreate] = Field(default_factory=list)


class CompraResponse(CompraBase):
    compra_id: int
    fecha_compra: datetime
    detalles: List[DetalleCompraResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
