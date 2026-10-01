from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from decimal import Decimal

from app.database import engine, get_db
from app.main import app
from app.models.detalle_factura import DetalleFactura
from app.models.factura import Factura
from app.models.remision import Remision
from app.models.usuario import Usuario


def obtener_factura(connection, con_producto=False):
    query = text("""
        SELECT f.factura_id
          FROM facturas f
          JOIN detalle_factura d ON d.factura_id = f.factura_id
          LEFT JOIN remisiones r ON r.factura_id = f.factura_id
         WHERE f.estado_pago = 'Pagado'
           AND upper(f.estado_sunat) NOT IN ('ANULADO', 'RECHAZADO')
           AND r.remision_id IS NULL
           AND d.item_id IS NULL
         ORDER BY f.factura_id
         LIMIT 1
    """)
    if con_producto:
        query = text("""
            SELECT f.factura_id
              FROM facturas f
              JOIN detalle_factura d ON d.factura_id = f.factura_id
              JOIN inventario i ON i.item_id = d.item_id
              LEFT JOIN remisiones r ON r.factura_id = f.factura_id
             WHERE f.estado_pago = 'Pagado'
               AND upper(f.estado_sunat) NOT IN ('ANULADO', 'RECHAZADO')
               AND r.remision_id IS NULL
               AND i.stock_actual < d.cantidad
             ORDER BY f.factura_id
             LIMIT 1
        """)
    return connection.execute(query).scalar_one_or_none()


def datos_guia(session, factura_id):
    factura = session.get(Factura, factura_id)
    return {
        "factura_id": factura_id,
        "motivo_traslado": "Prueba integración Fase 4",
        "punto_partida": "Almacén de prueba transaccional",
        "punto_llegada": "Destino de prueba transaccional",
        "detalles": [
            {
                "factura_detalle_id": detalle.detalle_factura_id,
                "cantidad": str(detalle.cantidad),
            }
            for detalle in session.query(DetalleFactura)
            .filter(DetalleFactura.factura_id == factura_id)
            .order_by(DetalleFactura.detalle_factura_id)
            .all()
        ],
    }


def main():
    connection = engine.connect()
    transaction = connection.begin()
    TestingSession = Session(bind=connection, join_transaction_mode="create_savepoint")

    def override_get_db():
        session = TestingSession
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        inspector = inspect(connection)
        expected_tables = {
            "remisiones", "detalle_remision", "facturas", "detalle_factura",
            "clientes", "vehiculos", "inventario", "movimientos_inventario",
        }
        existing_tables = set(inspector.get_table_names())
        missing = expected_tables - existing_tables
        assert not missing, f"Faltan tablas requeridas: {sorted(missing)}"

        assert {"factura_id", "usuario_despacho_id", "fecha_despacho"}.issubset(
            {column["name"] for column in inspector.get_columns("remisiones")}
        )
        assert "factura_detalle_id" in {
            column["name"] for column in inspector.get_columns("detalle_remision")
        }
        remision_fks = {
            (fk["referred_table"], tuple(fk["constrained_columns"]))
            for fk in inspector.get_foreign_keys("remisiones")
        }
        detalle_fks = {
            (fk["referred_table"], tuple(fk["constrained_columns"]))
            for fk in inspector.get_foreign_keys("detalle_remision")
        }
        assert ("facturas", ("factura_id",)) in remision_fks
        assert ("usuarios", ("usuario_despacho_id",)) in remision_fks
        assert ("detalle_factura", ("factura_detalle_id",)) in detalle_fks
        assert any(
            "factura_id" in index["column_names"] and index["unique"]
            for index in inspector.get_indexes("remisiones")
        ), "Falta índice único para impedir guías duplicadas por factura."
        print("OK: tablas, columnas e índice único verificados en PostgreSQL.")

        session = TestingSession
        usuario = session.query(Usuario).filter(Usuario.activo.is_(True)).order_by(Usuario.user_id).first()
        assert usuario, "No hay usuario activo real para probar despacho."
        usuario_id = usuario.user_id
        service_invoice_id = obtener_factura(connection)
        assert service_invoice_id, "No hay factura pagada elegible con línea no inventariable para el despacho de prueba."
        sales_response = client.get("/api/remisiones/ventas-disponibles")
        assert sales_response.status_code == 200
        assert any(item["factura_id"] == service_invoice_id for item in sales_response.json())

        invalid_sale_payload = datos_guia(session, service_invoice_id)
        invalid_sale_payload["detalles"][0]["cantidad"] = str(
            session.query(DetalleFactura)
            .filter(DetalleFactura.factura_id == service_invoice_id)
            .first().cantidad + 1
        )
        response = client.post("/api/remisiones", json=invalid_sale_payload)
        assert response.status_code == 400, f"La cantidad superior a la venta fue aceptada: {response.status_code} {response.text}"
        print("OK: la API rechaza cantidades mayores a las vendidas.")

        payload = datos_guia(session, service_invoice_id)
        response = client.post("/api/remisiones", json=payload)
        assert response.status_code == 201, f"No se creó guía: {response.status_code} {response.text}"
        created = response.json()
        remision_id = created["remision_id"]
        assert created["factura_id"] == service_invoice_id
        assert len(created["detalles"]) == len(payload["detalles"])

        detail_response = client.get(f"/api/remisiones/{remision_id}")
        related_response = client.get(f"/api/remisiones/{remision_id}/documentos")
        list_response = client.get("/api/remisiones")
        assert detail_response.status_code == 200 and detail_response.json()["numero_comprobante"]
        assert related_response.status_code == 200 and related_response.json()["venta"]["factura_id"] == service_invoice_id
        assert any(row["remision_id"] == remision_id for row in list_response.json())
        persisted = connection.execute(
            text("SELECT count(*) FROM remisiones WHERE remision_id = :id AND factura_id = :factura_id"),
            {"id": remision_id, "factura_id": service_invoice_id},
        ).scalar_one()
        assert persisted == 1, "La guía no quedó visible en PostgreSQL después del commit de endpoint."
        print("OK: inserción, listado, consulta y relaciones persistidas en PostgreSQL.")

        duplicate_response = client.post("/api/remisiones", json=payload)
        assert duplicate_response.status_code == 409, f"Se permitió una guía duplicada: {duplicate_response.status_code}"
        print("OK: la API evita duplicar la guía de una venta.")

        pending_state_response = client.patch(
            f"/api/remisiones/{remision_id}/estado", json={"estado": "Despachada"}
        )
        assert pending_state_response.status_code == 409, "Se permitió cambiar a despachada sin procesar el despacho."

        dispatch_response = client.post(
            f"/api/remisiones/{remision_id}/despacho", json={"usuario_id": usuario_id}
        )
        assert dispatch_response.status_code == 200, f"No se registró despacho: {dispatch_response.status_code} {dispatch_response.text}"
        dispatched = dispatch_response.json()
        assert dispatched["estado"] == "En tránsito" and dispatched["fecha_despacho"]
        assert dispatched["usuario_despacho_id"] == usuario_id
        state_response = client.patch(
            f"/api/remisiones/{remision_id}/estado", json={"estado": "Entregada"}
        )
        assert state_response.status_code == 200 and state_response.json()["estado"] == "Entregada"
        final_state = connection.execute(
            text("SELECT estado FROM remisiones WHERE remision_id = :id"), {"id": remision_id}
        ).scalar_one()
        assert final_state == "Entregada"
        print("OK: despacho y transición de estado actualizados y consultables en PostgreSQL.")

        product_invoice_id = obtener_factura(connection, con_producto=True)
        if product_invoice_id:
            product_payload = datos_guia(session, product_invoice_id)
            product_create = client.post("/api/remisiones", json=product_payload)
            assert product_create.status_code == 201, f"No se creó guía de prueba de stock: {product_create.status_code} {product_create.text}"
            stock_guide = product_create.json()
            item_id = stock_guide["detalles"][0]["item_id"]
            stock_before = connection.execute(
                text("SELECT stock_actual FROM inventario WHERE item_id = :id"), {"id": item_id}
            ).scalar_one()
            shipment_quantity = Decimal(str(stock_guide["detalles"][0]["cantidad"]))
            move_count_before = connection.execute(
                text("SELECT count(*) FROM movimientos_inventario WHERE referencia = :ref"),
                {"ref": stock_guide["numero_remision"]},
            ).scalar_one()
            failed_dispatch = client.post(
                f"/api/remisiones/{stock_guide['remision_id']}/despacho",
                json={"usuario_id": usuario_id},
            )
            assert failed_dispatch.status_code == 409, "Se despachó producto sin stock suficiente."
            guide_state = connection.execute(
                text("SELECT estado FROM remisiones WHERE remision_id = :id"),
                {"id": stock_guide["remision_id"]},
            ).scalar_one()
            stock_after = connection.execute(
                text("SELECT stock_actual FROM inventario WHERE item_id = :id"), {"id": item_id}
            ).scalar_one()
            move_count_after = connection.execute(
                text("SELECT count(*) FROM movimientos_inventario WHERE referencia = :ref"),
                {"ref": stock_guide["numero_remision"]},
            ).scalar_one()
            assert guide_state == "Pendiente" and stock_after == stock_before and move_count_after == move_count_before

            connection.execute(
                text("UPDATE inventario SET stock_actual = :stock WHERE item_id = :id"),
                {"stock": Decimal(str(stock_before)) + shipment_quantity, "id": item_id},
            )
            successful_dispatch = client.post(
                f"/api/remisiones/{stock_guide['remision_id']}/despacho",
                json={"usuario_id": usuario_id},
            )
            assert successful_dispatch.status_code == 200, f"No se despachó producto con stock suficiente: {successful_dispatch.status_code} {successful_dispatch.text}"
            movement = connection.execute(
                text("""
                    SELECT tipo_movimiento, cantidad, stock_anterior, stock_nuevo
                      FROM movimientos_inventario
                     WHERE referencia = :referencia
                """),
                {"referencia": stock_guide["numero_remision"]},
            ).one()
            stock_after_success = connection.execute(
                text("SELECT stock_actual FROM inventario WHERE item_id = :id"), {"id": item_id}
            ).scalar_one()
            assert movement.tipo_movimiento == "Salida"
            assert Decimal(str(movement.cantidad)) == shipment_quantity
            assert Decimal(str(movement.stock_nuevo)) == Decimal(str(stock_before))
            assert Decimal(str(stock_after_success)) == Decimal(str(stock_before))
            assert successful_dispatch.json()["estado"] == "En tránsito"
            print("OK: stock insuficiente revierte; con stock suficiente se descuenta y se persiste el movimiento.")
        else:
            print("AVISO: no hay venta con producto y stock insuficiente para probar el rollback de inventario.")

        print("OK: prueba de endpoints FastAPI completada contra PostgreSQL real.")
    finally:
        app.dependency_overrides.pop(get_db, None)
        if transaction.is_active:
            transaction.rollback()
        connection.close()
        print("OK: transacción de pruebas revertida; no quedan guías ni correlativos de prueba.")


if __name__ == "__main__":
    main()
