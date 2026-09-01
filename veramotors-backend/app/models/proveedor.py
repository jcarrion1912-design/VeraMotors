from sqlalchemy import (
    Column,
    BigInteger,
    String,
    DateTime,
    Boolean
)

from sqlalchemy.sql import func

from app.database import Base


class Proveedor(Base):

    __tablename__ = "proveedores"

    proveedor_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    ruc = Column(
        String(11),
        nullable=False,
        unique=True
    )

    razon_social = Column(
        String(200),
        nullable=False
    )

    nombre_comercial = Column(
        String(200),
        nullable=True
    )

    contacto = Column(
        String(150),
        nullable=True
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    email = Column(
        String(150),
        nullable=True
    )

    direccion = Column(
        String(255),
        nullable=True
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    fecha_registro = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )
