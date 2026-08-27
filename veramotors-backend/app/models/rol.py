from sqlalchemy import Column, BigInteger, String, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}

    rol_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(50),
        unique=True,
        nullable=False
    )

    descripcion = Column(
        String(200),
        nullable=True
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    usuarios = relationship(
        "Usuario",
        back_populates="rol"
    )