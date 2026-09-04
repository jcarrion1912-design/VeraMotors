from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class DetalleNotaDebito(Base):

    __tablename__ = "detalle_nota_debito"

    detalle_nota_debito_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    nota_debito_id = Column(
        BigInteger,
        ForeignKey(
            "notas_debito.nota_debito_id",
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

    nota_debito = relationship(
        "NotaDebito",
        back_populates="detalles"
    )