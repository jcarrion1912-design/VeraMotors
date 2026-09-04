from sqlalchemy import Column, BigInteger, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Asistencia(Base):
    __tablename__ = "asistencia"

    asistencia_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id"),
        nullable=False
    )

    fecha = Column(
        Date,
        nullable=False
    )

    hora_entrada = Column(
        DateTime,
        nullable=False
    )

    hora_salida = Column(
        DateTime,
        nullable=True
    )

    estado = Column(
        String(30),
        nullable=False
    )

    observaciones = Column(
        Text,
        nullable=True
    )

    usuario = relationship(
        "Usuario",
        back_populates="asistencias"
    )