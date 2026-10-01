from app.models.rol import Rol
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.vehiculo import Vehiculo
from app.models.inventario import Inventario
from app.models.cotizacion import Cotizacion
from app.models.detalle_cotizacion import DetalleCotizacion
from app.models.ods import OrdenServicio
from app.models.factura import Factura
from app.models.detalle_factura import DetalleFactura
from app.models.nota_credito import NotaCredito
from app.models.remision import Remision
from app.models.detalle_remision import DetalleRemision
from app.models.cierre_caja import CierreCaja
from app.models.asistencia import Asistencia
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.proveedor import Proveedor
from app.models.categoria import Categoria
from app.models.cuenta_bancaria import CuentaBancaria
from app.models.movimiento_bancario import MovimientoBancario
from app.models.nota_debito import NotaDebito
from app.models.detalle_nota_debito import DetalleNotaDebito
from app.models.detalle_nota_credito import DetalleNotaCredito
from app.models.recepcion import Recepcion
from app.models.detalle_recepcion import DetalleRecepcion
from app.models.factura_proveedor import FacturaProveedor
from app.models.detalle_factura_proveedor import DetalleFacturaProveedor
from app.models.pago_proveedor import PagoProveedor
from app.models.movimiento_inventario import MovimientoInventario
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.pago import Pago
from app.models.diagnostico_tecnico import DiagnosticoTecnico
from app.models.detalle_ods import DetalleODS

__all__ = [
    "Rol",
    "Usuario",
    "Cliente",
    "Vehiculo",
    "Inventario",
    "Cotizacion",
    "DetalleCotizacion",
    "OrdenServicio",
    "Factura",
    "DetalleFactura",
    "NotaCredito",
    "Remision",
    "DetalleRemision",
    "CierreCaja",
    "Asistencia",
    "ConfiguracionCorrelativo",
    "Compra",
    "DetalleCompra",
    "Proveedor",
    "CuentaBancaria",
    "MovimientoBancario",
    "Recepcion",
    "DetalleRecepcion",
    "FacturaProveedor",
    "DetalleFacturaProveedor",
    "PagoProveedor",
    "MovimientoInventario",
    "CuentaPorCobrar",
    "Pago",
    "DiagnosticoTecnico",
    "DetalleODS",
]
