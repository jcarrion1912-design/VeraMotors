from sqlalchemy import Column, BigInteger, String, Numeric, ForeignKey
from app.database import Base


class Inventario(Base):
    __tablename__ = "inventario"

    item_id = Column(BigInteger, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)
    categoria_id = Column(
        BigInteger,
        ForeignKey("categorias.categoria_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    codigo_referencia = Column(String(100), nullable=False, unique=True)
    nombre_nomenclatura = Column(String(200), nullable=False)
    unidad_medida = Column(String(30), nullable=False)
    costo_compra = Column(Numeric(12, 2), nullable=False, default=0)
    margen_ganancia = Column(Numeric(5, 2), nullable=False, default=0)
    precio_venta = Column(Numeric(12, 2), nullable=False, default=0)
    impuesto = Column(Numeric(5, 2), nullable=False, default=0)
