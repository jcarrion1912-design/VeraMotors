from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cierre_caja import CierreCaja
from app.models.pago import Pago
from app.models.usuario import Usuario
from app.schemas.cierre_caja import CajaAperturaCreate, CajaCierreCreate, CierreCajaResponse

router = APIRouter()


def _totales(db: Session, cierre_id: int) -> dict:
    total = func.coalesce(func.sum(Pago.monto), 0)
    campo = lambda metodo: func.coalesce(func.sum(case((Pago.metodo_pago == metodo, Pago.monto), else_=0)), 0)
    row = db.query(
        campo("Efectivo").label("efectivo"),
        campo("Yape").label("yape"),
        campo("Plin").label("plin"),
        campo("Tarjeta").label("tarjeta"),
        campo("Transferencia").label("transferencia"),
        campo("Otro").label("otros"),
        total.label("ventas"),
        func.count(Pago.pago_id).label("operaciones"),
    ).filter(Pago.cierre_caja_id == cierre_id).one()
    return {name: getattr(row, name) for name in row._fields}


def _serializar_cierre(db: Session, cierre: CierreCaja, en_caja: bool = False) -> dict:
    usuario = db.query(Usuario).filter(Usuario.user_id == cierre.usuario_id).first()
    usuario_cierre = db.query(Usuario).filter(Usuario.user_id == cierre.usuario_cierre_id).first() if cierre.usuario_cierre_id else None
    totales = _totales(db, cierre.cierre_caja_id) if en_caja else None
    efectivo = totales["efectivo"] if totales else cierre.total_efectivo
    total_ventas = totales["ventas"] if totales else cierre.total_ventas
    return {
        "cierre_caja_id": cierre.cierre_caja_id,
        "fecha_apertura": cierre.fecha_apertura,
        "fecha_cierre": None if cierre.estado == "Abierta" else cierre.fecha_cierre,
        "usuario_id": cierre.usuario_id,
        "usuario_cierre_id": cierre.usuario_cierre_id,
        "monto_inicial": cierre.monto_inicial,
        "total_efectivo": efectivo,
        "total_yape": totales["yape"] if totales else cierre.total_yape,
        "total_plin": totales["plin"] if totales else cierre.total_plin,
        "total_tarjeta": totales["tarjeta"] if totales else cierre.total_tarjeta,
        "total_transferencia": totales["transferencia"] if totales else cierre.total_transferencia,
        "total_otros": totales["otros"] if totales else cierre.total_otros,
        "cantidad_operaciones": totales["operaciones"] if totales else cierre.cantidad_operaciones,
        "total_ventas": total_ventas,
        "total_esperado": Decimal(str(cierre.monto_inicial)) + Decimal(str(efectivo)) if en_caja else cierre.total_esperado,
        "monto_real": cierre.monto_real,
        "diferencia": cierre.diferencia,
        "observaciones": cierre.observaciones,
        "estado": cierre.estado,
        "usuario_nombre": usuario.nombre if usuario else None,
        "usuario_cierre_nombre": usuario_cierre.nombre if usuario_cierre else None,
        "caja_abierta": cierre.estado == "Abierta",
    }


@router.get("", response_model=Optional[CierreCajaResponse])
def obtener_caja_actual(db: Session = Depends(get_db)):
    cierre = (
        db.query(CierreCaja)
        .filter(CierreCaja.estado == "Abierta")
        .order_by(CierreCaja.cierre_caja_id.desc())
        .first()
    )
    if cierre:
        return _serializar_cierre(db, cierre, en_caja=True)
    cierre = db.query(CierreCaja).order_by(CierreCaja.cierre_caja_id.desc()).first()
    return _serializar_cierre(db, cierre) if cierre else None


@router.post("/apertura", response_model=CierreCajaResponse, status_code=201)
def abrir_caja(datos: CajaAperturaCreate, db: Session = Depends(get_db)):
    try:
        usuario = db.query(Usuario).filter(Usuario.user_id == datos.usuario_id, Usuario.activo.is_(True)).first()
        if not usuario:
            raise HTTPException(status_code=400, detail="El usuario no existe o está inactivo.")
        abierta = db.query(CierreCaja.cierre_caja_id).filter(CierreCaja.estado == "Abierta").with_for_update().first()
        if abierta:
            raise HTTPException(status_code=409, detail="Ya existe una caja abierta.")

        ahora = datetime.now()
        cierre = CierreCaja(
            fecha_apertura=ahora,
            fecha_cierre=ahora,
            usuario_id=usuario.user_id,
            monto_inicial=datos.monto_inicial,
            total_efectivo=0,
            total_yape=0,
            total_plin=0,
            total_tarjeta=0,
            total_transferencia=0,
            total_otros=0,
            cantidad_operaciones=0,
            total_ventas=0,
            total_esperado=datos.monto_inicial,
            monto_real=0,
            diferencia=0,
            observaciones=datos.observaciones,
            estado="Abierta",
        )
        db.add(cierre)
        db.commit()
        db.refresh(cierre)
        return _serializar_cierre(db, cierre, en_caja=True)
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una caja abierta.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo abrir la caja.")


@router.post("/cierre", response_model=CierreCajaResponse)
def cerrar_caja(datos: CajaCierreCreate, db: Session = Depends(get_db)):
    try:
        cierre = (
            db.query(CierreCaja)
            .filter(CierreCaja.estado == "Abierta")
            .with_for_update(of=CierreCaja)
            .first()
        )
        if not cierre:
            raise HTTPException(status_code=409, detail="No existe una caja abierta para cerrar.")
        usuario = db.query(Usuario).filter(Usuario.user_id == datos.usuario_id, Usuario.activo.is_(True)).first()
        if not usuario:
            raise HTTPException(status_code=400, detail="El usuario de cierre no existe o está inactivo.")

        totales = _totales(db, cierre.cierre_caja_id)
        cierre.total_efectivo = totales["efectivo"]
        cierre.total_yape = totales["yape"]
        cierre.total_plin = totales["plin"]
        cierre.total_tarjeta = totales["tarjeta"]
        cierre.total_transferencia = totales["transferencia"]
        cierre.total_otros = totales["otros"]
        cierre.cantidad_operaciones = totales["operaciones"]
        cierre.total_ventas = totales["ventas"]
        cierre.total_esperado = Decimal(str(cierre.monto_inicial)) + Decimal(str(cierre.total_efectivo))
        cierre.monto_real = datos.monto_real
        cierre.diferencia = Decimal(str(datos.monto_real)) - Decimal(str(cierre.total_esperado))
        cierre.usuario_cierre_id = usuario.user_id
        cierre.fecha_cierre = datetime.now()
        cierre.estado = "Cerrada"
        if datos.observaciones:
            cierre.observaciones = datos.observaciones

        db.commit()
        db.refresh(cierre)
        return _serializar_cierre(db, cierre)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo cerrar la caja; la operación fue revertida.")
