from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleFactura(Base):

    __tablename__ = "detalle_factura"

    detalle_factura_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    factura_id = Column(
        BigInteger,
        ForeignKey(
            "facturas.factura_id",
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
        nullable=False
    )

    precio_unitario = Column(
        Numeric(12, 2),
        nullable=False
    )

    descuento = Column(
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
        nullable=False
    )

    factura = relationship(
        "Factura",
        back_populates="detalles"
    )