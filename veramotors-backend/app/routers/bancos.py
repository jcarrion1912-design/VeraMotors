from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func

from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.database import get_db
from app.models.cuenta_bancaria import CuentaBancaria
from app.models.movimiento_bancario import MovimientoBancario
from app.schemas.cuenta_bancaria import (
    CuentaBancariaCreate,
    CuentaBancariaResponse
)
from app.schemas.movimiento_bancario import (
    MovimientoBancarioCreate,
    MovimientoBancarioResponse
)

router = APIRouter()


# ===================== CUENTAS BANCARIAS =====================

@router.get("/cuentas", response_model=List[CuentaBancariaResponse])
def listar_cuentas(
    activo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CuentaBancaria)

    if activo is not None:
        query = query.filter(CuentaBancaria.activo == activo)

    cuentas = query.order_by(CuentaBancaria.cuenta_bancaria_id.asc()).all()
    return cuentas


@router.get("/cuentas/{cuenta_id}", response_model=CuentaBancariaResponse)
def obtener_cuenta(
    cuenta_id: int,
    db: Session = Depends(get_db)
):
    cuenta = db.query(CuentaBancaria).filter(
        CuentaBancaria.cuenta_bancaria_id == cuenta_id
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta bancaria no encontrada."
        )

    return cuenta


@router.post("/cuentas", response_model=CuentaBancariaResponse, status_code=201)
def crear_cuenta(
    datos: CuentaBancariaCreate,
    db: Session = Depends(get_db)
):
    cuenta = CuentaBancaria(**datos.model_dump())
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)
    return cuenta


@router.put("/cuentas/{cuenta_id}", response_model=CuentaBancariaResponse)
def actualizar_cuenta(
    cuenta_id: int,
    datos: CuentaBancariaCreate,
    db: Session = Depends(get_db)
):
    cuenta = db.query(CuentaBancaria).filter(
        CuentaBancaria.cuenta_bancaria_id == cuenta_id
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta bancaria no encontrada."
        )

    for key, value in datos.model_dump().items():
        setattr(cuenta, key, value)

    db.commit()
    db.refresh(cuenta)
    return cuenta


# ===================== MOVIMIENTOS BANCARIOS =====================

@router.get("/movimientos", response_model=List[MovimientoBancarioResponse])
def listar_movimientos(
    cuenta_id: Optional[int] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MovimientoBancario)

    if cuenta_id:
        query = query.filter(MovimientoBancario.cuenta_bancaria_id == cuenta_id)

    if tipo:
        query = query.filter(MovimientoBancario.tipo_movimiento == tipo)

    movimientos = query.order_by(MovimientoBancario.fecha.desc()).all()
    return movimientos


@router.get("/movimientos/{movimiento_id}", response_model=MovimientoBancarioResponse)
def obtener_movimiento(
    movimiento_id: int,
    db: Session = Depends(get_db)
):
    movimiento = db.query(MovimientoBancario).filter(
        MovimientoBancario.movimiento_bancario_id == movimiento_id
    ).first()

    if not movimiento:
        raise HTTPException(
            status_code=404,
            detail="Movimiento bancario no encontrado."
        )

    return movimiento


@router.post("/movimientos", response_model=MovimientoBancarioResponse, status_code=201)
def registrar_movimiento(
    datos: MovimientoBancarioCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    # El autor siempre es quien tiene la sesión, no lo que diga el cuerpo.
    datos.usuario_id = usuario_actual.user_id

    # Verificar que la cuenta existe
    cuenta = db.query(CuentaBancaria).filter(
        CuentaBancaria.cuenta_bancaria_id == datos.cuenta_bancaria_id
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta bancaria no encontrada."
        )

    # Crear movimiento
    movimiento = MovimientoBancario(**datos.model_dump())
    db.add(movimiento)

    # Actualizar saldo de la cuenta
    if datos.tipo_movimiento == "Ingreso":
        cuenta.saldo_actual += datos.monto
    elif datos.tipo_movimiento == "Egreso":
        if cuenta.saldo_actual < datos.monto:
            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente en la cuenta."
            )
        cuenta.saldo_actual -= datos.monto

    db.commit()
    db.refresh(movimiento)
    return movimiento


@router.put("/movimientos/{movimiento_id}", response_model=MovimientoBancarioResponse)
def actualizar_movimiento(
    movimiento_id: int,
    datos: MovimientoBancarioCreate,
    db: Session = Depends(get_db)
):
    movimiento = db.query(MovimientoBancario).filter(
        MovimientoBancario.movimiento_bancario_id == movimiento_id
    ).first()

    if not movimiento:
        raise HTTPException(
            status_code=404,
            detail="Movimiento bancario no encontrado."
        )

    for key, value in datos.model_dump(exclude={"usuario_id"}).items():
        setattr(movimiento, key, value)

    db.commit()
    db.refresh(movimiento)
    return movimiento
