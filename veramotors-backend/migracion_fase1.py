import os
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def ejecutar_migracion_fase1():
    print("Iniciando respaldo y migración de configuracion_correlativos...")
    
    with engine.connect() as conn:
        # 1. Backup de la tabla configuracion_correlativos
        rows = conn.execute(text("SELECT * FROM configuracion_correlativos")).fetchall()
        backup_data = [dict(r._mapping) for r in rows]
        
        backup_file = f"backup_correlativos_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, indent=4, ensure_ascii=False)
        print(f"[OK] Backup guardado en {backup_file} con {len(backup_data)} registros.")
        
        # 2. Actualizar el CHECK CONSTRAINT chk_correlativo_tipo
        print("[MIGRACIÓN] Actualizando CHECK constraint chk_correlativo_tipo...")
        conn.execute(text("ALTER TABLE configuracion_correlativos DROP CONSTRAINT IF EXISTS chk_correlativo_tipo"))
        conn.execute(text("""
            ALTER TABLE configuracion_correlativos 
            ADD CONSTRAINT chk_correlativo_tipo 
            CHECK (tipo_documento IN (
                'FACTURA', 'BOLETA', 'COTIZACION', 'ODS', 
                'NOTA_CREDITO', 'NOTA_DEBITO', 'REMISION', 'COMPRA',
                'NOTA_CREDITO_FACTURA', 'NOTA_CREDITO_BOLETA', 
                'NOTA_DEBITO_FACTURA', 'NOTA_DEBITO_BOLETA'
            ))
        """))
        print("[OK] Constraint chk_correlativo_tipo actualizado con éxito.")

        # 3. Insertar registros diferenciados
        nuevos_correlativos = [
            ("NOTA_CREDITO_FACTURA", "FC01", 1),
            ("NOTA_CREDITO_BOLETA", "BC01", 5),
            ("NOTA_DEBITO_FACTURA", "FD01", 1),
            ("NOTA_DEBITO_BOLETA", "BD01", 1),
        ]
        
        for tipo, prefijo, sig in nuevos_correlativos:
            existente = conn.execute(
                text("SELECT correlativo_id, prefijo, siguiente_correlativo FROM configuracion_correlativos WHERE tipo_documento = :tipo"),
                {"tipo": tipo}
            ).fetchone()
            
            if not existente:
                conn.execute(
                    text("""
                        INSERT INTO configuracion_correlativos (tipo_documento, prefijo, siguiente_correlativo, activo)
                        VALUES (:tipo, :prefijo, :sig, true)
                    """),
                    {"tipo": tipo, "prefijo": prefijo, "sig": sig}
                )
                print(f"[NUEVO] Insertado correlativo: {tipo} -> {prefijo} (siguiente: {sig})")
            else:
                print(f"[EXISTE] Correlativo ya presente: {tipo} -> prefijo actual: {existente.prefijo}")
        
        conn.commit()
        
        # 4. Mostrar estado final de configuracion_correlativos
        final_rows = conn.execute(text("SELECT * FROM configuracion_correlativos ORDER BY correlativo_id")).fetchall()
        print("\n=== ESTADO FINAL DE CONFIGURACION_CORRELATIVOS ===")
        for r in final_rows:
            print(dict(r._mapping))

if __name__ == "__main__":
    ejecutar_migracion_fase1()
