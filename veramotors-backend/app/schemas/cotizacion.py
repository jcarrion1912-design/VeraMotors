from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class DetalleCotizacionBase(BaseModel):
    item_id: Optional[int] = None
    descripcion: str = Field(..., min_length=1, max_length=255)
    cantidad: Decimal = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal("0"), ge=0)
    impuesto: Decimal = Field(default=Decimal("0"), ge=0)
    total: Optional[Decimal] = Field(default=Decimal("0"), ge=0)


class DetalleCotizacionResponse(DetalleCotizacionBase):
    detalle_cotizacion_id: int
    cotizacion_id: int

    class Config:
        from_attributes = True


class CotizacionBase(BaseModel):
    cliente_id: int
    vehiculo_id: int
    subtotal: Optional[Decimal] = Field(default=Decimal("0"), ge=0)
    descuentos: Optional[Decimal] = Field(default=Decimal("0"), ge=0)
    impuestos: Optional[Decimal] = Field(default=Decimal("0"), ge=0)
    total: Decimal = Field(..., ge=0)
    estado: str = Field(default="Pendiente", max_length=20)
    observaciones: Optional[str] = None


class CotizacionCreate(CotizacionBase):
    detalles: Optional[List[DetalleCotizacionBase]] = []


class CotizacionAprobacionRequest(BaseModel):
    usuario_id: int
    motivo: Optional[str] = None


class CotizacionResponse(CotizacionBase):
    cotizacion_id: int
    id: Optional[int] = None
    codigo_cotizacion: str
    fecha: datetime
    aprobado_por: Optional[int] = None
    fecha_aprobacion: Optional[datetime] = None
    rechazado_por: Optional[int] = None
    fecha_rechazo: Optional[datetime] = None
    motivo_rechazo: Optional[str] = None
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    vehiculo_placa: Optional[str] = None
    vehiculo_modelo: Optional[str] = None
    detalles: Optional[List[DetalleCotizacionResponse]] = []

    class Config:
        from_attributes = True


