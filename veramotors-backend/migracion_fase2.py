import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


ADD_COLUMNS = [
    (
        "cotizaciones",
        "aprobado_por",
        "ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS aprobado_por BIGINT NULL;"
    ),
    (
        "cotizaciones",
        "fecha_aprobacion",
        "ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP NULL;"
    ),
    (
        "cotizaciones",
        "rechazado_por",
        "ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS rechazado_por BIGINT NULL;"
    ),
    (
        "cotizaciones",
        "fecha_rechazo",
        "ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP NULL;"
    ),
    (
        "cotizaciones",
        "motivo_rechazo",
        "ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS motivo_rechazo VARCHAR(255) NULL;"
    ),
]


def ejecutar_migracion_fase2():
    print("Iniciando migración segura de cotizaciones...")
    with engine.begin() as conn:
        for table_name, column_name, query in ADD_COLUMNS:
            exists = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.columns WHERE table_name = :table_name AND column_name = :column_name"
                ),
                {"table_name": table_name, "column_name": column_name},
            ).fetchone()
            if exists:
                print(f"[EXISTE] {table_name}.{column_name}")
                continue
            print(f"[NUEVO] Agregando {table_name}.{column_name}")
            conn.execute(text(query))

        conn.execute(text("ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;"))
        conn.execute(text("ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_estado_check CHECK (estado IN ('Pendiente','Aprobada','Rechazada')) NOT VALID;"))

    print("Migración finalizada.")


if __name__ == "__main__":
    ejecutar_migracion_fase2()
