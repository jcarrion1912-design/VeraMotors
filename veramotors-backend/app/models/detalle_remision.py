from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleRemision(Base):

    __tablename__ = "detalle_remision"

    detalle_remision_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    remision_id = Column(
        BigInteger,
        ForeignKey(
            "remisiones.remision_id",
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    factura_detalle_id = Column(
        BigInteger,
        ForeignKey(
            "detalle_factura.detalle_factura_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=True,
        unique=True,
        index=True
    )

    item_id = Column(
        BigInteger,
        nullable=True
    )

    descripcion = Column(
        String(255),
        nullable=False
    )

    cantidad = Column(
        Numeric(12, 2),
        nullable=False
    )

    remision = relationship("Remision", back_populates="detalles")
    factura_detalle = relationship("DetalleFactura", lazy="joined")