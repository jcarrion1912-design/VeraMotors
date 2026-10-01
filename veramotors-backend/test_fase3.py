import os
from pathlib import Path
from sqlalchemy import create_engine, text

values = {}
for line in Path('.env').read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    values[key.strip()] = value.strip()

engine = create_engine(values['DATABASE_URL'])

with engine.connect() as conn:
    tables = set(
        conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        ).scalars().all()
    )

    required = {
        'recepciones',
        'recepciones_detalle',
        'facturas_proveedor',
        'detalle_factura_proveedor',
        'pagos_proveedor',
    }

    missing = sorted(required - tables)
    if missing:
        raise AssertionError(f"Faltan tablas requeridas para Fase 3: {missing}")

    print('OK: tablas de recepción y pagos proveedor presentes en PostgreSQL.')
