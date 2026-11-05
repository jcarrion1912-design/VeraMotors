from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field, field_validator, model_validator


class DetalleFacturaProveedorBase(BaseModel):
    descripcion: str = Field(..., min_length=1, max_length=255)
    cantidad: Decimal = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)
    total: Optional[Decimal] = Field(default=None, ge=0)

    @field_validator("descripcion")
    @classmethod
    def validar_descripcion(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("La descripción del detalle es obligatoria.")
        return valor


class DetalleFacturaProveedorCreate(DetalleFacturaProveedorBase):
    pass


class DetalleFacturaProveedorResponse(DetalleFacturaProveedorBase):
    total: Decimal = Field(..., ge=0)


class FacturaProveedorBase(BaseModel):
    proveedor_id: int = Field(..., gt=0)
    compra_id: Optional[int] = Field(default=None, gt=0)
    recepcion_id: Optional[int] = Field(default=None, gt=0)
    tipo_comprobante: str = Field(default="Factura", min_length=1, max_length=30)
    serie: str = Field(..., min_length=1, max_length=20)
    numero: str = Field(..., min_length=1, max_length=30)
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime] = None
    subtotal: Decimal = Field(default=Decimal("0"), ge=0)
    igv: Decimal = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(default=Decimal("0"), ge=0)
    moneda: str = Field(default="PEN", max_length=10)
    estado: str = Field(default="Pendiente", max_length=30)
    observaciones: Optional[str] = None

    @field_validator("tipo_comprobante", "serie", "numero")
    @classmethod
    def limpiar_documento(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("Este campo del comprobante es obligatorio.")
        return valor

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_vencimiento and self.fecha_vencimiento < self.fecha_emision:
            raise ValueError("La fecha de vencimiento no puede ser anterior a la fecha de emisión.")
        return self


class FacturaProveedorCreate(FacturaProveedorBase):
    @field_validator("tipo_comprobante")
    @classmethod
    def validar_tipo_factura(cls, valor: str) -> str:
        if valor.casefold() != "factura":
            raise ValueError("Este módulo solo permite registrar facturas.")
        return "Factura"

    ruc_comprobante: Optional[str] = Field(
        default=None,
        min_length=11,
        max_length=11,
        pattern=r"^\d{11}$",
    )
    detalles: List[DetalleFacturaProveedorCreate] = Field(default_factory=list)


class FacturaProveedorResponse(FacturaProveedorBase):
    factura_proveedor_id: int
    detalles: List[DetalleFacturaProveedorResponse] = Field(default_factory=list)

    @computed_field
    @property
    def codigo_interno(self) -> str:
        return f"FPROV-{self.factura_proveedor_id:04d}"

    class Config:
        from_attributes = True
