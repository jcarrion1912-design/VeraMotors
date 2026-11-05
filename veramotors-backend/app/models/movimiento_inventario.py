from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    movimiento_id = Column(BigInteger, primary_key=True, index=True)
    item_id = Column(
        BigInteger,
        ForeignKey("inventario.item_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    responsable_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    ods_id = Column(
        BigInteger,
        ForeignKey("ordenes_servicio.ods_id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fecha_movimiento = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    tipo_movimiento = Column(String(30), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False, default=0)
    stock_anterior = Column(Numeric(12, 2), nullable=False, default=0)
    stock_nuevo = Column(Numeric(12, 2), nullable=False, default=0)
    referencia = Column(String(100), nullable=True)
    observaciones = Column(Text, nullable=True)

    item = relationship("Inventario", foreign_keys=[item_id], lazy="joined")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], lazy="joined")
    responsable = relationship("Usuario", foreign_keys=[responsable_id], lazy="joined")
    ods = relationship("OrdenServicio", foreign_keys=[ods_id], lazy="joined")
