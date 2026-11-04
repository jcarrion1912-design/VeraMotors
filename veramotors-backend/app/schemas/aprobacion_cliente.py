from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel


class EnlaceAprobacionResponse(BaseModel):
    token: str
    vence: datetime


class ItemAprobacion(BaseModel):
    descripcion: str
    cantidad: Decimal
    total: Decimal


class ResumenAprobacion(BaseModel):
    """Solo lo que el cliente necesita para decidir: sin documentos, teléfonos ni datos internos."""

    codigo_ods: Optional[str] = None
    cliente_nombre: Optional[str] = None
    vehiculo: Optional[str] = None
    placa: Optional[str] = None
    procedimiento: Optional[str] = None
    motivo: Optional[str] = None
    estado_aprobacion: str
    items: List[ItemAprobacion] = []
    total: Optional[Decimal] = None


class DecisionAprobacion(BaseModel):
    decision: Literal["Aprobado", "Denegado"]
