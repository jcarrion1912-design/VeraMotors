import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no configurada en .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def ejecutar_migracion_fase3():
    print("Iniciando migración de Fase 3: recepción y pagos a proveedores...")

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS recepciones (
                    recepcion_id BIGSERIAL PRIMARY KEY,
                    compra_id BIGINT NOT NULL REFERENCES compras(compra_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    proveedor_id BIGINT NOT NULL REFERENCES proveedores(proveedor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    usuario_id BIGINT NOT NULL REFERENCES usuarios(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    fecha_recepcion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    estado VARCHAR(30) NOT NULL DEFAULT 'Registrada',
                    observaciones TEXT
                );
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS recepciones_detalle (
                    detalle_recepcion_id BIGSERIAL PRIMARY KEY,
                    recepcion_id BIGINT NOT NULL REFERENCES recepciones(recepcion_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    item_id BIGINT,
                    descripcion VARCHAR(255) NOT NULL,
                    cantidad_ordenada NUMERIC(12,2) NOT NULL DEFAULT 0,
                    cantidad_recibida NUMERIC(12,2) NOT NULL DEFAULT 0,
                    cantidad_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0,
                    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL DEFAULT 0
                );
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS facturas_proveedor (
                    factura_proveedor_id BIGSERIAL PRIMARY KEY,
                    proveedor_id BIGINT NOT NULL REFERENCES proveedores(proveedor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    compra_id BIGINT REFERENCES compras(compra_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    recepcion_id BIGINT REFERENCES recepciones(recepcion_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    tipo_comprobante VARCHAR(30) NOT NULL,
                    serie VARCHAR(20) NOT NULL,
                    numero VARCHAR(30) NOT NULL,
                    fecha_emision TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_vencimiento TIMESTAMP WITHOUT TIME ZONE,
                    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
                    igv NUMERIC(12,2) NOT NULL DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL DEFAULT 0,
                    moneda VARCHAR(10) NOT NULL DEFAULT 'PEN',
                    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
                    observaciones TEXT,
                    CONSTRAINT uq_facturas_proveedor_clave UNIQUE (proveedor_id, tipo_comprobante, serie, numero)
                );
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS detalle_factura_proveedor (
                    detalle_factura_proveedor_id BIGSERIAL PRIMARY KEY,
                    factura_proveedor_id BIGINT NOT NULL REFERENCES facturas_proveedor(factura_proveedor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    descripcion VARCHAR(255) NOT NULL,
                    cantidad NUMERIC(12,2) NOT NULL DEFAULT 0,
                    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
                    impuesto NUMERIC(12,2) NOT NULL DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL DEFAULT 0
                );
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS pagos_proveedor (
                    pago_proveedor_id BIGSERIAL PRIMARY KEY,
                    factura_proveedor_id BIGINT NOT NULL REFERENCES facturas_proveedor(factura_proveedor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    usuario_id BIGINT NOT NULL REFERENCES usuarios(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
                    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Transferencia',
                    observaciones TEXT
                );
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS movimientos_inventario (
                    movimiento_id BIGSERIAL PRIMARY KEY,
                    item_id BIGINT NOT NULL REFERENCES inventario(item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    usuario_id BIGINT NOT NULL REFERENCES usuarios(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                    fecha_movimiento TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    tipo_movimiento VARCHAR(30) NOT NULL,
                    cantidad NUMERIC(12,2) NOT NULL DEFAULT 0,
                    stock_anterior NUMERIC(12,2) NOT NULL DEFAULT 0,
                    stock_nuevo NUMERIC(12,2) NOT NULL DEFAULT 0,
                    referencia VARCHAR(100),
                    observaciones TEXT
                );
                """
            )
        )

        conn.commit()

    print("[OK] Migración de Fase 3 completada: tablas creadas en PostgreSQL.")


if __name__ == "__main__":
    ejecutar_migracion_fase3()
