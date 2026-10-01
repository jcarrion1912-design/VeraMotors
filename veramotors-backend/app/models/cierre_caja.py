from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from sqlalchemy.sql import func

from app.database import Base


class CierreCaja(Base):

    __tablename__ = "cierres_caja"

    cierre_caja_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    fecha_apertura = Column(
        DateTime,
        nullable=False
    )

    fecha_cierre = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    usuario_id = Column(
        BigInteger,
        ForeignKey(
            "usuarios.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    usuario_cierre_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=True
    )

    monto_inicial = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_efectivo = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_yape = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_plin = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_tarjeta = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_transferencia = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_otros = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    cantidad_operaciones = Column(
        BigInteger,
        nullable=False,
        default=0
    )

    total_ventas = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    monto_real = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    diferencia = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    observaciones = Column(
        String,
        nullable=True
    )

    estado = Column(
        String(20),
        nullable=False,
        default="Cerrada"
    )

    pagos = relationship("Pago", back_populates="cierre_caja")