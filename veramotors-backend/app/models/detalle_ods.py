from sqlalchemy import Column, BigInteger, Numeric, ForeignKey

from app.database import Base


class DetalleODS(Base):
    __tablename__ = "detalle_ods"

    detalle_id = Column(BigInteger, primary_key=True, index=True)
    ods_id = Column(
        BigInteger,
        ForeignKey("ordenes_servicio.ods_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id = Column(
        BigInteger,
        ForeignKey("inventario.item_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    cantidad = Column(Numeric(12, 2), nullable=False)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    impuesto = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
