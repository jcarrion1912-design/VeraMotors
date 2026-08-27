from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    ForeignKey
)

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