from sqlalchemy import create_engine, text
from app.config.settings import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as connection:
    resultado = connection.execute(
        text("""
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conname = 'chk_factura_metodo_pago';
        """)
    )

    for fila in resultado:
        print(fila[0])