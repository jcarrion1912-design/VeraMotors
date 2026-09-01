from sqlalchemy import Column, BigInteger, String, Boolean
from app.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    categoria_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False,
        unique=True
    )

    descripcion = Column(
        String,
        nullable=True
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )