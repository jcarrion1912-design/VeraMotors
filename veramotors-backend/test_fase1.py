"""
test_fase1.py
=============
Prueba de las 4 combinaciones NC/ND sobre Factura/Boleta.

A) Nota de Crédito -> Factura
B) Nota de Crédito -> Boleta
C) Nota de Débito -> Factura
D) Nota de Débito -> Boleta

El test:
- Crea el documento.
- Obtiene el documentId de APISUNAT.
- Consulta el estado real.
- Espera si está PENDIENTE.
- Actualiza la BD con el estado final.
- Considera PASS solamente cuando APISUNAT devuelve ACEPTADO.
- Muestra errores/faults/notes de APISUNAT.
"""

import json
import traceback
import time

from decimal import Decimal

from sqlalchemy import text

from app.config.settings import settings
from app.database import SessionLocal

from app.models.factura import Factura
from app.models.nota_credito import NotaCredito
from app.models.nota_debito import NotaDebito

from app.schemas.nota_credito import (
    NotaCreditoCreate,
    DetalleNotaCreditoBase
)

from app.schemas.nota_debito import (
    NotaDebitoCreate,
    DetalleNotaDebitoBase
)

from app.routers.notas_credito import crear_nota_credito
from app.routers.notas_debito import crear_nota_debito


# ============================================================
# CONSULTAR ESTADO FINAL EN APISUNAT
# ============================================================

def esperar_estado_sunat(
    nota,
    tipo,
    max_intentos=6,
    espera=5
):
    """
    Consulta APISUNAT hasta obtener un estado final.

    Estados finales:
        ACEPTADO
        RECHAZADO
        EXCEPCION
        ANULADO

    Estados intermedios:
        PENDIENTE
        PEN
        ERROR
        vacío
        otros
    """

    from app.services.sunat_service import SunatService

    print()
    print(f"Consultando estado final de APISUNAT para {tipo}...")

    for intento in range(1, max_intentos + 1):

        print(
            f"  Intento {intento}/{max_intentos}..."
        )

        document_id = None

        # ====================================================
        # OBTENER DOCUMENT ID
        # ====================================================

        if nota.respuesta_sunat:

            try:

                respuesta_guardada = json.loads(
                    nota.respuesta_sunat
                )

                if isinstance(respuesta_guardada, dict):

                    document_id = (
                        respuesta_guardada.get("documentId")
                        or respuesta_guardada.get("documentID")
                        or respuesta_guardada.get("document_id")
                        or respuesta_guardada.get("id")
                    )

            except Exception as e:

                print(
                    f"  No se pudo interpretar "
                    f"respuesta_sunat: {e}"
                )

        if not document_id:

            print(
                "  ERROR: No se encontró documentId."
            )

            return nota

        print(
            f"  documentId: {document_id}"
        )

        # ====================================================
        # CONSULTAR APISUNAT
        # ====================================================

        try:

            sunat = SunatService()

            respuesta = sunat.consultar_estado(
                str(document_id)
            )

            print()
            print("  Respuesta APISUNAT:")

            print(
                json.dumps(
                    respuesta,
                    indent=2,
                    ensure_ascii=False
                )[:3000]
            )

            estado = ""

            if isinstance(respuesta, dict):

                estado = str(
                    respuesta.get(
                        "status",
                        ""
                    )
                ).strip().upper()

            print()
            print(
                f"  Estado actual: "
                f"{estado or 'NINGUNO'}"
            )

            # =================================================
            # ESTADO FINAL
            # =================================================

            if estado in (
                "ACEPTADO",
                "RECHAZADO",
                "EXCEPCION",
                "ANULADO"
            ):

                print(
                    f"  ESTADO FINAL: {estado}"
                )

                # ---------------------------------------------
                # Guardar estado interno
                # ---------------------------------------------

                if estado == "ACEPTADO":

                    nota.estado_sunat = "Aceptado"

                elif estado == "RECHAZADO":

                    nota.estado_sunat = "Rechazado"

                elif estado == "EXCEPCION":

                    nota.estado_sunat = "Excepcion"

                elif estado == "ANULADO":

                    nota.estado_sunat = "Anulado"

                # ---------------------------------------------
                # Código SUNAT
                # ---------------------------------------------

                if hasattr(nota, "codigo_sunat"):

                    nota.codigo_sunat = estado

                # ---------------------------------------------
                # Guardar respuesta completa
                # ---------------------------------------------

                nota.respuesta_sunat = json.dumps(
                    respuesta,
                    ensure_ascii=False
                )

                return nota

        except Exception as e:

            print(
                f"  Error consultando APISUNAT: {e}"
            )

        # ====================================================
        # ESPERAR ANTES DEL SIGUIENTE INTENTO
        # ====================================================

        if intento < max_intentos:

            print(
                f"  Esperando {espera} segundos..."
            )

            time.sleep(espera)

    print()
    print(
        "  APISUNAT continúa en estado "
        "NO FINAL."
    )

    return nota


# ============================================================
# MOSTRAR ERRORES APISUNAT
# ============================================================

def mostrar_errores_sunat(nota):

    if not nota.respuesta_sunat:

        print(
            "  No existe respuesta_sunat."
        )

        return

    try:

        respuesta = json.loads(
            nota.respuesta_sunat
        )

    except Exception:

        print(
            "  Respuesta SUNAT no es JSON válido:"
        )

        print(
            str(nota.respuesta_sunat)[:1500]
        )

        return

    # ========================================================
    # STATUS
    # ========================================================

    print(
        f"  APISUNAT status: "
        f"{respuesta.get('status', 'N/A')}"
    )

    # ========================================================
    # NOTES
    # ========================================================

    notes = respuesta.get("notes")

    if notes:

        print()
        print("  OBSERVACIONES / NOTES:")

        for nota_sunat in notes:

            print(
                f"    - {nota_sunat}"
            )

    # ========================================================
    # FAULTS
    # ========================================================

    faults = respuesta.get("faults")

    if faults:

        print()
        print("  FAULTS:")

        for i, fault in enumerate(
            faults,
            start=1
        ):

            faultcode = fault.get(
                "faultcode",
                {}
            )

            faultstring = fault.get(
                "faultstring",
                {}
            )

            if isinstance(
                faultcode,
                dict
            ):

                codigo = faultcode.get(
                    "_text",
                    faultcode
                )

            else:

                codigo = faultcode

            if isinstance(
                faultstring,
                dict
            ):

                mensaje = faultstring.get(
                    "_text",
                    faultstring
                )

            else:

                mensaje = faultstring

            print(
                f"    Fault {i}: "
                f"{codigo} - {mensaje}"
            )


# ============================================================
# MOSTRAR RESULTADO NC
# ============================================================

def imprimir_resultado_nc(
    titulo,
    nota
):

    print()
    print("=" * 70)
    print(f"  {titulo}")
    print("=" * 70)

    print(
        f"  ID:              "
        f"{nota.nota_credito_id}"
    )

    print(
        f"  Número generado: "
        f"{nota.numero_nota}"
    )

    print(
        f"  Serie:           "
        f"{nota.serie}"
    )

    print(
        f"  Correlativo:     "
        f"{nota.correlativo}"
    )

    print(
        f"  Estado SUNAT:    "
        f"{nota.estado_sunat}"
    )

    print(
        f"  Código SUNAT:    "
        f"{nota.codigo_sunat}"
    )

    print(
        f"  Fecha envío:     "
        f"{nota.fecha_envio_sunat}"
    )

    mostrar_errores_sunat(nota)


# ============================================================
# MOSTRAR RESULTADO ND
# ============================================================

def imprimir_resultado_nd(
    titulo,
    nota
):

    print()
    print("=" * 70)
    print(f"  {titulo}")
    print("=" * 70)

    print(
        f"  ID:              "
        f"{nota.nota_debito_id}"
    )

    print(
        f"  Número generado: "
        f"{nota.numero_nota}"
    )

    print(
        f"  Serie:           "
        f"{nota.serie}"
    )

    print(
        f"  Correlativo:     "
        f"{nota.correlativo}"
    )

    print(
        f"  Estado SUNAT:    "
        f"{nota.estado_sunat}"
    )

    print(
        f"  Código SUNAT:    "
        f"{nota.codigo_sunat}"
    )

    print(
        f"  Fecha envío:     "
        f"{nota.fecha_envio_sunat}"
    )

    mostrar_errores_sunat(nota)


# ============================================================
# EJECUTAR PRUEBA
# ============================================================

def run_test():

    print("=" * 70)
    print(
        "FASE 1: PRUEBAS NC/ND CON APISUNAT"
    )
    print("=" * 70)

    # ========================================================
    # CONFIGURACIÓN DEL EMISOR
    # ========================================================

    print()
    print("--- CONFIGURACIÓN EMISOR ---")

    print(
        f"  RUC:           "
        f"{settings.SUNAT_RUC}"
    )

    print(
        f"  Razón Social:  "
        f"{settings.SUNAT_RAZON_SOCIAL}"
    )

    print(
        f"  Ambiente:      "
        f"{settings.SUNAT_AMBIENTE}"
    )

    print(
        f"  Ubigeo:        "
        f"{settings.SUNAT_UBIGEO}"
    )

    print(
        f"  API URL:       "
        f"{settings.SUNAT_API_URL}"
    )

    db = SessionLocal()

    try:

        # ====================================================
        # BUSCAR FACTURA
        # ====================================================

        factura_01 = (
            db.query(Factura)
            .filter(
                Factura.tipo_comprobante
                == "Factura Electrónica"
            )
            .order_by(
                Factura.factura_id.desc()
            )
            .first()
        )

        if not factura_01:

            factura_01 = (
                db.query(Factura)
                .filter(
                    Factura.serie.like("F%")
                )
                .order_by(
                    Factura.factura_id.desc()
                )
                .first()
            )

        # ====================================================
        # BUSCAR BOLETA
        # ====================================================

        boleta_03 = (
            db.query(Factura)
            .filter(
                Factura.tipo_comprobante
                == "Boleta Electrónica"
            )
            .order_by(
                Factura.factura_id.desc()
            )
            .first()
        )

        if not boleta_03:

            boleta_03 = (
                db.query(Factura)
                .filter(
                    Factura.serie.like("B%")
                )
                .order_by(
                    Factura.factura_id.desc()
                )
                .first()
            )

        # ====================================================
        # VALIDAR DOCUMENTOS
        # ====================================================

        if not factura_01:

            print(
                "ERROR: No se encontró "
                "ninguna factura."
            )

            return

        if not boleta_03:

            print(
                "ERROR: No se encontró "
                "ninguna boleta."
            )

            return

        print()
        print(
            "--- DOCUMENTOS PARA PRUEBAS ---"
        )

        print(
            f"  Factura: "
            f"ID={factura_01.factura_id} "
            f"Nro={factura_01.numero_comprobante} "
            f"Total={factura_01.total} "
            f"ClienteID={factura_01.cliente_id}"
        )

        print(
            f"  Boleta:  "
            f"ID={boleta_03.factura_id} "
            f"Nro={boleta_03.numero_comprobante} "
            f"Total={boleta_03.total} "
            f"ClienteID={boleta_03.cliente_id}"
        )

        # ====================================================
        # CORRELATIVOS ANTES
        # ====================================================

        print()
        print(
            "--- CORRELATIVOS ANTES "
            "DE LAS PRUEBAS ---"
        )

        rows = db.execute(
            text(
                """
                SELECT
                    tipo_documento,
                    prefijo,
                    siguiente_correlativo
                FROM configuracion_correlativos
                WHERE tipo_documento LIKE '%NOTA%'
                ORDER BY tipo_documento
                """
            )
        ).fetchall()

        for row in rows:

            print(
                f"  {row[0]:30s} "
                f"| {row[1]} "
                f"| sig={row[2]}"
            )

        resultados = {}

        # ====================================================
        # TEST A
        # NC FACTURA
        # ====================================================

        try:

            print()
            print(
                ">>> A) NC FACTURA -> FC01"
            )

            datos = NotaCreditoCreate(

                factura_id=(
                    factura_01.factura_id
                ),

                cliente_id=(
                    factura_01.cliente_id
                ),

                tipo_nota="Credito",

                codigo_motivo="01",

                motivo=(
                    "Anulación de prueba "
                    "test automático"
                ),

                subtotal=Decimal("8.47"),

                impuestos=Decimal("1.53"),

                total=Decimal("10.00"),

                detalles=[

                    DetalleNotaCreditoBase(

                        item_id=None,

                        descripcion=(
                            "Anulación de prueba "
                            "test automático"
                        ),

                        cantidad=Decimal("1"),

                        precio_unitario=(
                            Decimal("8.47")
                        ),

                        impuesto=(
                            Decimal("1.53")
                        ),

                        total=Decimal("10.00")
                    )
                ]
            )

            res = crear_nota_credito(
                datos,
                db
            )

            # CONSULTAR APISUNAT
            res = esperar_estado_sunat(
                res,
                "NC FACTURA"
            )

            db.commit()

            imprimir_resultado_nc(
                "A) NC FACTURA -> FC01",
                res
            )

            resultados["NC_FACTURA"] = (
                "OK"
                if res.estado_sunat
                == "Aceptado"
                else res.estado_sunat
            )

        except Exception as e:

            db.rollback()

            print(
                f"\nERROR en NC Factura: {e}"
            )

            traceback.print_exc()

            resultados[
                "NC_FACTURA"
            ] = f"ERROR: {e}"

        # ====================================================
        # TEST B
        # NC BOLETA
        # ====================================================

        try:

            print()
            print(
                ">>> B) NC BOLETA -> BC01"
            )

            datos = NotaCreditoCreate(

                factura_id=(
                    boleta_03.factura_id
                ),

                cliente_id=(
                    boleta_03.cliente_id
                ),

                tipo_nota="Credito",

                codigo_motivo="01",

                motivo=(
                    "Devolución garantía "
                    "boleta test automático"
                ),

                subtotal=Decimal("8.47"),

                impuestos=Decimal("1.53"),

                total=Decimal("10.00"),

                detalles=[

                    DetalleNotaCreditoBase(

                        item_id=None,

                        descripcion=(
                            "Devolución garantía "
                            "boleta test automático"
                        ),

                        cantidad=Decimal("1"),

                        precio_unitario=(
                            Decimal("8.47")
                        ),

                        impuesto=(
                            Decimal("1.53")
                        ),

                        total=Decimal("10.00")
                    )
                ]
            )

            res = crear_nota_credito(
                datos,
                db
            )

            # CONSULTAR APISUNAT
            res = esperar_estado_sunat(
                res,
                "NC BOLETA"
            )

            db.commit()

            imprimir_resultado_nc(
                "B) NC BOLETA -> BC01",
                res
            )

            resultados["NC_BOLETA"] = (
                "OK"
                if res.estado_sunat
                == "Aceptado"
                else res.estado_sunat
            )

        except Exception as e:

            db.rollback()

            print(
                f"\nERROR en NC Boleta: {e}"
            )

            traceback.print_exc()

            resultados[
                "NC_BOLETA"
            ] = f"ERROR: {e}"

        # ====================================================
        # TEST C
        # ND FACTURA
        # ====================================================

        try:

            print()
            print(
                ">>> C) ND FACTURA -> FD01"
            )

            datos = NotaDebitoCreate(

                factura_id=(
                    factura_01.factura_id
                ),

                cliente_id=(
                    factura_01.cliente_id
                ),

                tipo_nota="Debito",

                codigo_motivo="02",

                motivo=(
                    "Penalidad gasto adicional "
                    "test automático"
                ),

                subtotal=Decimal("12.71"),

                impuestos=Decimal("2.29"),

                total=Decimal("15.00"),

                detalles=[

                    DetalleNotaDebitoBase(

                        item_id=None,

                        descripcion=(
                            "Penalidad gasto adicional "
                            "test automático"
                        ),

                        cantidad=Decimal("1"),

                        precio_unitario=(
                            Decimal("12.71")
                        ),

                        impuesto=(
                            Decimal("2.29")
                        ),

                        total=Decimal("15.00")
                    )
                ]
            )

            res = crear_nota_debito(
                datos,
                db
            )

            # CONSULTAR APISUNAT
            res = esperar_estado_sunat(
                res,
                "ND FACTURA"
            )

            db.commit()

            imprimir_resultado_nd(
                "C) ND FACTURA -> FD01",
                res
            )

            resultados["ND_FACTURA"] = (
                "OK"
                if res.estado_sunat
                == "Aceptado"
                else res.estado_sunat
            )

        except Exception as e:

            db.rollback()

            print(
                f"\nERROR en ND Factura: {e}"
            )

            traceback.print_exc()

            resultados[
                "ND_FACTURA"
            ] = f"ERROR: {e}"

        # ====================================================
        # TEST D
        # ND BOLETA
        # ====================================================

        try:

            print()
            print(
                ">>> D) ND BOLETA -> BD01"
            )

            datos = NotaDebitoCreate(

                factura_id=(
                    boleta_03.factura_id
                ),

                cliente_id=(
                    boleta_03.cliente_id
                ),

                tipo_nota="Debito",

                codigo_motivo="02",

                motivo=(
                    "Gasto reprogramación "
                    "boleta test automático"
                ),

                subtotal=Decimal("8.47"),

                impuestos=Decimal("1.53"),

                total=Decimal("10.00"),

                detalles=[

                    DetalleNotaDebitoBase(

                        item_id=None,

                        descripcion=(
                            "Gasto reprogramación "
                            "boleta test automático"
                        ),

                        cantidad=Decimal("1"),

                        precio_unitario=(
                            Decimal("8.47")
                        ),

                        impuesto=(
                            Decimal("1.53")
                        ),

                        total=Decimal("10.00")
                    )
                ]
            )

            res = crear_nota_debito(
                datos,
                db
            )

            # CONSULTAR APISUNAT
            res = esperar_estado_sunat(
                res,
                "ND BOLETA"
            )

            db.commit()

            imprimir_resultado_nd(
                "D) ND BOLETA -> BD01",
                res
            )

            resultados["ND_BOLETA"] = (
                "OK"
                if res.estado_sunat
                == "Aceptado"
                else res.estado_sunat
            )

        except Exception as e:

            db.rollback()

            print(
                f"\nERROR en ND Boleta: {e}"
            )

            traceback.print_exc()

            resultados[
                "ND_BOLETA"
            ] = f"ERROR: {e}"

        # ====================================================
        # TEST E
        # VALIDAR MONTO EXCESIVO
        # ====================================================

        print()
        print("=" * 70)
        print(
            "E) VALIDACIÓN MONTO EXCESIVO"
        )
        print("=" * 70)

        try:

            datos_inv = NotaCreditoCreate(

                factura_id=(
                    factura_01.factura_id
                ),

                cliente_id=(
                    factura_01.cliente_id
                ),

                tipo_nota="Credito",

                codigo_motivo="01",

                motivo=(
                    "Prueba monto excesivo"
                ),

                subtotal=Decimal("999999"),

                impuestos=Decimal("0"),

                total=Decimal("999999"),

                detalles=[]
            )

            crear_nota_credito(
                datos_inv,
                db
            )

            print(
                "  FALLO: Debió rechazar "
                "monto superior al comprobante."
            )

            resultados[
                "VALIDACION_MONTO"
            ] = "FALLO"

        except Exception as e:

            db.rollback()

            print(
                f"  OK: Rechazo correcto -> {e}"
            )

            resultados[
                "VALIDACION_MONTO"
            ] = "OK"

        # ====================================================
        # CORRELATIVOS DESPUÉS
        # ====================================================

        print()
        print(
            "--- CORRELATIVOS DESPUÉS "
            "DE LAS PRUEBAS ---"
        )

        rows = db.execute(
            text(
                """
                SELECT
                    tipo_documento,
                    prefijo,
                    siguiente_correlativo
                FROM configuracion_correlativos
                WHERE tipo_documento LIKE '%NOTA%'
                ORDER BY tipo_documento
                """
            )
        ).fetchall()

        for row in rows:

            print(
                f"  {row[0]:30s} "
                f"| {row[1]} "
                f"| sig={row[2]}"
            )

        # ====================================================
        # RESUMEN
        # ====================================================

        print()
        print("=" * 70)
        print(
            "RESUMEN FASE 1"
        )
        print("=" * 70)

        for clave, valor in resultados.items():

            if valor == "OK":

                estado = "PASS"

            else:

                estado = valor

            print(
                f"  {clave:25s} -> {estado}"
            )

        print()
        print("=" * 70)
        print(
            "FIN DE PRUEBAS"
        )
        print("=" * 70)

    finally:

        db.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    run_test()