from sqlalchemy import Column, BigInteger, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    vehiculo_id = Column(BigInteger, primary_key=True, index=True)
    cliente_id = Column(
        BigInteger,
        ForeignKey("clientes.cliente_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    tipo_vehiculo = Column(String(50), nullable=False)
    placa = Column(String(20), nullable=False, unique=True)
    marca = Column(String(80), nullable=False)
    modelo = Column(String(80), nullable=False)
    anio = Column(Integer, nullable=True)
    color = Column(String(50), nullable=True)
    vin = Column(String(50), unique=True, nullable=True)

    cliente = relationship("Cliente", foreign_keys=[cliente_id], lazy="joined")
