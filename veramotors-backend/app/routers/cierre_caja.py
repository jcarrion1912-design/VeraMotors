from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.cierre_caja import CierreCaja

from app.schemas.cierre_caja import (
    CierreCajaCreate,
    CierreCajaResponse
)


router = APIRouter()


# ============================================================
# LISTAR CIERRES
#
# GET /api/cierre-caja
# ============================================================

@router.get(
    "",
    response_model=list[CierreCajaResponse]
)
def listar_cierres(
    db: Session = Depends(get_db)
):

    cierres = (
        db.query(CierreCaja)
        .order_by(
            CierreCaja.cierre_caja_id.desc()
        )
        .all()
    )

    return cierres


# ============================================================
# OBTENER CIERRE
#
# GET /api/cierre-caja/{cierre_id}
# ============================================================

@router.get(
    "/{cierre_id}",
    response_model=CierreCajaResponse
)
def obtener_cierre(
    cierre_id: int,
    db: Session = Depends(get_db)
):

    cierre = (
        db.query(CierreCaja)
        .filter(
            CierreCaja.cierre_caja_id == cierre_id
        )
        .first()
    )

    if not cierre:

        raise HTTPException(
            status_code=404,
            detail="Cierre de caja no encontrado."
        )

    return cierre


# ============================================================
# CREAR CIERRE
#
# POST /api/cierre-caja
# ============================================================

@router.post(
    "",
    response_model=CierreCajaResponse,
    status_code=201
)
def crear_cierre(
    datos: CierreCajaCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # CALCULAR DIFERENCIA
        # ====================================================

        diferencia = (
            datos.monto_real
            - datos.total_esperado
        )

        # ====================================================
        # CREAR CIERRE
        # ====================================================

        cierre = CierreCaja(

            fecha_apertura=datos.fecha_apertura,

            usuario_id=datos.usuario_id,

            monto_inicial=datos.monto_inicial,

            total_efectivo=datos.total_efectivo,

            total_yape=datos.total_yape,

            total_plin=datos.total_plin,

            total_tarjeta=datos.total_tarjeta,

            total_transferencia=(
                datos.total_transferencia
            ),

            total_ventas=datos.total_ventas,

            total_esperado=datos.total_esperado,

            monto_real=datos.monto_real,

            diferencia=diferencia,

            observaciones=datos.observaciones,

            estado="Cerrada"
        )

        db.add(cierre)

        db.commit()

        db.refresh(cierre)

        return cierre

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "No se pudo registrar el cierre "
                "de caja."
            )
        )

    except Exception as error:

        db.rollback()

        print(
            "ERROR CREANDO CIERRE DE CAJA:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Ocurrió un error al registrar "
                "el cierre de caja."
            )
        )