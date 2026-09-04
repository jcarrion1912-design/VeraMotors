from sqlalchemy import create_engine, text
from app.config.settings import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as connection:
    resultado = connection.execute(
        text("""
            SELECT
                factura_id,
                cliente_id,
                tipo_comprobante,
                serie,
                correlativo,
                numero_comprobante,
                estado_sunat,
                respuesta_sunat
            FROM facturas
            WHERE serie = 'B001'
            ORDER BY factura_id;
        """)
    )

    for fila in resultado:
        print("--------------------------------")
        print(f"factura_id: {fila.factura_id}")
        print(f"cliente_id: {fila.cliente_id}")
        print(f"tipo: {fila.tipo_comprobante}")
        print(f"serie: {fila.serie}")
        print(f"correlativo: {fila.correlativo}")
        print(f"numero: {fila.numero_comprobante}")
        print(f"estado_sunat: {fila.estado_sunat}")
        print(f"respuesta_sunat: {fila.respuesta_sunat}")