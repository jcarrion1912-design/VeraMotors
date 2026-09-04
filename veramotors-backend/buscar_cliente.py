from sqlalchemy import create_engine, text
from app.config.settings import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as connection:
    resultado = connection.execute(
        text("""
            SELECT
                cliente_id,
                documento_identidad,
                nombre_razon_social,
                direccion_ubigeo,
                email
            FROM clientes
            WHERE documento_identidad = '74859632';
        """)
    )

    for fila in resultado:
        print(f"cliente_id: {fila.cliente_id}")
        print(f"documento: {fila.documento_identidad}")
        print(f"nombre: {fila.nombre_razon_social}")
        print(f"ubigeo: {fila.direccion_ubigeo}")
        print(f"email: {fila.email}")