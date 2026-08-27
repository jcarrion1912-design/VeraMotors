from sqlalchemy import Column, BigInteger, String
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    cliente_id = Column(BigInteger, primary_key=True, index=True)
    tipo_persona = Column(String(20), nullable=False)
    documento_identidad = Column(String(20), nullable=False, unique=True)
    nombre_razon_social = Column(String(200), nullable=False)
    direccion_ubigeo = Column(String(150), nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(150), nullable=True)
