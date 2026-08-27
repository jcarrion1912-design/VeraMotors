from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.schemas.configuracion_correlativo import (
    ConfiguracionCorrelativoResponse,
    ConfiguracionCorrelativoUpdate
)


router = APIRouter()


# ============================================================
# LISTAR CONFIGURACIÓN DE CORRELATIVOS
# GET /api/configuracion/correlativos
# ============================================================

@router.get(
    "/correlativos",
    response_model=List[ConfiguracionCorrelativoResponse]
)
def listar_correlativos(
    db: Session = Depends(get_db)
):

    correlativos = (
        db.query(ConfiguracionCorrelativo)
        .order_by(
            ConfiguracionCorrelativo.correlativo_id.asc()
        )
        .all()
    )

    return correlativos


# ============================================================
# ACTUALIZAR CORRELATIVO
# PUT /api/configuracion/correlativos/{correlativo_id}
# ============================================================

@router.put(
    "/correlativos/{correlativo_id}",
    response_model=ConfiguracionCorrelativoResponse
)
def actualizar_correlativo(
    correlativo_id: int,
    datos: ConfiguracionCorrelativoUpdate,
    db: Session = Depends(get_db)
):

    correlativo = (
        db.query(ConfiguracionCorrelativo)
        .filter(
            ConfiguracionCorrelativo.correlativo_id
            == correlativo_id
        )
        .first()
    )

    if not correlativo:
        raise HTTPException(
            status_code=404,
            detail="Configuración de correlativo no encontrada."
        )

    correlativo.prefijo = datos.prefijo.strip()
    correlativo.siguiente_correlativo = datos.siguiente_correlativo
    correlativo.activo = datos.activo

    try:
        db.commit()
        db.refresh(correlativo)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el correlativo."
        )

    return correlativo