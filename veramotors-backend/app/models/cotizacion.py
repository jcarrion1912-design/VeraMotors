from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    cotizacion_id = Column(BigInteger, primary_key=True, index=True)
    codigo_cotizacion = Column(String(50), nullable=False, unique=True)
    cliente_id = Column(
        BigInteger,
        ForeignKey("clientes.cliente_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    vehiculo_id = Column(
        BigInteger,
        ForeignKey("vehiculos.vehiculo_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    fecha = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    total = Column(Numeric(12, 2), nullable=False, default=0)
    estado = Column(String(20), nullable=False, default="Pendiente")
    aprobado_por = Column(BigInteger, ForeignKey("usuarios.user_id"), nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    rechazado_por = Column(BigInteger, ForeignKey("usuarios.user_id"), nullable=True)
    fecha_rechazo = Column(DateTime, nullable=True)
    motivo_rechazo = Column(String(255), nullable=True)

    cliente = relationship("Cliente", foreign_keys=[cliente_id], lazy="joined")
    vehiculo = relationship("Vehiculo", foreign_keys=[vehiculo_id], lazy="joined")
    detalles = relationship("DetalleCotizacion", back_populates="cotizacion", cascade="all, delete-orphan")
