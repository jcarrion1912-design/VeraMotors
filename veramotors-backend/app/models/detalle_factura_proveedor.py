from sqlalchemy import Column, BigInteger, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleFacturaProveedor(Base):
    __tablename__ = "detalle_factura_proveedor"

    detalle_factura_proveedor_id = Column(BigInteger, primary_key=True, index=True)
    factura_proveedor_id = Column(
        BigInteger,
        ForeignKey("facturas_proveedor.factura_proveedor_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    impuesto = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)

    factura_proveedor = relationship("FacturaProveedor", back_populates="detalles")
