from sqlalchemy import (
    Column,
    BigInteger,
    DateTime,
    String,
    Text,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Cita(Base):

    __tablename__ = "citas"

    cita_id = Column(
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
            ondelete="SET NULL"
        ),
        nullable=True
    )

    fecha_hora_inicio = Column(
        DateTime,
        nullable=False
    )

    fecha_hora_fin = Column(
        DateTime,
        nullable=False
    )

    estado = Column(
        String(20),
        nullable=False,
        default="Pendiente"
    )

    observaciones = Column(
        Text,
        nullable=True
    )

    cliente = relationship(
        "Cliente",
        lazy="joined"
    )

    vehiculo = relationship(
        "Vehiculo",
        lazy="joined"
    )