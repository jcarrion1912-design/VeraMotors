from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class DetalleRemisionCreate(BaseModel):
    factura_detalle_id: int
    cantidad: Decimal = Field(..., gt=0)


class DetalleRemisionResponse(BaseModel):
    detalle_remision_id: int
    remision_id: int
    factura_detalle_id: Optional[int] = None
    item_id: Optional[int] = None
    descripcion: str
    cantidad: Decimal

    class Config:
        from_attributes = True


class RemisionCreate(BaseModel):
    factura_id: int
    tipo_remision: str = Field(default="Remisión de Bienes", min_length=1, max_length=30)
    motivo_traslado: str = Field(..., min_length=1, max_length=100)
    punto_partida: Optional[str] = Field(default=None, max_length=255)
    punto_llegada: str = Field(..., min_length=1, max_length=255)
    vehiculo_id: Optional[int] = None
    detalles: List[DetalleRemisionCreate] = Field(..., min_length=1)


class RemisionEstadoUpdate(BaseModel):
    estado: str = Field(..., min_length=1, max_length=30)


class DespachoRequest(BaseModel):
    usuario_id: int


class RemisionResponse(BaseModel):
    remision_id: int
    cliente_id: int
    vehiculo_id: Optional[int] = None
    ods_id: Optional[int] = None
    factura_id: Optional[int] = None
    usuario_despacho_id: Optional[int] = None
    fecha_despacho: Optional[datetime] = None
    tipo_remision: str
    serie: str
    correlativo: int
    numero_remision: str
    fecha_emision: datetime
    motivo_traslado: str
    punto_partida: Optional[str] = None
    punto_llegada: Optional[str] = None
    estado: str
    estado_sunat: str
    codigo_sunat: Optional[str] = None
    respuesta_sunat: Optional[str] = None
    fecha_envio_sunat: Optional[datetime] = None
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    numero_comprobante: Optional[str] = None
    detalles: List[DetalleRemisionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
