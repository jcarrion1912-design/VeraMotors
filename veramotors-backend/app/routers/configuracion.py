from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.security import solo_admin
from app.database import get_db
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.configuracion_empresa import ConfiguracionEmpresa
from app.schemas.configuracion_correlativo import (
    ConfiguracionCorrelativoResponse,
    ConfiguracionCorrelativoUpdate
)
from app.schemas.configuracion_empresa import (
    ConfiguracionEmpresaResponse,
    ConfiguracionEmpresaUpdate
)


router = APIRouter()

MENSAJE_MIGRACION_EMPRESA = (
    "Falta preparar la tabla de parámetros del taller. "
    "Ejecuta migracion_fase6_compras_empresa.py en el backend."
)


# ============================================================
# PARÁMETROS DEL TALLER
# GET / PUT /api/configuracion/empresa
# ============================================================

@router.get("/empresa", response_model=Optional[ConfiguracionEmpresaResponse])
def obtener_empresa(
    db: Session = Depends(get_db)
):
    try:
        return db.query(ConfiguracionEmpresa).first()
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=503, detail=MENSAJE_MIGRACION_EMPRESA)


@router.put("/empresa", response_model=ConfiguracionEmpresaResponse, dependencies=[Depends(solo_admin)])
def guardar_empresa(
    datos: ConfiguracionEmpresaUpdate,
    db: Session = Depends(get_db)
):
    try:
        empresa = db.query(ConfiguracionEmpresa).first()
        if empresa:
            for campo, valor in datos.model_dump().items():
                setattr(empresa, campo, valor)
        else:
            empresa = ConfiguracionEmpresa(**datos.model_dump())
            db.add(empresa)

        db.commit()
        db.refresh(empresa)
        return empresa
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=503, detail=MENSAJE_MIGRACION_EMPRESA)


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
    response_model=ConfiguracionCorrelativoResponse,
    dependencies=[Depends(solo_admin)]
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