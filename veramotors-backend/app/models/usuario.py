from sqlalchemy import Column, BigInteger, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "public"}

    user_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(150),
        nullable=False
    )

    rol_id = Column(
        BigInteger,
        ForeignKey(
            "public.roles.rol_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    rol = relationship(
        "Rol",
        back_populates="usuarios"
    )

    asistencias = relationship(
        "Asistencia",
        back_populates="usuario"
    )