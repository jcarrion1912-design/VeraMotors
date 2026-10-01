import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no configurada en .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def ejecutar_migracion_fase5():
    print("Aplicando migración aditiva de pagos, CxC y caja...")

    with engine.begin() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS pagos (
                pago_id BIGSERIAL PRIMARY KEY,
                cuenta_cobrar_id BIGINT NOT NULL REFERENCES cuentas_por_cobrar(cuenta_cobrar_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                cierre_caja_id BIGINT NOT NULL REFERENCES cierres_caja(cierre_caja_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                usuario_id BIGINT NOT NULL REFERENCES usuarios(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
                fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                monto NUMERIC(12,2) NOT NULL CONSTRAINT chk_pagos_monto CHECK (monto > 0),
                metodo_pago VARCHAR(30) NOT NULL CONSTRAINT chk_pagos_metodo CHECK (metodo_pago IN ('Efectivo','Yape','Plin','Tarjeta','Transferencia','Otro')),
                observaciones TEXT
            )
        """))
        connection.execute(text("ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS usuario_cierre_id BIGINT"))
        connection.execute(text("ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS total_otros NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS cantidad_operaciones BIGINT NOT NULL DEFAULT 0"))

        connection.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cierre_usuario_cierre') THEN
                    ALTER TABLE cierres_caja ADD CONSTRAINT fk_cierre_usuario_cierre
                        FOREIGN KEY (usuario_cierre_id) REFERENCES usuarios(user_id)
                        ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
                END IF;
            END $$;
        """))
        connection.execute(text("ALTER TABLE cierres_caja VALIDATE CONSTRAINT fk_cierre_usuario_cierre"))

        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cierres_una_abierta ON cierres_caja ((estado)) WHERE estado = 'Abierta'"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_pagos_fecha ON pagos(fecha)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_pagos_cierre_metodo ON pagos(cierre_caja_id, metodo_pago)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_pagos_cuenta ON pagos(cuenta_cobrar_id)"))

        connection.execute(text("ALTER TABLE cuentas_por_cobrar DROP CONSTRAINT IF EXISTS chk_cxc_estado"))
        connection.execute(text("""
            ALTER TABLE cuentas_por_cobrar ADD CONSTRAINT chk_cxc_estado
            CHECK (estado IN ('Pendiente','Parcial','Pagada','Vencida','Anulada'))
        """))

        connection.execute(text("""
            INSERT INTO cuentas_por_cobrar (
                factura_id, cliente_id, fecha_emision, fecha_vencimiento,
                monto_total, monto_pagado, saldo, estado
            )
            SELECT f.factura_id, f.cliente_id, f.fecha_emision,
                   COALESCE(f.fecha_vencimiento, f.fecha_emision), f.total,
                   CASE WHEN f.estado_pago = 'Pagado' THEN f.total ELSE 0 END,
                   CASE WHEN f.estado_pago IN ('Pagado','Anulado') THEN 0 ELSE f.total END,
                   CASE WHEN f.estado_pago = 'Anulado' THEN 'Anulada'
                        WHEN f.estado_pago = 'Pagado' THEN 'Pagada'
                        ELSE 'Pendiente' END
              FROM facturas f
            ON CONFLICT (factura_id) DO NOTHING
        """))

        connection.execute(text("""
            UPDATE cuentas_por_cobrar c
               SET monto_total = f.total,
                   fecha_vencimiento = COALESCE(f.fecha_vencimiento, f.fecha_emision),
                   monto_pagado = CASE
                       WHEN f.estado_pago = 'Pagado' THEN f.total
                       ELSE LEAST(c.monto_pagado, f.total)
                   END,
                   saldo = CASE
                       WHEN f.estado_pago IN ('Pagado','Anulado') THEN 0
                       ELSE GREATEST(f.total - LEAST(c.monto_pagado, f.total), 0)
                   END,
                   estado = CASE
                       WHEN f.estado_pago = 'Anulado' THEN 'Anulada'
                       WHEN f.estado_pago = 'Pagado' THEN 'Pagada'
                       WHEN c.monto_pagado > 0 AND c.monto_pagado < f.total THEN 'Parcial'
                       ELSE 'Pendiente'
                   END
              FROM facturas f
             WHERE c.factura_id = f.factura_id
               AND NOT EXISTS (
                   SELECT 1 FROM pagos p WHERE p.cuenta_cobrar_id = c.cuenta_cobrar_id
               )
        """))

    print("[OK] Pagos, vínculos de caja y cuentas por cobrar migrados; no se generaron pagos históricos ficticios.")


if __name__ == "__main__":
    ejecutar_migracion_fase5()
