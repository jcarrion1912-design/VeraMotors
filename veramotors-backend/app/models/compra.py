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


class Compra(Base):

    __tablename__ = "compras"

    compra_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    codigo_compra = Column(
        String(50),
        nullable=False,
        unique=True
    )

    proveedor_id = Column(
        BigInteger,
        ForeignKey(
            "proveedores.proveedor_id",
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

    fecha_compra = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    tipo_comprobante = Column(
        String(30),
        nullable=True
    )

    numero_comprobante = Column(
        String(50),
        nullable=True
    )

    subtotal = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    impuestos = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    descuentos = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    estado = Column(
        String(30),
        nullable=False,
        default="Registrada"
    )

    observaciones = Column(
        Text,
        nullable=True
    )
