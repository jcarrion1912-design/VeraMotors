from sqlalchemy import Column, BigInteger, Numeric, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleRecepcion(Base):
    __tablename__ = "recepciones_detalle"

    detalle_recepcion_id = Column(BigInteger, primary_key=True, index=True)
    recepcion_id = Column(
        BigInteger,
        ForeignKey("recepciones.recepcion_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    item_id = Column(BigInteger, nullable=True)
    descripcion = Column(String(255), nullable=False)
    cantidad_ordenada = Column(Numeric(12, 2), nullable=False, default=0)
    cantidad_recibida = Column(Numeric(12, 2), nullable=False, default=0)
    cantidad_pendiente = Column(Numeric(12, 2), nullable=False, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    recepcion = relationship("Recepcion", back_populates="detalles")
