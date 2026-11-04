import re
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.cierre_caja import CierreCaja
from app.models.cliente import Cliente
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.factura import Factura
from app.models.pago import Pago
from app.models.usuario import Usuario
from app.schemas.pago import PagoCreate, PagoResponse

router = APIRouter()


def _metodos_permitidos(db: Session) -> list[str]:
    definition = db.execute(text("""
        SELECT pg_get_constraintdef(oid)
          FROM pg_constraint
         WHERE conrelid = 'facturas'::regclass
           AND conname = 'chk_factura_metodo_pago'
    """)).scalar_one_or_none()
    if not definition:
        raise HTTPException(status_code=500, detail="No se encontró el catálogo de métodos de pago de PostgreSQL.")
    return [method for method in re.findall(r"'([^']+)'", definition) if method != "Crédito"]


def _serializar_pago(pago: Pago, cuenta: CuentaPorCobrar, factura: Factura, cliente: Cliente) -> dict:
    return {
        "pago_id": pago.pago_id,
        "cuenta_cobrar_id": pago.cuenta_cobrar_id,
        "factura_id": factura.factura_id,
        "cierre_caja_id": pago.cierre_caja_id,
        "usuario_id": pago.usuario_id,
        "fecha": pago.fecha,
        "monto": pago.monto,
        "metodo_pago": pago.metodo_pago,
        "observaciones": pago.observaciones,
        "numero_comprobante": factura.numero_comprobante,
        "cliente_nombre": cliente.nombre_razon_social,
    }


def _query_pagos(db: Session):
    return (
        db.query(Pago, CuentaPorCobrar, Factura, Cliente)
        .join(CuentaPorCobrar, CuentaPorCobrar.cuenta_cobrar_id == Pago.cuenta_cobrar_id)
        .join(Factura, Factura.factura_id == CuentaPorCobrar.factura_id)
        .join(Cliente, Cliente.cliente_id == CuentaPorCobrar.cliente_id)
    )


@router.get("/metodos")
def listar_metodos_pago(db: Session = Depends(get_db)):
    return _metodos_permitidos(db)


@router.get("", response_model=list[PagoResponse])
def listar_pagos(
    factura_id: Optional[int] = None,
    cierre_caja_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = _query_pagos(db)
    if factura_id:
        query = query.filter(CuentaPorCobrar.factura_id == factura_id)
    if cierre_caja_id:
        query = query.filter(Pago.cierre_caja_id == cierre_caja_id)
    rows = query.order_by(Pago.fecha.desc(), Pago.pago_id.desc()).all()
    return [_serializar_pago(*row) for row in rows]


@router.post("", response_model=PagoResponse, status_code=201)
def registrar_pago(datos: PagoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    try:
        factura = (
            db.query(Factura)
            .filter(Factura.factura_id == datos.factura_id)
            .with_for_update(of=Factura)
            .first()
        )
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada.")
        if factura.estado_pago == "Anulado":
            raise HTTPException(status_code=409, detail="No se puede cobrar una factura anulada.")

        cuenta = (
            db.query(CuentaPorCobrar)
            .filter(CuentaPorCobrar.factura_id == factura.factura_id)
            .with_for_update(of=CuentaPorCobrar)
            .first()
        )
        if not cuenta:
            raise HTTPException(status_code=404, detail="La factura no tiene cuenta por cobrar.")
        if cuenta.estado == "Anulada" or cuenta.saldo <= 0:
            raise HTTPException(status_code=409, detail="La cuenta no tiene saldo cobrable.")

        monto = Decimal(str(datos.monto))
        if monto <= 0 or monto != monto.quantize(Decimal("0.01")):
            raise HTTPException(status_code=400, detail="El monto debe ser positivo y tener como máximo dos decimales.")
        saldo = Decimal(str(cuenta.saldo))
        if monto > saldo:
            raise HTTPException(status_code=409, detail=f"El pago supera el saldo pendiente de {saldo:.2f}.")

        metodos = _metodos_permitidos(db)
        if datos.metodo_pago not in metodos:
            raise HTTPException(status_code=400, detail="Método de pago no permitido por la configuración de PostgreSQL.")

        usuario = db.query(Usuario).filter(Usuario.user_id == datos.usuario_id, Usuario.activo.is_(True)).first()
        if not usuario:
            raise HTTPException(status_code=400, detail="El usuario no existe o está inactivo.")

        cierre = (
            db.query(CierreCaja)
            .filter(CierreCaja.estado == "Abierta")
            .with_for_update(of=CierreCaja)
            .first()
        )
        if not cierre:
            raise HTTPException(status_code=409, detail="Debe existir una caja abierta antes de registrar pagos.")

        cuenta.monto_pagado = Decimal(str(cuenta.monto_pagado)) + monto
        cuenta.saldo = max(Decimal("0.00"), Decimal(str(cuenta.monto_total)) - cuenta.monto_pagado)
        if cuenta.saldo == 0:
            cuenta.estado = "Pagada"
            factura.estado_pago = "Pagado"
        else:
            cuenta.estado = "Parcial"
            factura.estado_pago = "Pendiente"

        pago = Pago(
            cuenta_cobrar_id=cuenta.cuenta_cobrar_id,
            cierre_caja_id=cierre.cierre_caja_id,
            usuario_id=usuario.user_id,
            monto=monto,
            metodo_pago=datos.metodo_pago,
            observaciones=datos.observaciones,
        )
        db.add(pago)
        db.flush()
        cliente = db.query(Cliente).filter(Cliente.cliente_id == cuenta.cliente_id).first()
        db.commit()
        db.refresh(pago)
        return _serializar_pago(pago, cuenta, factura, cliente)
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo registrar el pago por una restricción de datos.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo registrar el pago; la operación fue revertida.")
