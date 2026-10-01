from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Pago(Base):
    __tablename__ = "pagos"

    pago_id = Column(BigInteger, primary_key=True, index=True)
    cuenta_cobrar_id = Column(
        BigInteger,
        ForeignKey("cuentas_por_cobrar.cuenta_cobrar_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    cierre_caja_id = Column(
        BigInteger,
        ForeignKey("cierres_caja.cierre_caja_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    monto = Column(Numeric(12, 2), nullable=False)
    metodo_pago = Column(String(30), nullable=False)
    observaciones = Column(Text, nullable=True)

    cuenta = relationship("CuentaPorCobrar", back_populates="pagos")
    cierre_caja = relationship("CierreCaja", back_populates="pagos")
    usuario = relationship("Usuario")

    __table_args__ = (
        CheckConstraint("monto > 0", name="chk_pagos_monto"),
        CheckConstraint(
            "metodo_pago IN ('Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia', 'Otro')",
            name="chk_pagos_metodo",
        ),
    )
