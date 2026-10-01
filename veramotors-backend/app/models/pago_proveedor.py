from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PagoProveedor(Base):
    __tablename__ = "pagos_proveedor"

    pago_proveedor_id = Column(BigInteger, primary_key=True, index=True)
    factura_proveedor_id = Column(
        BigInteger,
        ForeignKey("facturas_proveedor.factura_proveedor_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.user_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    monto = Column(Numeric(12, 2), nullable=False, default=0)
    metodo_pago = Column(String(30), nullable=False, default="Transferencia")
    observaciones = Column(Text, nullable=True)

    factura_proveedor = relationship("FacturaProveedor", back_populates="pagos")
