from sqlalchemy import Column, BigInteger, Numeric, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class CuentaPorCobrar(Base):
    __tablename__ = "cuentas_por_cobrar"

    cuenta_cobrar_id = Column(BigInteger, primary_key=True, index=True)
    factura_id = Column(
        BigInteger,
        ForeignKey("facturas.factura_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    cliente_id = Column(
        BigInteger,
        ForeignKey("clientes.cliente_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_emision = Column(DateTime, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=False)
    monto_total = Column(Numeric(12, 2), nullable=False)
    monto_pagado = Column(Numeric(12, 2), nullable=False, default=0)
    saldo = Column(Numeric(12, 2), nullable=False)
    estado = Column(String(30), nullable=False, default="Pendiente")

    pagos = relationship("Pago", back_populates="cuenta", cascade="all, delete-orphan")
