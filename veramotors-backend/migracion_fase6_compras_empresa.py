"""
Migración aditiva, segura de repetir:
  - detalle_compras: ítems de cada orden de compra.
  - configuracion_empresa: parámetros institucionales del taller (una fila).

No modifica ni borra datos existentes. Ejecutar desde veramotors-backend:
    python migracion_fase6_compras_empresa.py
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no configurada en .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def ejecutar_migracion_fase6():
    print("Aplicando migración aditiva de ítems de compra y parámetros del taller...")

    with engine.begin() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS detalle_compras (
                detalle_compra_id BIGSERIAL PRIMARY KEY,
                compra_id BIGINT NOT NULL REFERENCES compras(compra_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                item_id BIGINT NOT NULL REFERENCES inventario(item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                cantidad NUMERIC(12,2) NOT NULL DEFAULT 0,
                precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
                descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
                impuesto NUMERIC(12,2) NOT NULL DEFAULT 0,
                total NUMERIC(12,2) NOT NULL DEFAULT 0
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_detalle_compras_compra_id ON detalle_compras(compra_id)"
        ))

        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS configuracion_empresa (
                empresa_id BIGSERIAL PRIMARY KEY,
                nombre VARCHAR(200) NOT NULL,
                desarrollador VARCHAR(200),
                ruc VARCHAR(11) NOT NULL,
                direccion VARCHAR(255),
                telefono VARCHAR(30),
                email VARCHAR(150),
                igv NUMERIC(5,2) NOT NULL DEFAULT 18,
                moneda VARCHAR(50) NOT NULL DEFAULT 'PEN - Soles (S/)'
            )
        """))
        connection.execute(text("""
            INSERT INTO configuracion_empresa (nombre, desarrollador, ruc, direccion, telefono, email, igv, moneda)
            SELECT 'VERAMOTORS S.A.C.', 'RAZOR S.A.C.', '20601234567',
                   'Av. La Marina 2840, San Miguel, Lima', '+51 1 458-9200',
                   'contacto@veramotors.pe', 18, 'PEN - Soles (S/)'
            WHERE NOT EXISTS (SELECT 1 FROM configuracion_empresa)
        """))

    print("Migración aplicada.")


if __name__ == "__main__":
    ejecutar_migracion_fase6()
