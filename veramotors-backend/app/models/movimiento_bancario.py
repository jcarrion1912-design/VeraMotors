from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.sql import func

from app.database import Base


class MovimientoBancario(Base):

    __tablename__ = "movimientos_bancarios"

    movimiento_bancario_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    cuenta_bancaria_id = Column(
        BigInteger,
        ForeignKey(
            "cuentas_bancarias.cuenta_bancaria_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
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

    fecha = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    tipo_movimiento = Column(
        String(20),
        nullable=False
    )

    concepto = Column(
        String(255),
        nullable=False
    )

    monto = Column(
        Numeric(14, 2),
        nullable=False
    )

    referencia = Column(
        String(100),
        nullable=True
    )

    observaciones = Column(
        Text,
        nullable=True
    )
