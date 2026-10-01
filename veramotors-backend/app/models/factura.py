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


class Factura(Base):

    __tablename__ = "facturas"

    factura_id = Column(
        BigInteger,
        primary_key=True,
        index=True
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

    cliente_id = Column(
        BigInteger,
        ForeignKey(
            "clientes.cliente_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    tipo_comprobante = Column(
        String(20),
        nullable=False
    )

    serie = Column(
        String(10),
        nullable=False
    )

    correlativo = Column(
        BigInteger,
        nullable=False
    )

    numero_comprobante = Column(
        String(50),
        nullable=False,
        unique=True
    )

    fecha_emision = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    fecha_vencimiento = Column(
        DateTime,
        nullable=True
    )

    metodo_pago = Column(
        String(30),
        nullable=False
    )

    subtotal = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    impuestos = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    descuentos = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    estado_pago = Column(
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
        String(100),
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

    detalles = relationship(
        "DetalleFactura",
        back_populates="factura",
        cascade="all, delete-orphan"
    )

    remision = relationship("Remision", back_populates="factura", uselist=False)