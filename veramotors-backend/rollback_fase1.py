import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def rollback_fase1():
    print("Iniciando reversión de migración fase 1...")
    with engine.connect() as conn:
        conn.execute(text("""
            DELETE FROM configuracion_correlativos 
            WHERE tipo_documento IN ('NOTA_CREDITO_FACTURA', 'NOTA_CREDITO_BOLETA', 'NOTA_DEBITO_FACTURA', 'NOTA_DEBITO_BOLETA')
        """))
        conn.execute(text("ALTER TABLE configuracion_correlativos DROP CONSTRAINT IF EXISTS chk_correlativo_tipo"))
        conn.execute(text("""
            ALTER TABLE configuracion_correlativos 
            ADD CONSTRAINT chk_correlativo_tipo 
            CHECK (tipo_documento IN (
                'FACTURA', 'BOLETA', 'COTIZACION', 'ODS', 
                'NOTA_CREDITO', 'NOTA_DEBITO', 'REMISION', 'COMPRA'
            ))
        """))
        conn.commit()
        print("[OK] Reversión completada.")

if __name__ == "__main__":
    rollback_fase1()
