from sqlalchemy import Column, BigInteger, String, Numeric

from app.database import Base


class ConfiguracionEmpresa(Base):
    """Parámetros institucionales del taller. La tabla guarda una sola fila."""

    __tablename__ = "configuracion_empresa"

    empresa_id = Column(BigInteger, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    desarrollador = Column(String(200), nullable=True)
    ruc = Column(String(11), nullable=False)
    direccion = Column(String(255), nullable=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(150), nullable=True)
    igv = Column(Numeric(5, 2), nullable=False, default=18)
    moneda = Column(String(50), nullable=False, default="PEN - Soles (S/)")
