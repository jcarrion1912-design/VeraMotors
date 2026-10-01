from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Remision(Base):

    __tablename__ = "remisiones"

    remision_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    cliente_id = Column(
        BigInteger,
        ForeignKey(
            "clientes.cliente_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    vehiculo_id = Column(
        BigInteger,
        ForeignKey(
            "vehiculos.vehiculo_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=True
    )

    ods_id = Column(
        BigInteger,
        ForeignKey(
            "ordenes_servicio.ods_id",
            onupdate="CASCADE",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    factura_id = Column(
        BigInteger,
        ForeignKey(
            "facturas.factura_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=True,
        unique=True,
        index=True
    )

    tipo_remision = Column(
        String(30),
        nullable=False,
        default="Remisión de Bienes"
    )

    serie = Column(
        String(10),
        nullable=False
    )

    correlativo = Column(
        BigInteger,
        nullable=False
    )

    numero_remision = Column(
        String(30),
        nullable=False,
        unique=True
    )

    fecha_emision = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    motivo_traslado = Column(
        String(100),
        nullable=False
    )

    punto_partida = Column(
        String(255),
        nullable=True
    )

    punto_llegada = Column(
        String(255),
        nullable=True
    )

    estado = Column(
        String(30),
        nullable=False,
        default="Pendiente"
    )

    estado_sunat = Column(
        String(30),
        nullable=False,
        default="Pendiente"
    )

    codigo_sunat = Column(
        String(50),
        nullable=True
    )

    respuesta_sunat = Column(
        String,
        nullable=True
    )

    fecha_envio_sunat = Column(
        DateTime,
        nullable=True
    )

    usuario_despacho_id = Column(
        BigInteger,
        ForeignKey(
            "usuarios.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=True
    )

    fecha_despacho = Column(DateTime, nullable=True)

    factura = relationship("Factura", back_populates="remision", lazy="joined")
    detalles = relationship(
        "DetalleRemision",
        back_populates="remision",
        cascade="all, delete-orphan"
    )