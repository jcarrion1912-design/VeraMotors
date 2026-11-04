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
    item_id = Column(
        BigInteger,
        ForeignKey("inventario.item_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    cantidad = Column(Numeric(12, 2), nullable=False, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    descuento = Column(Numeric(12, 2), nullable=False, default=0)
    impuesto = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    compra = relationship("Compra", back_populates="detalles")
<<<<<<< HEAD
    item = relationship("Inventario", foreign_keys=[item_id], lazy="joined")
=======
    item = relationship(
        "Inventario",
        primaryjoin="foreign(DetalleCompra.item_id) == Inventario.item_id",
        viewonly=True,
    )

    @property
    def descripcion(self):
        return self.item.nombre_nomenclatura if self.item else None

    @property
    def codigo_referencia(self):
        return self.item.codigo_referencia if self.item else None
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
