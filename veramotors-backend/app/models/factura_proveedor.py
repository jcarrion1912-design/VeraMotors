from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class FacturaProveedor(Base):
    __tablename__ = "facturas_proveedor"

    factura_proveedor_id = Column(BigInteger, primary_key=True, index=True)
    proveedor_id = Column(
        BigInteger,
        ForeignKey("proveedores.proveedor_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    compra_id = Column(
        BigInteger,
        ForeignKey("compras.compra_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    recepcion_id = Column(
        BigInteger,
        ForeignKey("recepciones.recepcion_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    tipo_comprobante = Column(String(30), nullable=False)
    serie = Column(String(20), nullable=False)
    numero = Column(String(30), nullable=False)
    fecha_emision = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    fecha_vencimiento = Column(DateTime, nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    igv = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    moneda = Column(String(10), nullable=False, default="PEN")
    estado = Column(String(30), nullable=False, default="Pendiente")
    observaciones = Column(Text, nullable=True)

    proveedor = relationship("Proveedor", foreign_keys=[proveedor_id], lazy="joined")
    compra = relationship("Compra", foreign_keys=[compra_id], lazy="joined")
    recepcion = relationship("Recepcion", foreign_keys=[recepcion_id], lazy="joined")
    detalles = relationship("DetalleFacturaProveedor", back_populates="factura_proveedor", cascade="all, delete-orphan")
    pagos = relationship("PagoProveedor", back_populates="factura_proveedor", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("proveedor_id", "tipo_comprobante", "serie", "numero", name="uq_facturas_proveedor_clave"),
    )
