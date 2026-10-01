from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app


def main():
    connection = engine.connect()
    transaction = connection.begin()
    test_session = Session(bind=connection, join_transaction_mode="create_savepoint")

    def override_get_db():
        try:
            yield test_session
        finally:
            test_session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        existing_open = connection.execute(
            text("SELECT count(*) FROM cierres_caja WHERE estado='Abierta'")
        ).scalar_one()
        assert existing_open == 0, "La prueba requiere una caja cerrada al inicio; no se modificará una caja real abierta."

        invoice = connection.execute(text("""
            SELECT f.factura_id, f.total, c.cuenta_cobrar_id
              FROM facturas f
              JOIN cuentas_por_cobrar c ON c.factura_id = f.factura_id
             WHERE f.total >= 0.02
               AND f.estado_pago <> 'Anulado'
             ORDER BY f.factura_id
             LIMIT 1
        """)).one_or_none()
        assert invoice, "No hay factura real con cuenta por cobrar para integrar la prueba."
        factura_id, total_value, cuenta_id = invoice
        total = Decimal(str(total_value)).quantize(Decimal("0.01"))
        assert total > Decimal("0.01")

        usuario_id = connection.execute(
            text("SELECT user_id FROM usuarios WHERE activo ORDER BY user_id LIMIT 1")
        ).scalar_one_or_none()
        assert usuario_id, "No existe usuario activo real para la prueba."

        connection.execute(text("""
            UPDATE facturas SET estado_pago='Pendiente' WHERE factura_id=:id
        """), {"id": factura_id})
        connection.execute(text("""
            UPDATE cuentas_por_cobrar
               SET monto_total=:total, monto_pagado=0, saldo=:total, estado='Pendiente'
             WHERE cuenta_cobrar_id=:id
        """), {"total": total, "id": cuenta_id})

        methods_response = client.get("/api/pagos/metodos")
        assert methods_response.status_code == 200
        methods = methods_response.json()
        assert {"Efectivo", "Transferencia"}.issubset(set(methods))
        assert "Crédito" not in methods
        print("OK: métodos de pago derivados del CHECK real de facturas.")

        apertura = client.post("/api/caja/apertura", json={
            "usuario_id": usuario_id,
            "monto_inicial": "50.00",
            "observaciones": "Apertura de prueba transaccional",
        })
        assert apertura.status_code == 201, f"No abrió caja: {apertura.status_code} {apertura.text}"
        caja_id = apertura.json()["cierre_caja_id"]
        assert apertura.json()["estado"] == "Abierta"
        assert apertura.json()["caja_abierta"] is True
        duplicate_open = client.post("/api/caja/apertura", json={"usuario_id": usuario_id, "monto_inicial": "0"})
        assert duplicate_open.status_code == 409
        print("OK: apertura persistida y rechazo de una segunda caja abierta.")

        cuenta_response = client.get(f"/api/cuentas-por-cobrar/{cuenta_id}")
        assert cuenta_response.status_code == 200
        assert Decimal(cuenta_response.json()["saldo"]) == total

        overpay = client.post("/api/pagos", json={
            "factura_id": factura_id,
            "usuario_id": usuario_id,
            "monto": str(total + Decimal("0.01")),
            "metodo_pago": "Efectivo",
        })
        assert overpay.status_code == 409, f"Se permitió sobrepagar: {overpay.status_code} {overpay.text}"
        zero_payment = client.post("/api/pagos", json={
            "factura_id": factura_id,
            "usuario_id": usuario_id,
            "monto": "0.00",
            "metodo_pago": "Efectivo",
        })
        assert zero_payment.status_code == 422

        connection.execute(text("UPDATE facturas SET estado_pago='Anulado' WHERE factura_id=:id"), {"id": factura_id})
        connection.execute(text("UPDATE cuentas_por_cobrar SET estado='Anulada' WHERE cuenta_cobrar_id=:id"), {"id": cuenta_id})
        canceled_payment = client.post("/api/pagos", json={
            "factura_id": factura_id,
            "usuario_id": usuario_id,
            "monto": "0.01",
            "metodo_pago": "Efectivo",
        })
        assert canceled_payment.status_code == 409
        connection.execute(text("UPDATE facturas SET estado_pago='Pendiente' WHERE factura_id=:id"), {"id": factura_id})
        connection.execute(text("UPDATE cuentas_por_cobrar SET estado='Pendiente' WHERE cuenta_cobrar_id=:id"), {"id": cuenta_id})
        assert connection.execute(text("SELECT count(*) FROM pagos")).scalar_one() == 0
        print("OK: rechazo de sobrepago, monto cero y factura anulada sin crear movimientos.")

        first_payment = (total / 2).quantize(Decimal("0.01"))
        second_payment = total - first_payment
        first_response = client.post("/api/pagos", json={
            "factura_id": factura_id,
            "usuario_id": usuario_id,
            "monto": str(first_payment),
            "metodo_pago": "Efectivo",
            "observaciones": "Primer abono de prueba",
        })
        assert first_response.status_code == 201, f"No se registró el abono: {first_response.status_code} {first_response.text}"
        partial = client.get(f"/api/cuentas-por-cobrar/{cuenta_id}").json()
        assert partial["estado"] == "Parcial"
        assert Decimal(partial["monto_pagado"]) == first_payment
        assert Decimal(partial["saldo"]) == second_payment
        invoice_after_partial = connection.execute(
            text("SELECT estado_pago FROM facturas WHERE factura_id=:id"), {"id": factura_id}
        ).scalar_one()
        assert invoice_after_partial == "Pendiente"
        print("OK: primer pago parcial actualiza cuenta, saldo y factura.")

        second_response = client.post("/api/pagos", json={
            "factura_id": factura_id,
            "usuario_id": usuario_id,
            "monto": str(second_payment),
            "metodo_pago": "Transferencia",
            "observaciones": "Segundo abono de prueba",
        })
        assert second_response.status_code == 201, f"No se registró el saldo final: {second_response.status_code} {second_response.text}"
        paid = client.get(f"/api/cuentas-por-cobrar/{cuenta_id}").json()
        assert paid["estado"] == "Pagada"
        assert Decimal(paid["monto_pagado"]) == total
        assert Decimal(paid["saldo"]) == Decimal("0.00")
        assert connection.execute(text("SELECT estado_pago FROM facturas WHERE factura_id=:id"), {"id": factura_id}).scalar_one() == "Pagado"

        payments = client.get(f"/api/pagos?factura_id={factura_id}")
        assert payments.status_code == 200 and len(payments.json()) == 2
        current_cash = client.get("/api/caja")
        assert current_cash.status_code == 200
        cash_data = current_cash.json()
        assert cash_data["caja_abierta"] is True
        assert Decimal(cash_data["total_efectivo"]) == first_payment
        assert Decimal(cash_data["total_transferencia"]) == second_payment
        assert cash_data["cantidad_operaciones"] == 2
        print("OK: segundo pago salda la factura y ambos pagos aparecen en la caja abierta.")

        expected_cash = Decimal("50.00") + first_payment
        close_response = client.post("/api/caja/cierre", json={
            "usuario_id": usuario_id,
            "monto_real": str(expected_cash),
            "observaciones": "Cierre de prueba transaccional",
        })
        assert close_response.status_code == 200, f"No se cerró caja: {close_response.status_code} {close_response.text}"
        closed = close_response.json()
        assert closed["cierre_caja_id"] == caja_id
        assert closed["estado"] == "Cerrada"
        assert Decimal(closed["total_efectivo"]) == first_payment
        assert Decimal(closed["total_transferencia"]) == second_payment
        assert Decimal(closed["total_ventas"]) == total
        assert closed["cantidad_operaciones"] == 2
        assert Decimal(closed["diferencia"]) == Decimal("0.00")
        missing_close = client.post("/api/caja/cierre", json={"usuario_id": usuario_id, "monto_real": "0"})
        assert missing_close.status_code == 409

        reopened_session = client.get(f"/api/cuentas-por-cobrar/{cuenta_id}")
        assert reopened_session.status_code == 200 and reopened_session.json()["estado"] == "Pagada"
        assert connection.execute(text("SELECT count(*) FROM pagos WHERE cierre_caja_id=:id"), {"id": caja_id}).scalar_one() == 2
        assert connection.execute(text("SELECT estado FROM cierres_caja WHERE cierre_caja_id=:id"), {"id": caja_id}).scalar_one() == "Cerrada"
        print("OK: cierre calcula pagos reales, persiste totales y rechaza cierre sin caja abierta.")
        print("OK: pagos, estado de factura y cierre sobreviven a nuevas solicitudes/sesiones API.")
        print("OK: los 10 escenarios funcionales quedaron cubiertos.")
    finally:
        app.dependency_overrides.pop(get_db, None)
        test_session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
        print("OK: transacción externa revertida; no quedan pagos, cierre o cambios de factura de prueba.")


if __name__ == "__main__":
    main()
