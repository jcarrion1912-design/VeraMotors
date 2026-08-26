from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, time
from typing import List

from app.database import get_db
from app.models.asistencia import Asistencia
from app.schemas.asistencia import MarcadoEntrada, MarcadoSalida, AsistenciaResponse

router = APIRouter()

HORA_LIMITE_PUNTUAL = time(8, 15, 0)

@router.post("/marcar-entrada", response_model=AsistenciaResponse, status_code=status.HTTP_201_CREATED)
def marcar_entrada(datos: MarcadoEntrada, db: Session = Depends(get_db)):
    hoy = datetime.now().date()
    
    registro_existente = db.query(Asistencia).filter(
        Asistencia.user_id == datos.user_id,
        Asistencia.fecha == hoy
    ).first()
    
    if registro_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El usuario ya registró su entrada para el día de hoy."
        )

    ahora = datetime.now()
    estado_marcado = "Puntual" if ahora.time() <= HORA_LIMITE_PUNTUAL else "Tardanza"

    nueva_asistencia = Asistencia(
        user_id=datos.user_id,
        fecha=hoy,
        hora_entrada=ahora,
        estado=estado_marcado,
        observaciones=datos.observaciones
    )
    
    db.add(nueva_asistencia)
    db.commit()
    db.refresh(nueva_asistencia)
    return nueva_asistencia


@router.put("/marcar-salida", response_model=AsistenciaResponse)
def marcar_salida(datos: MarcadoSalida, db: Session = Depends(get_db)):
    registro = db.query(Asistencia).filter(Asistencia.asistencia_id == datos.asistencia_id).first()
    
    if not registro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de asistencia no encontrado.")
    
    if registro.hora_salida is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La salida ya ha sido marcada anteriormente.")

    registro.hora_salida = datetime.now()
    if datos.observaciones:
        registro.observaciones = f"{registro.observaciones or ''} | Salida: {datos.observaciones}".strip(" | ")

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/reporte", response_model=List[AsistenciaResponse])
def listar_asistencias(db: Session = Depends(get_db)):
    try:
        return db.query(Asistencia).order_by(Asistencia.fecha.desc(), Asistencia.hora_entrada.desc()).all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en consulta ORM: {str(e)}"
        )