-- Migration guard for detalle_cotizacion.item_id -> inventario.item_id.
-- Run in a transaction using the same PostgreSQL search_path as the API.
-- It never deletes or rewrites rows. It aborts if the schema/data are unsafe.

BEGIN;

DO $migration$
DECLARE
    schema_name TEXT := current_schema();
    detalles_oid REGCLASS := to_regclass(format('%I.%I', current_schema(), 'detalle_cotizacion'));
    inventario_oid REGCLASS := to_regclass(format('%I.%I', current_schema(), 'inventario'));
    detalle_item_attnum SMALLINT;
    inventario_item_attnum SMALLINT;
    detalle_item_type OID;
    inventario_item_type OID;
    fk_count INTEGER;
    orphan_count BIGINT;
BEGIN
    IF detalles_oid IS NULL OR inventario_oid IS NULL THEN
        RAISE EXCEPTION
            'No se encontró detalle_cotizacion o inventario en el esquema actual (%). No se aplicaron cambios.',
            schema_name;
    END IF;

    SELECT attnum, atttypid
      INTO detalle_item_attnum, detalle_item_type
      FROM pg_attribute
     WHERE attrelid = detalles_oid
       AND attname = 'item_id'
       AND NOT attisdropped;

    SELECT attnum, atttypid
      INTO inventario_item_attnum, inventario_item_type
      FROM pg_attribute
     WHERE attrelid = inventario_oid
       AND attname = 'item_id'
       AND NOT attisdropped;

    IF detalle_item_attnum IS NULL OR inventario_item_attnum IS NULL THEN
        RAISE EXCEPTION
            'No se encontró item_id en ambas tablas. No se aplicaron cambios.';
    END IF;

    IF detalle_item_type <> inventario_item_type THEN
        RAISE EXCEPTION
            'Los tipos de item_id no coinciden (detalle=%; inventario=%). No se aplicaron cambios.',
            format_type(detalle_item_type, NULL),
            format_type(inventario_item_type, NULL);
    END IF;

    SELECT COUNT(*)
      INTO fk_count
      FROM pg_constraint c
     WHERE c.contype = 'f'
       AND c.conrelid = detalles_oid
       AND c.confrelid = inventario_oid
       AND c.conkey = ARRAY[detalle_item_attnum]::SMALLINT[]
       AND c.confkey = ARRAY[inventario_item_attnum]::SMALLINT[];

    IF fk_count > 0 THEN
        IF EXISTS (
            SELECT 1
              FROM pg_constraint c
             WHERE c.contype = 'f'
               AND c.conrelid = detalles_oid
               AND c.confrelid = inventario_oid
               AND c.conkey = ARRAY[detalle_item_attnum]::SMALLINT[]
               AND c.confkey = ARRAY[inventario_item_attnum]::SMALLINT[]
               AND (
                   c.confupdtype <> 'c'
                   OR c.confdeltype <> 'r'
                   OR NOT c.convalidated
               )
        ) THEN
            RAISE EXCEPTION
                'La FK existe, pero sus acciones no coinciden con SQLAlchemy (ON UPDATE CASCADE, ON DELETE RESTRICT). Revisión manual requerida.';
        END IF;

        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS ix_detalle_cotizacion_item_id '
            'ON %I.detalle_cotizacion(item_id)',
            schema_name
        );
        RAISE NOTICE 'La FK correcta ya existe; se aseguró el índice para item_id.';
        RETURN;
    END IF;

    EXECUTE format(
        'SELECT COUNT(*) FROM %I.detalle_cotizacion d '
        'LEFT JOIN %I.inventario i ON i.item_id = d.item_id '
        'WHERE d.item_id IS NOT NULL AND i.item_id IS NULL',
        schema_name,
        schema_name
    )
    INTO orphan_count;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION
            'Se encontraron % filas con item_id sin producto asociado. No se agregará la FK ni se borrarán/cambiarán datos.',
            orphan_count;
    END IF;

    EXECUTE format(
        'ALTER TABLE %I.detalle_cotizacion '
        'ADD CONSTRAINT fk_detalle_cotizacion_inventario_item '
        'FOREIGN KEY (item_id) REFERENCES %I.inventario(item_id) '
        'ON UPDATE CASCADE ON DELETE RESTRICT',
        schema_name,
        schema_name
    );

    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS ix_detalle_cotizacion_item_id '
        'ON %I.detalle_cotizacion(item_id)',
        schema_name
    );

    RAISE NOTICE 'FK e índice agregados sin modificar filas existentes.';
END
$migration$;

COMMIT;
