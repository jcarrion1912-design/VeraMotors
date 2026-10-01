import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no configurada en .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def ejecutar_migracion_fase4():
    print("Aplicando migración aditiva de Remisiones y Despacho...")

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS factura_id BIGINT"))
        connection.execute(text("ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS usuario_despacho_id BIGINT"))
        connection.execute(text("ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS fecha_despacho TIMESTAMP WITHOUT TIME ZONE"))
        connection.execute(text("ALTER TABLE detalle_remision ADD COLUMN IF NOT EXISTS factura_detalle_id BIGINT"))

        connection.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_remisiones_factura_id'
                ) THEN
                    ALTER TABLE remisiones ADD CONSTRAINT fk_remisiones_factura_id
                        FOREIGN KEY (factura_id) REFERENCES facturas(factura_id)
                        ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_remisiones_usuario_despacho'
                ) THEN
                    ALTER TABLE remisiones ADD CONSTRAINT fk_remisiones_usuario_despacho
                        FOREIGN KEY (usuario_despacho_id) REFERENCES usuarios(user_id)
                        ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_detalle_remision_factura_detalle'
                ) THEN
                    ALTER TABLE detalle_remision ADD CONSTRAINT fk_detalle_remision_factura_detalle
                        FOREIGN KEY (factura_detalle_id) REFERENCES detalle_factura(detalle_factura_id)
                        ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
                END IF;
            END $$;
        """))

        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_remisiones_factura_id ON remisiones(factura_id) WHERE factura_id IS NOT NULL"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_detalle_remision_factura_detalle ON detalle_remision(factura_detalle_id) WHERE factura_detalle_id IS NOT NULL"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_remisiones_estado ON remisiones(estado)"))

        connection.execute(text("ALTER TABLE remisiones VALIDATE CONSTRAINT fk_remisiones_factura_id"))
        connection.execute(text("ALTER TABLE remisiones VALIDATE CONSTRAINT fk_remisiones_usuario_despacho"))
        connection.execute(text("ALTER TABLE detalle_remision VALIDATE CONSTRAINT fk_detalle_remision_factura_detalle"))

    print("[OK] Columnas, relaciones e índices de Fase 4 aplicados sin reemplazar tablas existentes.")


if __name__ == "__main__":
    ejecutar_migracion_fase4()
