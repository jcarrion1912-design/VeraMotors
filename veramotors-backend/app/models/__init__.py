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
]
