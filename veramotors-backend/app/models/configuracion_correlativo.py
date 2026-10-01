from sqlalchemy import Column, BigInteger, String, Integer, Boolean

from app.database import Base


class ConfiguracionCorrelativo(Base):
    __tablename__ = "configuracion_correlativos"

    correlativo_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    tipo_documento = Column(
        String(30),
        unique=True,
        nullable=False
    )

    prefijo = Column(
        String(10),
        nullable=False
    )

    siguiente_correlativo = Column(
        Integer,
        nullable=False
    )

    activo = Column(
        Boolean,
        nullable=False,
        default=True
    )