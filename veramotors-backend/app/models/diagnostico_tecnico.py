from sqlalchemy import Column, BigInteger, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base


class DiagnosticoTecnico(Base):
    __tablename__ = "diagnosticos_tecnicos"

    diagnostico_id = Column(BigInteger, primary_key=True, index=True)
    ods_id = Column(
        BigInteger,
        ForeignKey("ordenes_servicio.ods_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    falla_reportada = Column(Text, nullable=False)
    comentarios_tecnico = Column(Text, nullable=True)
    fotos_urls = Column(JSONB, nullable=True)
    tiempo_estimado_horas = Column(Numeric(8, 2), nullable=True)
    horas_hombre = Column(Numeric(8, 2), nullable=True)
    fecha_diagnostico = Column(DateTime, nullable=False, server_default=func.current_timestamp())
