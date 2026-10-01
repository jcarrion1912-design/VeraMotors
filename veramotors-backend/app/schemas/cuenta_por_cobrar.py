from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class CuentaPorCobrarResponse(BaseModel):
    cuenta_cobrar_id: int
    factura_id: int
    numero_comprobante: str
    tipo_comprobante: str
    cliente_id: int
    cliente_nombre: str
    fecha_emision: datetime
    fecha_vencimiento: datetime
    monto_total: Decimal
    monto_pagado: Decimal
    saldo: Decimal
    estado: str
    estado_pago_factura: str
    metodo_pago: str

    class Config:
        from_attributes = True
