from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class NotaDebito(Base):

    __tablename__ = "notas_debito"

    nota_debito_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    factura_id = Column(
        BigInteger,
        ForeignKey(
            "facturas.factura_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
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

    tipo_nota = Column(
        String(50),
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

    numero_nota = Column(
        String(30),
        nullable=False,
        unique=True
    )

    fecha_emision = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    codigo_motivo = Column(
        String(10),
        nullable=False
    )

    motivo = Column(
        String(255),
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

    total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
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
        Text,
        nullable=True
    )

    fecha_envio_sunat = Column(
        DateTime,
        nullable=True
    )

    cliente = relationship(
        "Cliente",
        foreign_keys=[cliente_id],
        lazy="joined"
    )

    factura = relationship(
        "Factura",
        foreign_keys=[factura_id],
        lazy="joined"
    )

    detalles = relationship(
        "DetalleNotaDebito",
        back_populates="nota_debito",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "serie",
            "correlativo",
            name="uq_nota_debito_serie_correlativo"
        ),
    )