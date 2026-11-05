"""
Pruebas de órdenes de compra, recepción y parámetros del taller.

Corren sobre SQLite en memoria: nunca tocan la base configurada en .env.
Ejecutar desde veramotors-backend:
    python -m unittest tests.test_compras_empresa -v
"""
import os
import tempfile
import unittest
from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

# Debe definirse antes de importar la app: load_dotenv no sobrescribe variables existentes.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "clave-solo-para-pruebas-" + "x" * 32
os.environ["COOKIE_SECURE"] = "false"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import BigInteger, create_engine  # noqa: E402
from sqlalchemy.ext.compiler import compiles  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from pypdf import PdfReader  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402

from app.core.security import crear_token  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Categoria,
    Compra,
    ConfiguracionCorrelativo,
    ConfiguracionEmpresa,
    DetalleCompra,
    DetalleFacturaProveedor,
    DetalleRecepcion,
    FacturaProveedor,
    Inventario,
    MovimientoInventario,
    PagoProveedor,
    Proveedor,
    Recepcion,
    Rol,
    Usuario,
)


@compiles(BigInteger, "sqlite")
def _bigint_como_integer(_tipo, _compilador, **_kw):
    # SQLite solo autoincrementa claves primarias INTEGER.
    return "INTEGER"


MODELOS = [
    Rol, Usuario, Categoria, Inventario, Proveedor, ConfiguracionCorrelativo, ConfiguracionEmpresa,
    Compra, DetalleCompra, Recepcion, DetalleRecepcion, MovimientoInventario,
    FacturaProveedor, DetalleFacturaProveedor, PagoProveedor,
]


class BaseAPITest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        self.assertEqual(self.engine.url.get_backend_name(), "sqlite")
        Base.metadata.create_all(self.engine, tables=[m.__table__ for m in MODELOS])
        self.Sesion = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

        def _get_db():
            db = self.Sesion()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = _get_db
        self.client = TestClient(app, headers={"Authorization": f"Bearer {crear_token(1)}"})
        self.addCleanup(app.dependency_overrides.clear)
        self.addCleanup(self.engine.dispose)

        with self.Sesion() as db:
            db.add(Rol(rol_id=1, nombre="Administrador"))
            db.add(Usuario(user_id=1, nombre="QA", email="qa@ejemplo.test", password_hash="x", rol_id=1, activo=True))
            db.add(Categoria(categoria_id=1, nombre="Filtros"))
            db.add(Proveedor(proveedor_id=1, ruc="20123456789", razon_social="Proveedor QA", activo=True))
            db.add(ConfiguracionCorrelativo(tipo_documento="COMPRA", prefijo="ODC", siguiente_correlativo=1, activo=True))
            db.add(Inventario(
                item_id=10, tipo="Repuesto", categoria_id=1, codigo_referencia="FIL-001",
                nombre_nomenclatura="Filtro de aceite", unidad_medida="Unidad",
                stock_actual=Decimal("2"), stock_minimo=Decimal("1"), costo_compra=Decimal("20"),
                margen_ganancia=Decimal("10"), precio_venta=Decimal("30"), impuesto=Decimal("0"), activo=True,
            ))
            db.commit()

    def crear_compra(self, cantidad="5"):
        return self.client.post("/api/compras", json={
            "proveedor_id": 1, "usuario_id": 1, "subtotal": "100", "impuestos": "18", "total": "118",
            "detalles": [{"item_id": 10, "cantidad": cantidad, "precio_unitario": "20", "impuesto": "18", "total": "118"}],
        })

    def recibir(self, compra_id, recibida, ordenada="5"):
        return self.client.post("/api/recepciones", json={
            "compra_id": compra_id, "proveedor_id": 1, "usuario_id": 1,
            "detalles": [{
                "item_id": 10, "descripcion": "Filtro de aceite", "cantidad_ordenada": ordenada,
                "cantidad_recibida": recibida, "cantidad_pendiente": "0", "precio_unitario": "20", "total": "0",
            }],
        })

    def stock(self):
        with self.Sesion() as db:
            return db.get(Inventario, 10).stock_actual


class ComprasTest(BaseAPITest):
    def test_guarda_items_y_los_devuelve_con_descripcion(self):
        respuesta = self.crear_compra()
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        compra = respuesta.json()
        self.assertEqual(compra["codigo_compra"], "ODC-00001")
        detalle = compra["detalles"][0]
        self.assertEqual(detalle["item"]["codigo_referencia"], "FIL-001")
        self.assertEqual(detalle["item"]["nombre_nomenclatura"], "Filtro de aceite")
        self.assertEqual(detalle["codigo_referencia"], "FIL-001")
        self.assertEqual(detalle["descripcion"], "Filtro de aceite")

        detalles = self.client.get(f"/api/compras/{compra['compra_id']}").json()["detalles"]
        self.assertEqual(len(detalles), 1)
        self.assertEqual(detalles[0]["descripcion"], "Filtro de aceite")
        self.assertEqual(detalles[0]["codigo_referencia"], "FIL-001")
        self.assertEqual(Decimal(detalles[0]["cantidad"]), Decimal("5"))

    def test_rechaza_item_inexistente_sin_consumir_correlativo(self):
        respuesta = self.client.post("/api/compras", json={
            "proveedor_id": 1, "usuario_id": 1,
            "detalles": [{"item_id": 999, "cantidad": "1"}],
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(self.crear_compra().json()["codigo_compra"], "ODC-00001")

    def test_compra_sin_items_sigue_siendo_valida(self):
        respuesta = self.client.post("/api/compras", json={"proveedor_id": 1, "usuario_id": 1})
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(self.client.get(f"/api/compras/{respuesta.json()['compra_id']}/detalles").json(), [])


class RecepcionTest(BaseAPITest):
    def test_recepcion_completa_suma_stock_y_marca_recibida(self):
        compra_id = self.crear_compra().json()["compra_id"]
        respuesta = self.recibir(compra_id, "5")
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(self.stock(), Decimal("7"))
        self.assertEqual(self.client.get(f"/api/compras/{compra_id}").json()["estado"], "Recibida")

    def test_recepcion_parcial_deja_la_orden_abierta_y_luego_la_completa(self):
        compra_id = self.crear_compra().json()["compra_id"]
        self.assertEqual(self.recibir(compra_id, "2").status_code, 201)
        self.assertEqual(self.stock(), Decimal("4"))
        self.assertEqual(self.client.get(f"/api/compras/{compra_id}").json()["estado"], "Registrada")

        self.assertEqual(self.recibir(compra_id, "3").status_code, 201)
        self.assertEqual(self.stock(), Decimal("7"))
        self.assertEqual(self.client.get(f"/api/compras/{compra_id}").json()["estado"], "Recibida")

    def test_no_permite_recibir_mas_de_lo_pendiente(self):
        compra_id = self.crear_compra().json()["compra_id"]
        self.assertEqual(self.recibir(compra_id, "4").status_code, 201)
        self.assertEqual(self.recibir(compra_id, "2").status_code, 400)
        self.assertEqual(self.stock(), Decimal("6"))

    def test_no_permite_recibir_una_orden_ya_recibida(self):
        compra_id = self.crear_compra().json()["compra_id"]
        self.assertEqual(self.recibir(compra_id, "5").status_code, 201)
        self.assertEqual(self.recibir(compra_id, "1").status_code, 409)
        self.assertEqual(self.stock(), Decimal("7"))

    def test_rechaza_item_que_no_pertenece_a_la_orden(self):
        compra_id = self.crear_compra().json()["compra_id"]
        respuesta = self.client.post("/api/recepciones", json={
            "compra_id": compra_id, "proveedor_id": 1, "usuario_id": 1,
            "detalles": [{"item_id": 11, "descripcion": "Otro", "cantidad_ordenada": "1", "cantidad_recibida": "1"}],
        })
        self.assertEqual(respuesta.status_code, 400)


class FacturasProveedorTest(BaseAPITest):
    FACTURA = {
        "proveedor_id": 1, "tipo_comprobante": "Factura", "serie": "F001", "numero": "123",
        "fecha_emision": "2026-11-04T00:00:00", "subtotal": "100", "igv": "18", "total": "118",
    }

    def test_duplicado_devuelve_409_y_no_500(self):
        creada = self.client.post("/api/facturas-proveedor", json=self.FACTURA)
        self.assertEqual(creada.status_code, 201)
        self.assertEqual(creada.json()["tipo_comprobante"], "Factura")
        self.assertEqual(creada.json()["codigo_interno"], "FPROV-0001")
        self.assertEqual(self.client.post("/api/facturas-proveedor", json=self.FACTURA).status_code, 409)

    def test_solo_acepta_factura_como_tipo_de_comprobante(self):
        respuesta = self.client.post("/api/facturas-proveedor", json={
            **self.FACTURA,
            "tipo_comprobante": "Boleta",
        })
        self.assertEqual(respuesta.status_code, 422)

    def test_rechaza_ruc_de_comprobante_distinto_al_proveedor(self):
        respuesta = self.client.post("/api/facturas-proveedor", json={
            **self.FACTURA,
            "ruc_comprobante": "20111111111",
        })
        self.assertEqual(respuesta.status_code, 422)

    def test_pdf_interno_incluye_codigo_y_se_identifica_como_registro(self):
        factura = self.client.post("/api/facturas-proveedor", json={
            **self.FACTURA,
            "detalles": [{
                "descripcion": "Filtro FIL-001",
                "cantidad": "2",
                "precio_unitario": "50",
                "impuesto": "18",
            }],
        }).json()

        respuesta = self.client.get(
            f"/api/facturas-proveedor/{factura['factura_proveedor_id']}/pdf-interno"
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.headers["content-type"], "application/pdf")
        texto = "\n".join(
            pagina.extract_text() or ""
            for pagina in PdfReader(BytesIO(respuesta.content)).pages
        )
        self.assertIn("FPROV-0001", texto)
        self.assertIn("VERAMOTORS S.A.C.", texto)
        self.assertIn("No es un comprobante electrónico oficial emitido por SUNAT.", texto)
        self.assertIn("Filtro FIL-001", texto)

    def test_extrae_datos_y_preserva_pdf_original(self):
        buffer = BytesIO()
        documento = canvas.Canvas(buffer)
        for indice, linea in enumerate([
            "RUC: 20123456789",
            "FACTURA ELECTRONICA",
            "F001-00000123",
            "Fecha de emision: 04/11/2026",
            "Moneda: PEN",
            "Subtotal: S/ 100.00",
            "IGV: S/ 18.00",
            "Importe Total: S/ 118.00",
        ]):
            documento.drawString(40, 800 - indice * 18, linea)
        documento.save()
        pdf_original = buffer.getvalue()

        extraidos = self.client.post(
            "/api/facturas-proveedor/extraer-pdf",
            files={"archivo": ("proveedor.pdf", pdf_original, "application/pdf")},
        )
        self.assertEqual(extraidos.status_code, 200, extraidos.text)
        self.assertEqual(extraidos.json()["serie"], "F001")
        self.assertEqual(extraidos.json()["numero"], "00000123")
        self.assertEqual(extraidos.json()["ruc"], "20123456789")
        self.assertEqual(extraidos.json()["subtotal"], "100.00")
        self.assertEqual(extraidos.json()["igv"], "18.00")
        self.assertEqual(extraidos.json()["total"], "118.00")

        factura = self.client.post("/api/facturas-proveedor", json=self.FACTURA).json()
        with tempfile.TemporaryDirectory() as directorio, patch.dict(
            os.environ, {"FACTURAS_PROVEEDOR_STORAGE_DIR": directorio}
        ):
            subida = self.client.post(
                f"/api/facturas-proveedor/{factura['factura_proveedor_id']}/pdf-original",
                files={"archivo": ("proveedor.pdf", pdf_original, "application/pdf")},
            )
            self.assertEqual(subida.status_code, 201, subida.text)
            descargado = self.client.get(
                f"/api/facturas-proveedor/{factura['factura_proveedor_id']}/pdf-original"
            )
            self.assertEqual(descargado.status_code, 200)
            self.assertEqual(descargado.content, pdf_original)

    def test_detalles_calculan_totales_y_facturar_no_mueve_inventario(self):
        compra = self.crear_compra().json()
        recepcion = self.recibir(compra["compra_id"], "5").json()
        with self.Sesion() as db:
            stock_antes = db.get(Inventario, 10).stock_actual
            movimientos_antes = db.query(MovimientoInventario).count()

        respuesta = self.client.post("/api/facturas-proveedor", json={
            **self.FACTURA,
            "numero": "124",
            "compra_id": compra["compra_id"],
            "recepcion_id": recepcion["recepcion_id"],
            "subtotal": "999",
            "igv": "999",
            "total": "1998",
            "detalles": [
                {
                    "descripcion": "Filtro de aceite",
                    "cantidad": "2",
                    "precio_unitario": "10",
                    "impuesto": "3.60",
                },
                {
                    "descripcion": "Aceite",
                    "cantidad": "1",
                    "precio_unitario": "15",
                    "impuesto": "2.70",
                },
            ],
        })
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        factura = respuesta.json()
        self.assertEqual(Decimal(factura["subtotal"]), Decimal("35.00"))
        self.assertEqual(Decimal(factura["igv"]), Decimal("6.30"))
        self.assertEqual(Decimal(factura["total"]), Decimal("41.30"))
        self.assertEqual(len(factura["detalles"]), 2)
        self.assertEqual(Decimal(factura["detalles"][0]["total"]), Decimal("23.60"))
        self.assertEqual(factura["compra_id"], compra["compra_id"])
        self.assertEqual(factura["recepcion_id"], recepcion["recepcion_id"])

        consultada = self.client.get(
            f"/api/facturas-proveedor/{factura['factura_proveedor_id']}"
        )
        self.assertEqual(consultada.status_code, 200)
        self.assertEqual(len(consultada.json()["detalles"]), 2)

        with self.Sesion() as db:
            self.assertEqual(db.get(Inventario, 10).stock_actual, stock_antes)
            self.assertEqual(db.query(MovimientoInventario).count(), movimientos_antes)

    def test_rechaza_compra_de_otro_proveedor(self):
        with self.Sesion() as db:
            db.add(Proveedor(
                proveedor_id=2,
                ruc="20111111111",
                razon_social="Otro proveedor",
                activo=True,
            ))
            db.commit()
        compra = self.crear_compra().json()
        respuesta = self.client.post("/api/facturas-proveedor", json={
            **self.FACTURA,
            "numero": "125",
            "proveedor_id": 2,
            "compra_id": compra["compra_id"],
        })
        self.assertEqual(respuesta.status_code, 422, respuesta.text)

    def test_pagos_actualizan_estado_y_no_exceden_saldo(self):
        factura = self.client.post("/api/facturas-proveedor", json=self.FACTURA).json()
        pago = {"factura_proveedor_id": factura["factura_proveedor_id"], "usuario_id": 1, "monto": "18"}
        self.assertEqual(self.client.post("/api/pagos-proveedor", json=pago).status_code, 201)
        ruta = f"/api/facturas-proveedor/{factura['factura_proveedor_id']}"
        self.assertEqual(self.client.get(ruta).json()["estado"], "Parcialmente pagada")
        self.assertEqual(self.client.post("/api/pagos-proveedor", json={**pago, "monto": "101"}).status_code, 400)
        self.assertEqual(self.client.post("/api/pagos-proveedor", json={**pago, "monto": "100"}).status_code, 201)
        self.assertEqual(self.client.get(ruta).json()["estado"], "Pagada")


class EmpresaTest(BaseAPITest):
    DATOS = {
        "nombre": "VERAMOTORS S.A.C.", "desarrollador": "RAZOR S.A.C.", "ruc": "20601234567",
        "direccion": "Av. La Marina 2840", "telefono": "+51 1 458-9200", "email": "contacto@ejemplo.test",
        "igv": "18", "moneda": "PEN - Soles (S/)",
    }

    def test_sin_fila_devuelve_null(self):
        respuesta = self.client.get("/api/configuracion/empresa")
        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.json())

    def test_guardar_persiste_y_actualiza_una_sola_fila(self):
        self.assertEqual(self.client.put("/api/configuracion/empresa", json=self.DATOS).status_code, 200)
        self.assertEqual(
            self.client.put("/api/configuracion/empresa", json={**self.DATOS, "nombre": "Nuevo nombre"}).status_code,
            200,
        )
        self.assertEqual(self.client.get("/api/configuracion/empresa").json()["nombre"], "Nuevo nombre")
        with self.Sesion() as db:
            self.assertEqual(db.query(ConfiguracionEmpresa).count(), 1)

    def test_valida_ruc(self):
        respuesta = self.client.put("/api/configuracion/empresa", json={**self.DATOS, "ruc": "123"})
        self.assertEqual(respuesta.status_code, 422)


if __name__ == "__main__":
    unittest.main()
