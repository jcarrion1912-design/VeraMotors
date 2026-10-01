from sqlalchemy import Column, BigInteger, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleCompra(Base):
    __tablename__ = "detalle_compras"

    detalle_compra_id = Column(BigInteger, primary_key=True, index=True)
    compra_id = Column(
        BigInteger,
        ForeignKey("compras.compra_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    item_id = Column(BigInteger, nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    descuento = Column(Numeric(12, 2), nullable=False, default=0)
    impuesto = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    compra = relationship("Compra", back_populates="detalles")
