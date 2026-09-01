from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    Boolean
)

from app.database import Base


class CuentaBancaria(Base):

    __tablename__ = "cuentas_bancarias"

    cuenta_bancaria_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    banco = Column(
        String(100),
        nullable=False
    )

    nombre_cuenta = Column(
        String(150),
        nullable=False
    )

    numero_cuenta = Column(
        String(50),
        nullable=False,
        unique=True
    )

    tipo_cuenta = Column(
        String(30),
        nullable=False
    )

    moneda = Column(
        String(10),
        nullable=False,
        default="PEN"
    )

    saldo_actual = Column(
        Numeric(14, 2),
        nullable=False,
        default=0
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )
