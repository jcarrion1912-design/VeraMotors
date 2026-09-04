from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class DetalleNotaCredito(Base):

    __tablename__ = "detalle_nota_credito"

    detalle_nota_credito_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    nota_credito_id = Column(
        BigInteger,
        ForeignKey(
            "notas_credito.nota_credito_id",
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    item_id = Column(
        BigInteger,
        ForeignKey(
            "inventario.item_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=True
    )

    descripcion = Column(
        String(300),
        nullable=False
    )

    cantidad = Column(
        Numeric(12, 2),
        nullable=False,
        default=1
    )

    precio_unitario = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    impuesto = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    nota_credito = relationship(
        "NotaCredito",
        back_populates="detalles"
    )