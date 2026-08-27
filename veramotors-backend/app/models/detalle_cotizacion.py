from sqlalchemy import Column, BigInteger, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class DetalleCotizacion(Base):
    __tablename__ = "detalle_cotizacion"

    detalle_cotizacion_id = Column(BigInteger, primary_key=True, index=True)
    cotizacion_id = Column(
        BigInteger,
        ForeignKey("cotizaciones.cotizacion_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False
    )
    item_id = Column(BigInteger, nullable=True)
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Numeric(10, 2), nullable=False, default=1)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    descuento = Column(Numeric(12, 2), nullable=False, default=0)
    impuesto = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    cotizacion = relationship("Cotizacion", back_populates="detalles")
