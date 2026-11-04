"""
Pruebas de sesión, permisos por rol, autor de las operaciones y límite de intentos.

Corren sobre SQLite en memoria: nunca tocan la base configurada en .env.
Ejecutar desde veramotors-backend:
    python -m unittest tests.test_auth -v
"""
import os
import re
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "clave-solo-para-pruebas-" + "x" * 32
os.environ["COOKIE_SECURE"] = "false"
# La prueba valida el valor por defecto de producción, no el .env local de desarrollo.
os.environ["HABILITAR_DOCS"] = "false"

from fastapi.testclient import TestClient  # noqa: E402
from jose import jwt  # noqa: E402
from sqlalchemy import BigInteger, create_engine  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB  # noqa: E402
from sqlalchemy.ext.compiler import compiles  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import (  # noqa: E402
    COOKIE_SESION,
    crear_token,
    crear_token_aprobacion,
    hashear_password,
)
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Cliente,
    Compra,
    ConfiguracionCorrelativo,
    Cotizacion,
    CuentaBancaria,
    DetalleCompra,
    DetalleCotizacion,
    Inventario,
    Categoria,
    MovimientoBancario,
    OrdenServicio,
    Proveedor,
    Rol,
    Usuario,
    Vehiculo,
)
from app.routers.auth import limite_cuenta, limite_ip  # noqa: E402


@compiles(BigInteger, "sqlite")
def _bigint_como_integer(_tipo, _compilador, **_kw):
    return "INTEGER"


@compiles(JSONB, "sqlite")
def _jsonb_como_json(_tipo, _compilador, **_kw):
    return "JSON"


RUTAS_PUBLICAS = {
    "/",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/demo",
    "/api/aprobacion-cliente/{token}",
}

ADMIN, SERVICIO, REPUESTOS, TECNICO, INACTIVO = 1, 2, 3, 4, 5
MODELOS = [
    Rol, Usuario, CuentaBancaria, MovimientoBancario, Proveedor, Cliente, Vehiculo, OrdenServicio,
    Cotizacion, DetalleCotizacion, Compra, DetalleCompra, ConfiguracionCorrelativo, Inventario, Categoria,
]


def cabecera(user_id):
    return {"Authorization": f"Bearer {crear_token(user_id)}"}


class BaseAuthTest(unittest.TestCase):
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
        self.addCleanup(app.dependency_overrides.clear)
        self.addCleanup(self.engine.dispose)
        self.client = TestClient(app)
        limite_cuenta.reiniciar()
        limite_ip.reiniciar()

        with self.Sesion() as db:
            db.add_all([
                Rol(rol_id=1, nombre="Administrador"),
                Rol(rol_id=2, nombre="Asesor de Servicio"),
                Rol(rol_id=3, nombre="Asesor de Repuestos"),
                Rol(rol_id=4, nombre="Técnico Automotriz"),
            ])
            clave = hashear_password("clave-correcta")
            for user_id, nombre, rol, activo in [
                (ADMIN, "Admin", 1, True),
                (SERVICIO, "Servicio", 2, True),
                (REPUESTOS, "Repuestos", 3, True),
                (TECNICO, "Tecnico", 4, True),
                (INACTIVO, "Inactivo", 1, False),
            ]:
                db.add(Usuario(user_id=user_id, nombre=nombre, email=f"{nombre.lower()}@veramotors-qa.com", password_hash=clave, rol_id=rol, activo=activo))
            db.commit()


class RutasProtegidasTest(BaseAuthTest):
    def test_toda_ruta_exige_sesion_salvo_las_publicas(self):
        revisadas = 0
        for ruta, operaciones in app.openapi()["paths"].items():
            if ruta in RUTAS_PUBLICAS:
                continue
            url = re.sub(r"\{[^}]+\}", "1", ruta)
            for metodo in operaciones:
                with self.subTest(metodo=metodo, ruta=ruta):
                    self.assertEqual(self.client.request(metodo.upper(), url).status_code, 401)
                    revisadas += 1
        self.assertGreater(revisadas, 100)

    def test_lista_blanca_no_crece_sin_querer(self):
        rutas = set(app.openapi()["paths"])
        publicas = {r for r in rutas if r.startswith(("/api/auth", "/api/aprobacion-cliente")) or r == "/"}
        self.assertEqual(publicas - {"/api/aprobacion-cliente/enlace/{ods_id}"}, RUTAS_PUBLICAS)

    def test_documentacion_cerrada_por_defecto(self):
        self.assertFalse(settings.HABILITAR_DOCS)
        for ruta in ("/docs", "/redoc", "/api/openapi.json"):
            self.assertEqual(self.client.get(ruta).status_code, 404, ruta)


class TokenTest(BaseAuthTest):
    RUTA = "/api/bancos/cuentas"

    def pedir(self, token):
        return self.client.get(self.RUTA, headers={"Authorization": f"Bearer {token}"})

    def test_token_valido_entra(self):
        self.assertEqual(self.pedir(crear_token(ADMIN)).status_code, 200)

    def test_token_basura(self):
        self.assertEqual(self.pedir("no-es-un-token").status_code, 401)

    def test_token_firmado_con_otra_clave(self):
        falso = jwt.encode({"sub": str(ADMIN), "uso": "sesion"}, "otra-clave-" + "y" * 32, algorithm="HS256")
        self.assertEqual(self.pedir(falso).status_code, 401)

    def test_token_sin_firma(self):
        cabecera_none = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"
        cuerpo = crear_token(ADMIN).split(".")[1]
        self.assertEqual(self.pedir(f"{cabecera_none}.{cuerpo}.").status_code, 401)

    def test_token_expirado(self):
        vencido = jwt.encode(
            {"sub": str(ADMIN), "uso": "sesion", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        self.assertEqual(self.pedir(vencido).status_code, 401)

    def test_usuario_desactivado_pierde_acceso(self):
        self.assertEqual(self.pedir(crear_token(INACTIVO)).status_code, 401)

    def test_usuario_inexistente(self):
        self.assertEqual(self.pedir(crear_token(999)).status_code, 401)

    def test_enlace_de_aprobacion_no_abre_sesion(self):
        token, _ = crear_token_aprobacion(1)
        self.assertEqual(self.pedir(token).status_code, 401)


class LoginTest(BaseAuthTest):
    def login(self, nombre, password):
        return self.client.post("/api/auth/login", json={"email": f"{nombre}@veramotors-qa.com", "password": password})

    def test_cookie_httponly_y_token_fuera_del_cuerpo(self):
        respuesta = self.login("admin", "clave-correcta")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["rol"], "Administrador")
        self.assertNotIn("token", respuesta.text.lower())

        cookie = respuesta.headers["set-cookie"].lower()
        self.assertIn(COOKIE_SESION, cookie)
        self.assertIn("httponly", cookie)
        self.assertIn("samesite=strict", cookie)
        self.assertIn("path=/api", cookie)

    def test_cookie_marca_secure_cuando_esta_activo(self):
        with patch.object(settings, "COOKIE_SECURE", True):
            respuesta = self.login("admin", "clave-correcta")
        self.assertIn("secure", respuesta.headers["set-cookie"].lower())

    def test_sesion_por_cookie_y_logout(self):
        self.login("admin", "clave-correcta")
        self.assertEqual(self.client.get("/api/bancos/cuentas").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 204)
        self.assertEqual(self.client.get("/api/bancos/cuentas").status_code, 401)

    def test_clave_incorrecta(self):
        self.assertEqual(self.login("admin", "otra").status_code, 401)

    def test_correo_inexistente(self):
        self.assertEqual(self.login("nadie", "clave-correcta").status_code, 401)

    def test_usuario_desactivado(self):
        self.assertEqual(self.login("inactivo", "clave-correcta").status_code, 403)

    def test_desactivado_no_se_revela_sin_la_clave(self):
        self.assertEqual(self.login("inactivo", "otra").status_code, 401)

    def test_password_larga_no_rompe(self):
        self.assertEqual(self.login("admin", "x" * 200).status_code, 401)


class LimiteIntentosTest(BaseAuthTest):
    def login(self, nombre, password):
        return self.client.post("/api/auth/login", json={"email": f"{nombre}@veramotors-qa.com", "password": password})

    def test_bloquea_tras_cinco_fallos_incluso_con_la_clave_correcta(self):
        for _ in range(5):
            self.assertEqual(self.login("admin", "mala").status_code, 401)
        bloqueado = self.login("admin", "clave-correcta")
        self.assertEqual(bloqueado.status_code, 429)
        self.assertIn("retry-after", bloqueado.headers)

    def test_otra_cuenta_sigue_entrando(self):
        for _ in range(5):
            self.login("admin", "mala")
        self.assertEqual(self.login("servicio", "clave-correcta").status_code, 200)

    def test_login_correcto_reinicia_el_contador(self):
        for _ in range(4):
            self.login("admin", "mala")
        self.assertEqual(self.login("admin", "clave-correcta").status_code, 200)
        for _ in range(4):
            self.assertEqual(self.login("admin", "mala").status_code, 401)

    def test_limite_por_ip_frena_recorrer_cuentas(self):
        for i in range(30):
            self.assertEqual(self.login(f"nadie{i}", "mala").status_code, 401)
        self.assertEqual(self.login("otro", "mala").status_code, 429)


class ModoDemoTest(BaseAuthTest):
    def test_deshabilitado_por_defecto(self):
        with patch.object(settings, "PERMITIR_LOGIN_DEMO", False):
            self.assertEqual(self.client.post("/api/auth/demo").status_code, 404)

    def test_habilitado_abre_sesion_de_administrador(self):
        with patch.object(settings, "PERMITIR_LOGIN_DEMO", True):
            respuesta = self.client.post("/api/auth/demo")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["user_id"], ADMIN)
        self.assertEqual(self.client.get("/api/bancos/cuentas").status_code, 200)


class MatrizRolesTest(BaseAuthTest):
    def estado(self, metodo, ruta, user_id, **kwargs):
        return self.client.request(metodo, ruta, headers=cabecera(user_id), **kwargs).status_code

    def assertPermitidos(self, metodo, ruta, permitidos, **kwargs):
        for user_id, nombre in [(ADMIN, "admin"), (SERVICIO, "servicio"), (REPUESTOS, "repuestos"), (TECNICO, "tecnico")]:
            with self.subTest(ruta=ruta, rol=nombre):
                estado = self.estado(metodo, ruta, user_id, **kwargs)
                if user_id in permitidos:
                    self.assertNotIn(estado, (401, 403))
                else:
                    self.assertEqual(estado, 403)

    def test_bancos_solo_administrador(self):
        self.assertPermitidos("GET", "/api/bancos/cuentas", {ADMIN})

    def test_compras_y_proveedores(self):
        self.assertPermitidos("GET", "/api/proveedores", {ADMIN, REPUESTOS})

    def test_facturacion_y_caja(self):
        # Estas tablas no se crean aquí: basta comprobar que el rol no autorizado ni llega a consultarlas.
        for ruta in ("/api/facturacion", "/api/caja", "/api/pagos", "/api/cuentas-por-cobrar", "/api/remisiones", "/api/notas-credito", "/api/notas-debito"):
            with self.subTest(ruta=ruta):
                self.assertEqual(self.estado("GET", ruta, REPUESTOS), 403)
                self.assertEqual(self.estado("GET", ruta, TECNICO), 403)

    def test_asistencia_solo_administrador(self):
        for usuario in (SERVICIO, REPUESTOS, TECNICO):
            self.assertEqual(self.estado("GET", "/api/asistencia/reporte", usuario), 403)
            self.assertEqual(self.estado("POST", "/api/asistencia/marcar-entrada", usuario, json={}), 403)

    def test_inventario_todos_leen_y_solo_admin_y_repuestos_escriben(self):
        self.assertPermitidos("GET", "/api/inventario", {ADMIN, SERVICIO, REPUESTOS, TECNICO})
        self.assertEqual(self.estado("POST", "/api/inventario", SERVICIO, json={}), 403)
        self.assertEqual(self.estado("POST", "/api/inventario", TECNICO, json={}), 403)
        self.assertEqual(self.estado("PUT", "/api/inventario/1", TECNICO, json={}), 403)
        self.assertEqual(self.estado("DELETE", "/api/inventario/1", SERVICIO), 403)
        self.assertEqual(self.estado("POST", "/api/inventario", REPUESTOS, json={}), 422)

    def test_reportes_de_negocio_no_son_para_tecnicos(self):
        for ruta in ("/dashboard", "/inventario-resumen", "/asistencia-resumen", "/ventasPeriodo", "/rentabilidad"):
            with self.subTest(ruta=ruta):
                self.assertEqual(self.estado("GET", f"/api/reportes{ruta}", TECNICO), 403)

    def test_rentabilidad_solo_administrador(self):
        self.assertEqual(self.estado("GET", "/api/reportes/rentabilidad", SERVICIO), 403)
        self.assertEqual(self.estado("GET", "/api/reportes/rentabilidad", REPUESTOS), 403)

    def test_tecnico_solo_ve_su_desempenio(self):
        propio = self.client.get("/api/reportes/tecnicos-desempenio", headers=cabecera(TECNICO)).json()
        self.assertEqual([t["tecnico_id"] for t in propio], [TECNICO])

    def test_tecnico_lista_usuarios_pero_no_los_administra(self):
        self.assertEqual(self.estado("GET", "/api/usuarios", TECNICO), 200)
        self.assertEqual(self.estado("POST", "/api/usuarios", TECNICO, json={}), 403)
        self.assertEqual(self.estado("PATCH", "/api/usuarios/1/estado", TECNICO), 403)

    def test_configuracion_solo_administrador_escribe(self):
        self.assertEqual(self.estado("PUT", "/api/configuracion/empresa", SERVICIO, json={}), 403)
        self.assertEqual(self.estado("PUT", "/api/configuracion/correlativos/1", REPUESTOS, json={}), 403)


class AutorDesdeTokenTest(BaseAuthTest):
    def setUp(self):
        super().setUp()
        with self.Sesion() as db:
            db.add(Proveedor(proveedor_id=1, ruc="20123456789", razon_social="Proveedor", activo=True))
            db.add(ConfiguracionCorrelativo(tipo_documento="COMPRA", prefijo="ODC", siguiente_correlativo=1, activo=True))
            db.add(CuentaBancaria(cuenta_bancaria_id=1, banco="BCP", nombre_cuenta="Op", numero_cuenta="1", tipo_cuenta="Corriente", moneda="PEN", saldo_actual=100, activo=True))
            db.add(Cliente(cliente_id=1, tipo_persona="Natural", documento_identidad="12345678", nombre_razon_social="Cliente"))
            db.add(Vehiculo(vehiculo_id=1, cliente_id=1, tipo_vehiculo="Auto", placa="AAA-111", marca="Kia", modelo="Rio"))
            db.add(Cotizacion(cotizacion_id=1, codigo_cotizacion="COT-1", cliente_id=1, vehiculo_id=1, total=10, estado="Pendiente"))
            db.commit()

    def test_compra_ignora_el_usuario_del_cuerpo(self):
        respuesta = self.client.post("/api/compras", headers=cabecera(REPUESTOS), json={"proveedor_id": 1, "usuario_id": ADMIN})
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(respuesta.json()["usuario_id"], REPUESTOS)

    def test_movimiento_bancario_ignora_el_usuario_del_cuerpo(self):
        respuesta = self.client.post("/api/bancos/movimientos", headers=cabecera(ADMIN), json={
            "cuenta_bancaria_id": 1, "usuario_id": TECNICO, "tipo_movimiento": "Ingreso", "concepto": "x", "monto": "5",
        })
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(respuesta.json()["usuario_id"], ADMIN)

    def test_editar_no_cambia_el_autor_original(self):
        movimiento = self.client.post("/api/bancos/movimientos", headers=cabecera(ADMIN), json={
            "cuenta_bancaria_id": 1, "usuario_id": ADMIN, "tipo_movimiento": "Ingreso", "concepto": "x", "monto": "5",
        }).json()
        editado = self.client.put(f"/api/bancos/movimientos/{movimiento['movimiento_bancario_id']}", headers=cabecera(ADMIN), json={
            "cuenta_bancaria_id": 1, "usuario_id": TECNICO, "tipo_movimiento": "Ingreso", "concepto": "y", "monto": "5",
        })
        self.assertEqual(editado.json()["usuario_id"], ADMIN)

    def test_aprobar_cotizacion_registra_a_quien_tiene_la_sesion(self):
        respuesta = self.client.post("/api/cotizaciones/1/aprobar", headers=cabecera(SERVICIO), json={"usuario_id": ADMIN})
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["aprobado_por"], SERVICIO)


class AprobacionClienteTest(BaseAuthTest):
    def setUp(self):
        super().setUp()
        with self.Sesion() as db:
            db.add(Cliente(cliente_id=1, tipo_persona="Natural", documento_identidad="12345678", nombre_razon_social="Ana Cliente", telefono="999111222", email="ana@veramotors-qa.com"))
            db.add(Vehiculo(vehiculo_id=1, cliente_id=1, tipo_vehiculo="Auto", placa="AAA-111", marca="Kia", modelo="Rio"))
            db.add(Cotizacion(cotizacion_id=1, codigo_cotizacion="COT-1", cliente_id=1, vehiculo_id=1, total=118, estado="Aprobada"))
            db.add(DetalleCotizacion(cotizacion_id=1, descripcion="Cambio de aceite", cantidad=1, precio_unitario=100, total=118))
            db.add(OrdenServicio(
                ods_id=1, codigo_ods="ODS-1", numero_ticket="TK-1", cliente_id=1, vehiculo_id=1, cotizacion_id=1,
                asesor_id=ADMIN, tecnico_id=TECNICO, estado_actual="Recepción", estado_aprobacion_cliente="Pendiente",
                tipo_procedimiento="Preventivo", fecha_ingreso=datetime(2026, 11, 1),
                inspeccion_json={"motivo_servicio": {"motivo_detallado": "Ruido en motor"}},
            ))
            db.commit()
        self.token = self.client.post("/api/aprobacion-cliente/enlace/1", headers=cabecera(SERVICIO)).json()["token"]

    def test_generar_enlace_exige_sesion(self):
        self.assertEqual(self.client.post("/api/aprobacion-cliente/enlace/1").status_code, 401)

    def test_enlace_de_orden_inexistente(self):
        self.assertEqual(self.client.post("/api/aprobacion-cliente/enlace/99", headers=cabecera(ADMIN)).status_code, 404)

    def test_resumen_publico_sin_datos_sensibles(self):
        respuesta = self.client.get(f"/api/aprobacion-cliente/{self.token}")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        datos = respuesta.json()
        self.assertEqual(datos["placa"], "AAA-111")
        self.assertEqual(datos["items"][0]["descripcion"], "Cambio de aceite")
        self.assertEqual(datos["motivo"], "Ruido en motor")
        for sensible in ("12345678", "999111222", "ana@veramotors-qa.com"):
            self.assertNotIn(sensible, respuesta.text)

    def test_aprobar_avanza_a_diagnostico_y_no_se_repite(self):
        respuesta = self.client.post(f"/api/aprobacion-cliente/{self.token}", json={"decision": "Aprobado"})
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        with self.Sesion() as db:
            ods = db.get(OrdenServicio, 1)
            self.assertEqual(ods.estado_aprobacion_cliente, "Aprobado")
            self.assertEqual(ods.estado_actual, "Diagnóstico")
        self.assertEqual(self.client.post(f"/api/aprobacion-cliente/{self.token}", json={"decision": "Denegado"}).status_code, 409)

    def test_denegar_no_avanza_la_orden(self):
        self.client.post(f"/api/aprobacion-cliente/{self.token}", json={"decision": "Denegado"})
        with self.Sesion() as db:
            self.assertEqual(db.get(OrdenServicio, 1).estado_actual, "Recepción")

    def test_decision_invalida(self):
        self.assertEqual(self.client.post(f"/api/aprobacion-cliente/{self.token}", json={"decision": "Otro"}).status_code, 422)

    def test_token_alterado_o_de_sesion_no_sirve(self):
        self.assertEqual(self.client.get(f"/api/aprobacion-cliente/{self.token}x").status_code, 400)
        self.assertEqual(self.client.get(f"/api/aprobacion-cliente/{crear_token(ADMIN)}").status_code, 400)

    def test_enlace_vencido(self):
        vencido = jwt.encode(
            {"ods_id": 1, "uso": "aprobacion", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        self.assertEqual(self.client.get(f"/api/aprobacion-cliente/{vencido}").status_code, 400)


if __name__ == "__main__":
    unittest.main()
