from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.inventario import Inventario
from app.models.proveedor import Proveedor
from app.models.usuario import Usuario


def main():
    connection = engine.connect()
    transaction = connection.begin()
    testing_session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    def override_get_db():
        yield testing_session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        usuario = (
            testing_session.query(Usuario)
            .filter(Usuario.activo.is_(True))
            .order_by(Usuario.user_id)
            .first()
        )
        proveedor = (
            testing_session.query(Proveedor)
            .filter(Proveedor.activo.is_(True))
            .order_by(Proveedor.proveedor_id)
            .first()
        )
        correlativo = (
            testing_session.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento == "COMPRA",
                ConfiguracionCorrelativo.activo.is_(True),
            )
            .first()
        )
        item = (
            testing_session.query(Inventario)
            .filter(
                Inventario.activo.is_(True),
                Inventario.tipo != "Servicio",
            )
            .order_by(Inventario.item_id)
            .first()
        )
        assert usuario, "No hay usuarios activos para probar el movimiento."
        assert proveedor, "No hay proveedores activos para probar una orden de compra."
        assert correlativo, "No hay correlativo COMPRA activo para probar una orden de compra."
        assert item, "No hay productos activos para probar movimientos de inventario."

        stock_inicial = Decimal(str(item.stock_actual))
        cantidad_ordenada = Decimal("3.75")
        orden = client.post(
            "/api/compras",
            json={
                "proveedor_id": proveedor.proveedor_id,
                "usuario_id": usuario.user_id,
                "estado": "Registrada",
                "detalles": [
                    {
                        "item_id": item.item_id,
                        "cantidad": str(cantidad_ordenada),
                        "precio_unitario": "10",
                        "descuento": "1",
                        "impuesto": "2",
                    }
                ],
            },
        )
        assert orden.status_code == 201, f"No se registró la ODC: {orden.status_code} {orden.text}"
        compra = orden.json()
        assert compra["detalles"][0]["item_id"] == item.item_id
        assert Decimal(compra["detalles"][0]["cantidad"]) == cantidad_ordenada

        def crear_y_confirmar_recepcion(cantidad):
            borrador = client.post(
                "/api/recepciones",
                json={
                    "compra_id": compra["compra_id"],
                    "proveedor_id": proveedor.proveedor_id,
                    "usuario_id": usuario.user_id,
                    "observaciones": "Prueba transaccional de recepción",
                    "confirmar": False,
                    "detalles": [
                        {
                            "item_id": item.item_id,
                            "descripcion": item.nombre_nomenclatura,
                            "cantidad_ordenada": str(cantidad_ordenada),
                            "cantidad_recibida": str(cantidad),
                            "cantidad_pendiente": "0",
                            "precio_unitario": "10",
                            "total": str(cantidad * Decimal("10")),
                        }
                    ],
                },
            )
            assert borrador.status_code == 201, f"No se creó el borrador: {borrador.status_code} {borrador.text}"
            return client.post(
                "/api/recepciones",
                json={
                    "recepcion_id": borrador.json()["recepcion_id"],
                    "usuario_id": usuario.user_id,
                    "confirmar": True,
                },
            )

        cantidad_parcial = Decimal("1.25")
        entrada_parcial = crear_y_confirmar_recepcion(cantidad_parcial)
        assert entrada_parcial.status_code == 201, f"No se confirmó la recepción parcial: {entrada_parcial.status_code} {entrada_parcial.text}"
        recepcion_id = entrada_parcial.json()["recepcion_id"]
        assert Decimal(entrada_parcial.json()["detalles"][0]["cantidad_pendiente"]) == cantidad_ordenada - cantidad_parcial
        stock_tras_entrada = connection.execute(
            text("SELECT stock_actual FROM inventario WHERE item_id = :item_id"),
            {"item_id": item.item_id},
        ).scalar_one()
        assert Decimal(str(stock_tras_entrada)) == stock_inicial + cantidad_parcial

        movimiento_entrada = connection.execute(
            text("""
                SELECT tipo_movimiento, cantidad, stock_anterior, stock_nuevo
                  FROM movimientos_inventario
                 WHERE referencia = :referencia
            """),
            {"referencia": f"Recepcion-{recepcion_id}"},
        ).one()
        assert movimiento_entrada.tipo_movimiento == "Entrada"
        assert Decimal(str(movimiento_entrada.cantidad)) == cantidad_parcial
        assert Decimal(str(movimiento_entrada.stock_anterior)) == stock_inicial
        assert Decimal(str(movimiento_entrada.stock_nuevo)) == stock_inicial + cantidad_parcial
        reintento_confirmacion = client.post(
            "/api/recepciones",
            json={
                "recepcion_id": recepcion_id,
                "usuario_id": usuario.user_id,
                "confirmar": True,
            },
        )
        assert reintento_confirmacion.status_code == 201
        movimientos_recepcion_reintentada = connection.execute(
            text("SELECT count(*) FROM movimientos_inventario WHERE referencia = :referencia"),
            {"referencia": f"Recepcion-{recepcion_id}"},
        ).scalar_one()
        assert movimientos_recepcion_reintentada == 1

        cantidad_saldo = cantidad_ordenada - cantidad_parcial
        exceso = client.post(
            "/api/recepciones",
            json={
                "compra_id": compra["compra_id"],
                "proveedor_id": proveedor.proveedor_id,
                "usuario_id": usuario.user_id,
                "confirmar": False,
                "detalles": [
                    {
                        "item_id": item.item_id,
                        "descripcion": item.nombre_nomenclatura,
                        "cantidad_recibida": str(cantidad_saldo + Decimal("0.01")),
                    }
                ],
            },
        )
        assert exceso.status_code == 409, "Se permitió recibir más de la cantidad pendiente."
        entrada_saldo = crear_y_confirmar_recepcion(cantidad_saldo)
        assert entrada_saldo.status_code == 201, f"No se recibió el saldo: {entrada_saldo.status_code} {entrada_saldo.text}"
        detalle_parcial_actualizado = client.get(
            f"/api/recepciones/{recepcion_id}"
        ).json()["detalles"][0]
        assert Decimal(detalle_parcial_actualizado["cantidad_pendiente"]) == Decimal("0")
        assert Decimal(entrada_saldo.json()["detalles"][0]["cantidad_pendiente"]) == Decimal("0")
        stock_tras_saldo = connection.execute(
            text("SELECT stock_actual FROM inventario WHERE item_id = :item_id"),
            {"item_id": item.item_id},
        ).scalar_one()
        assert Decimal(str(stock_tras_saldo)) == stock_inicial + cantidad_ordenada

        movimiento_saldo = connection.execute(
            text("""
                SELECT tipo_movimiento, cantidad, stock_anterior, stock_nuevo
                  FROM movimientos_inventario
                 WHERE referencia = :referencia
            """),
            {"referencia": f"Recepcion-{entrada_saldo.json()['recepcion_id']}"},
        ).one()
        assert movimiento_saldo.tipo_movimiento == "Entrada"
        assert Decimal(str(movimiento_saldo.cantidad)) == cantidad_saldo
        assert Decimal(str(movimiento_saldo.stock_anterior)) == stock_inicial + cantidad_parcial
        assert Decimal(str(movimiento_saldo.stock_nuevo)) == stock_inicial + cantidad_ordenada

        referencia_salida = f"test-salida-{uuid4()}"
        payload_salida = {
            "usuario_id": usuario.user_id,
            "referencia": referencia_salida,
            "observaciones": "Prueba transaccional de salida",
            "detalles": [
                {"item_id": item.item_id, "cantidad": "1.25"},
            ],
        }
        salida = client.post(
            "/api/inventario/salidas",
            json=payload_salida,
        )
        assert salida.status_code == 201, f"No se registró la salida: {salida.status_code} {salida.text}"

        stock_esperado = stock_inicial + cantidad_ordenada - Decimal("1.25")
        stock_tras_salida = connection.execute(
            text("SELECT stock_actual FROM inventario WHERE item_id = :item_id"),
            {"item_id": item.item_id},
        ).scalar_one()
        assert Decimal(str(stock_tras_salida)) == stock_esperado

        movimiento_salida = connection.execute(
            text("""
                SELECT tipo_movimiento, cantidad, stock_anterior, stock_nuevo
                  FROM movimientos_inventario
                 WHERE referencia = :referencia
            """),
            {"referencia": referencia_salida},
        ).one()
        assert movimiento_salida.tipo_movimiento == "Salida"
        assert Decimal(str(movimiento_salida.cantidad)) == Decimal("1.25")
        assert Decimal(str(movimiento_salida.stock_anterior)) == stock_inicial + cantidad_ordenada
        assert Decimal(str(movimiento_salida.stock_nuevo)) == stock_esperado
        movimientos_salida = connection.execute(
            text("""
                SELECT count(*)
                  FROM movimientos_inventario
                 WHERE tipo_movimiento = 'Salida' AND referencia = :referencia
            """),
            {"referencia": referencia_salida},
        ).scalar_one()
        assert movimientos_salida == 1

        repetida = client.post(
            "/api/inventario/salidas",
            json=payload_salida,
        )
        assert repetida.status_code == 409, "Se permitió repetir una salida con la misma referencia."
        stock_tras_repeticion = connection.execute(
            text("SELECT stock_actual FROM inventario WHERE item_id = :item_id"),
            {"item_id": item.item_id},
        ).scalar_one()
        assert Decimal(str(stock_tras_repeticion)) == stock_esperado
        movimientos_tras_repeticion = connection.execute(
            text("""
                SELECT count(*)
                  FROM movimientos_inventario
                 WHERE tipo_movimiento = 'Salida' AND referencia = :referencia
            """),
            {"referencia": referencia_salida},
        ).scalar_one()
        assert movimientos_tras_repeticion == 1

        referencia_sin_stock = f"sin-stock-{uuid4()}"
        salida_sin_stock = client.post(
            "/api/inventario/salidas",
            json={
                **payload_salida,
                "referencia": referencia_sin_stock,
                "detalles": [
                    {"item_id": item.item_id, "cantidad": str(stock_esperado + 1)},
                ],
            },
        )
        assert salida_sin_stock.status_code == 409, "Se permitió una salida sin stock suficiente."
        stock_tras_error = connection.execute(
            text("SELECT stock_actual FROM inventario WHERE item_id = :item_id"),
            {"item_id": item.item_id},
        ).scalar_one()
        assert Decimal(str(stock_tras_error)) == stock_esperado
        movimientos_sin_stock = connection.execute(
            text("""
                SELECT count(*)
                  FROM movimientos_inventario
                 WHERE tipo_movimiento = 'Salida' AND referencia = :referencia
            """),
            {"referencia": referencia_sin_stock},
        ).scalar_one()
        assert movimientos_sin_stock == 0

        print("OK: ODC, recepción parcial y saldo, idempotencia, entrada, salida, historial y rollback verificados.")
    finally:
        app.dependency_overrides.pop(get_db, None)
        testing_session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()


if __name__ == "__main__":
    main()
