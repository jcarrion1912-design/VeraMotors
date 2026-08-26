from sqlalchemy import Column, BigInteger, String, Date, DateTime, Text, ForeignKey
from app.database import Base

class Asistencia(Base):
    __tablename__ = "asistencia"
    __table_args__ = {"schema": "public"}  

    asistencia_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("public.usuarios.user_id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_entrada = Column(DateTime, nullable=False)
    hora_salida = Column(DateTime, nullable=True)
    estado = Column(String(30), nullable=False)
    observaciones = Column(Text, nullable=True)