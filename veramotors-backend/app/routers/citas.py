from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cita import Cita
from app.schemas.cita import (
    CitaCreate,
    CitaResponse
)


router = APIRouter()


def convertir_cita(cita):

    return {
        "cita_id": cita.cita_id,
        "cliente_id": cita.cliente_id,
        "vehiculo_id": cita.vehiculo_id,
        "fecha_hora_inicio": cita.fecha_hora_inicio,
        "fecha_hora_fin": cita.fecha_hora_fin,
        "estado": cita.estado,
        "observaciones": cita.observaciones,
        "cliente_nombre": (
            cita.cliente.nombre_razon_social
            if cita.cliente
            else None
        ),
        "vehiculo_placa": (
            cita.vehiculo.placa
            if cita.vehiculo
            else None
        )
    }


@router.get(
    "",
    response_model=List[CitaResponse]
)
def listar_citas(
    cliente_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Cita)

    if cliente_id:
        query = query.filter(
            Cita.cliente_id == cliente_id
        )

    if estado and estado != "Todos":
        query = query.filter(
            Cita.estado == estado
        )

    citas = query.order_by(
        Cita.fecha_hora_inicio.asc()
    ).all()

    return [
        convertir_cita(cita)
        for cita in citas
    ]


@router.get(
    "/{cita_id}",
    response_model=CitaResponse
)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db)
):

    cita = db.query(Cita).filter(
        Cita.cita_id == cita_id
    ).first()

    if not cita:
        raise HTTPException(
            status_code=404,
            detail="Cita no encontrada."
        )

    return convertir_cita(cita)


@router.post(
    "",
    response_model=CitaResponse,
    status_code=201
)
def crear_cita(
    datos: CitaCreate,
    db: Session = Depends(get_db)
):

    if datos.fecha_hora_fin <= datos.fecha_hora_inicio:

        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha de fin debe ser "
                "posterior a la fecha de inicio."
            )
        )

    cita = Cita(
        **datos.model_dump()
    )

    db.add(cita)
    db.commit()
    db.refresh(cita)

    return convertir_cita(cita)


@router.put(
    "/{cita_id}",
    response_model=CitaResponse
)
def actualizar_cita(
    cita_id: int,
    datos: CitaCreate,
    db: Session = Depends(get_db)
):

    cita = db.query(Cita).filter(
        Cita.cita_id == cita_id
    ).first()

    if not cita:

        raise HTTPException(
            status_code=404,
            detail="Cita no encontrada."
        )

    if datos.fecha_hora_fin <= datos.fecha_hora_inicio:

        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha de fin debe ser "
                "posterior a la fecha de inicio."
            )
        )

    for campo, valor in datos.model_dump().items():
        setattr(cita, campo, valor)

    db.commit()
    db.refresh(cita)

    return convertir_cita(cita)


@router.delete(
    "/{cita_id}",
    status_code=204
)
def eliminar_cita(
    cita_id: int,
    db: Session = Depends(get_db)
):

    cita = db.query(Cita).filter(
        Cita.cita_id == cita_id
    ).first()

    if not cita:

        raise HTTPException(
            status_code=404,
            detail="Cita no encontrada."
        )

    db.delete(cita)
    db.commit()

    return None