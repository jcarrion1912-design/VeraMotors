from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cliente import Cliente
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.factura import Factura
from app.schemas.cuenta_por_cobrar import CuentaPorCobrarResponse

router = APIRouter()


def _serializar_cuenta(cuenta: CuentaPorCobrar, factura: Factura, cliente: Cliente) -> dict:
    estado = "Anulada" if factura.estado_pago == "Anulado" else cuenta.estado
    return {
        "cuenta_cobrar_id": cuenta.cuenta_cobrar_id,
        "factura_id": factura.factura_id,
        "numero_comprobante": factura.numero_comprobante,
        "tipo_comprobante": factura.tipo_comprobante,
        "cliente_id": cliente.cliente_id,
        "cliente_nombre": cliente.nombre_razon_social,
        "fecha_emision": cuenta.fecha_emision,
        "fecha_vencimiento": cuenta.fecha_vencimiento,
        "monto_total": cuenta.monto_total,
        "monto_pagado": cuenta.monto_pagado,
        "saldo": cuenta.saldo,
        "estado": estado,
        "estado_pago_factura": factura.estado_pago,
        "metodo_pago": factura.metodo_pago,
    }


def _query_cuentas(db: Session):
    return (
        db.query(CuentaPorCobrar, Factura, Cliente)
        .join(Factura, Factura.factura_id == CuentaPorCobrar.factura_id)
        .join(Cliente, Cliente.cliente_id == CuentaPorCobrar.cliente_id)
    )


@router.get("", response_model=list[CuentaPorCobrarResponse])
def listar_cuentas_por_cobrar(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _query_cuentas(db)
    if estado and estado != "Todos":
        if estado == "Anulada":
            query = query.filter(Factura.estado_pago == "Anulado")
        else:
            query = query.filter(CuentaPorCobrar.estado == estado, Factura.estado_pago != "Anulado")
    rows = query.order_by(CuentaPorCobrar.fecha_emision.desc(), CuentaPorCobrar.cuenta_cobrar_id.desc()).all()
    return [_serializar_cuenta(*row) for row in rows]


@router.get("/factura/{factura_id}", response_model=CuentaPorCobrarResponse)
def obtener_cuenta_por_factura(factura_id: int, db: Session = Depends(get_db)):
    row = _query_cuentas(db).filter(CuentaPorCobrar.factura_id == factura_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="La factura no tiene una cuenta por cobrar registrada.")
    return _serializar_cuenta(*row)


@router.get("/{cuenta_cobrar_id}", response_model=CuentaPorCobrarResponse)
def obtener_cuenta_por_cobrar(cuenta_cobrar_id: int, db: Session = Depends(get_db)):
    row = _query_cuentas(db).filter(CuentaPorCobrar.cuenta_cobrar_id == cuenta_cobrar_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Cuenta por cobrar no encontrada.")
    return _serializar_cuenta(*row)
