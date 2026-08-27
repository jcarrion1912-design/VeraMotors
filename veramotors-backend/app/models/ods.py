from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class OrdenServicio(Base):
    __tablename__ = "ordenes_servicio"

    ods_id = Column(BigInteger, primary_key=True, index=True)
    codigo_ods = Column(String(50), nullable=False, unique=True)
    numero_ticket = Column(String(50), nullable=False, unique=True)
    cita_id = Column(BigInteger, nullable=True)
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
    cotizacion_id = Column(
        BigInteger,
        ForeignKey("cotizaciones.cotizacion_id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True
    )
    asesor_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    tecnico_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    estado_actual = Column(String(50), nullable=False, default="Pendiente")
    fecha_ingreso = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    tipo_procedimiento = Column(String(100), nullable=True)
    kilometraje_ingreso = Column(Integer, nullable=True)
    inspeccion_json = Column(JSONB, nullable=True)
    estado_aprobacion_cliente = Column(String(20), nullable=False, default="Pendiente")

    cliente = relationship("Cliente", foreign_keys=[cliente_id], lazy="joined")
    vehiculo = relationship("Vehiculo", foreign_keys=[vehiculo_id], lazy="joined")
