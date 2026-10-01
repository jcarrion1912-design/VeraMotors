"""
sync_correlativos.py
====================
Sincroniza configuracion_correlativos.siguiente_correlativo con el
MAX(correlativo) real que existe en notas_credito y notas_debito,
agrupado por serie.

NO borra datos. NO cambia números de documentos existentes.
Solo actualiza siguiente_correlativo = MAX(correlativo) + 1.
"""

from sqlalchemy import text
from app.database import SessionLocal


SERIE_A_TIPO = {
    "FC01": "NOTA_CREDITO_FACTURA",
    "BC01": "NOTA_CREDITO_BOLETA",
    "FD01": "NOTA_DEBITO_FACTURA",
    "BD01": "NOTA_DEBITO_BOLETA",
}


def sync():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("SINCRONIZACIÓN DE CORRELATIVOS")
        print("=" * 60)

        # -------------------------------------------------------
        # 1. Notas de Crédito - MAX(correlativo) por serie
        # -------------------------------------------------------
        rows_nc = db.execute(text(
            "SELECT serie, MAX(correlativo) AS max_corr, COUNT(*) AS cnt "
            "FROM notas_credito GROUP BY serie"
        )).fetchall()

        print("\n--- Notas de Crédito en BD ---")
        for row in rows_nc:
            serie, max_corr, cnt = row
            print(f"  Serie {serie}: {cnt} documento(s), MAX correlativo = {max_corr}")

            tipo_doc = SERIE_A_TIPO.get(serie)
            if tipo_doc:
                nuevo_sig = max_corr + 1
                result = db.execute(text(
                    "UPDATE configuracion_correlativos "
                    "SET siguiente_correlativo = :sig "
                    "WHERE tipo_documento = :tipo AND prefijo = :prefijo "
                    "AND siguiente_correlativo < :sig"
                ), {"sig": nuevo_sig, "tipo": tipo_doc, "prefijo": serie})
                if result.rowcount > 0:
                    print(f"    → Actualizado {tipo_doc}.siguiente_correlativo = {nuevo_sig}")
                else:
                    print(f"    → {tipo_doc} ya estaba correcto (>= {nuevo_sig})")
            else:
                print(f"    → Serie {serie} no mapeada a tipo_documento diferenciado")

        # -------------------------------------------------------
        # 2. Notas de Débito - MAX(correlativo) por serie
        # -------------------------------------------------------
        rows_nd = db.execute(text(
            "SELECT serie, MAX(correlativo) AS max_corr, COUNT(*) AS cnt "
            "FROM notas_debito GROUP BY serie"
        )).fetchall()

        print("\n--- Notas de Débito en BD ---")
        for row in rows_nd:
            serie, max_corr, cnt = row
            print(f"  Serie {serie}: {cnt} documento(s), MAX correlativo = {max_corr}")

            tipo_doc = SERIE_A_TIPO.get(serie)
            if tipo_doc:
                nuevo_sig = max_corr + 1
                result = db.execute(text(
                    "UPDATE configuracion_correlativos "
                    "SET siguiente_correlativo = :sig "
                    "WHERE tipo_documento = :tipo AND prefijo = :prefijo "
                    "AND siguiente_correlativo < :sig"
                ), {"sig": nuevo_sig, "tipo": tipo_doc, "prefijo": serie})
                if result.rowcount > 0:
                    print(f"    → Actualizado {tipo_doc}.siguiente_correlativo = {nuevo_sig}")
                else:
                    print(f"    → {tipo_doc} ya estaba correcto (>= {nuevo_sig})")
            else:
                print(f"    → Serie {serie} no mapeada a tipo_documento diferenciado")

        # También sincronizar el viejo NOTA_CREDITO (BC01) y NOTA_DEBITO (BD01)
        # con el máximo real de sus prefijos respectivos
        print("\n--- Sincronizando correlativos legacy (NOTA_CREDITO / NOTA_DEBITO) ---")
        for legacy_tipo, serie_prefix in [("NOTA_CREDITO", "BC01"), ("NOTA_DEBITO", "BD01")]:
            tabla = "notas_credito" if "CREDITO" in legacy_tipo else "notas_debito"
            row = db.execute(text(
                f"SELECT MAX(correlativo) FROM {tabla} WHERE serie = :serie"
            ), {"serie": serie_prefix}).fetchone()
            max_c = row[0] if row and row[0] else 0
            if max_c > 0:
                nuevo = max_c + 1
                result = db.execute(text(
                    "UPDATE configuracion_correlativos "
                    "SET siguiente_correlativo = :sig "
                    "WHERE tipo_documento = :tipo AND prefijo = :prefijo "
                    "AND siguiente_correlativo < :sig"
                ), {"sig": nuevo, "tipo": legacy_tipo, "prefijo": serie_prefix})
                if result.rowcount > 0:
                    print(f"  {legacy_tipo} ({serie_prefix}): actualizado a {nuevo}")
                else:
                    print(f"  {legacy_tipo} ({serie_prefix}): ya correcto")

        db.commit()

        # -------------------------------------------------------
        # 3. Mostrar estado final
        # -------------------------------------------------------
        print("\n--- Estado final de configuracion_correlativos ---")
        rows = db.execute(text(
            "SELECT tipo_documento, prefijo, siguiente_correlativo, activo "
            "FROM configuracion_correlativos "
            "ORDER BY tipo_documento"
        )).fetchall()
        for row in rows:
            print(f"  {row[0]:30s} | {row[1]:6s} | sig={row[2]:3d} | activo={row[3]}")

    finally:
        db.close()


if __name__ == "__main__":
    sync()
