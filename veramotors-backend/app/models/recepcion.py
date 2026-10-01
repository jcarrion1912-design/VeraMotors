from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Recepcion(Base):
    __tablename__ = "recepciones"

    recepcion_id = Column(BigInteger, primary_key=True, index=True)
    compra_id = Column(
        BigInteger,
        ForeignKey("compras.compra_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    proveedor_id = Column(
        BigInteger,
        ForeignKey("proveedores.proveedor_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_recepcion = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    estado = Column(String(30), nullable=False, default="Registrada")
    observaciones = Column(Text, nullable=True)

    compra = relationship("Compra", foreign_keys=[compra_id], lazy="joined")
    proveedor = relationship("Proveedor", foreign_keys=[proveedor_id], lazy="joined")
    detalles = relationship("DetalleRecepcion", back_populates="recepcion", cascade="all, delete-orphan")
