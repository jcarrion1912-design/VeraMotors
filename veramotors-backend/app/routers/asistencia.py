from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from datetime import datetime, time
from typing import List

from app.database import get_db
from app.models.asistencia import Asistencia
from app.models.usuario import Usuario

from app.schemas.asistencia import (
    MarcadoEntrada,
    MarcadoSalida,
    ActualizarAsistencia,
    AsistenciaResponse,
    AsistenciaReporteResponse
)


router = APIRouter()


HORA_LIMITE_PUNTUAL = time(8, 15, 0)


# ==========================================================
# MARCAR ENTRADA
# ==========================================================

@router.post(
    "/marcar-entrada",
    response_model=AsistenciaResponse,
    status_code=status.HTTP_201_CREATED
)
def marcar_entrada(
    datos: MarcadoEntrada,
    db: Session = Depends(get_db)
):

    fecha_seleccionada = datos.fecha

    registro_existente = (
        db.query(Asistencia)
        .filter(
            Asistencia.user_id == datos.user_id,
            Asistencia.fecha == fecha_seleccionada
        )
        .first()
    )

    if registro_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya registró su entrada para la fecha seleccionada."
        )

    ahora = datetime.now()

    hora_entrada = datetime.combine(
        fecha_seleccionada,
        ahora.time()
    )

    estado_marcado = (
        "Puntual"
        if ahora.time() <= HORA_LIMITE_PUNTUAL
        else "Tardanza"
    )

    nueva_asistencia = Asistencia(
        user_id=datos.user_id,
        fecha=fecha_seleccionada,
        hora_entrada=hora_entrada,
        estado=estado_marcado,
        observaciones=datos.observaciones
    )

    db.add(nueva_asistencia)
    db.commit()
    db.refresh(nueva_asistencia)

    return nueva_asistencia


# ==========================================================
# MARCAR SALIDA
# ==========================================================

@router.put(
    "/marcar-salida",
    response_model=AsistenciaResponse
)
def marcar_salida(
    datos: MarcadoSalida,
    db: Session = Depends(get_db)
):

    registro = (
        db.query(Asistencia)
        .filter(
            Asistencia.asistencia_id == datos.asistencia_id
        )
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de asistencia no encontrado."
        )

    if registro.hora_salida is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La salida ya ha sido marcada anteriormente."
        )

    ahora = datetime.now()

    registro.hora_salida = datetime.combine(
        registro.fecha,
        ahora.time()
    )

    db.commit()
    db.refresh(registro)

    return registro


# ==========================================================
# ACTUALIZAR ASISTENCIA
# ==========================================================

@router.put(
    "/{asistencia_id}",
    response_model=AsistenciaResponse
)
def actualizar_asistencia(
    asistencia_id: int,
    datos: ActualizarAsistencia,
    db: Session = Depends(get_db)
):

    registro = (
        db.query(Asistencia)
        .filter(
            Asistencia.asistencia_id == asistencia_id
        )
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de asistencia no encontrado."
        )

    # ------------------------------------------------------
    # HORA DE ENTRADA
    # ------------------------------------------------------

    if datos.hora_entrada is not None:

        nueva_entrada = datetime.combine(
            registro.fecha,
            datos.hora_entrada
        )

        if (
            registro.hora_salida is not None
            and nueva_entrada >= registro.hora_salida
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La hora de entrada debe ser anterior a la hora de salida."
            )

        registro.hora_entrada = nueva_entrada

    # ------------------------------------------------------
    # HORA DE SALIDA
    # ------------------------------------------------------

    if datos.hora_salida is not None:

        nueva_salida = datetime.combine(
            registro.fecha,
            datos.hora_salida
        )

        if nueva_salida <= registro.hora_entrada:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La hora de salida debe ser posterior a la hora de entrada."
            )

        registro.hora_salida = nueva_salida

    # ------------------------------------------------------
    # ESTADO
    # ------------------------------------------------------

    if datos.estado is not None:

        estados_validos = [
            "Puntual",
            "Tardanza",
            "Falta Justificada",
            "Inasistencia"
        ]

        if datos.estado not in estados_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Estado inválido. Estados permitidos: "
                    + ", ".join(estados_validos)
                )
            )

        registro.estado = datos.estado

    # ------------------------------------------------------
    # OBSERVACIONES
    # ------------------------------------------------------

    if datos.observaciones is not None:
        registro.observaciones = datos.observaciones

    db.commit()
    db.refresh(registro)

    return registro


# ==========================================================
# REPORTE
# ==========================================================

@router.get(
    "/reporte",
    response_model=List[AsistenciaReporteResponse]
)
def listar_asistencias(
    db: Session = Depends(get_db)
):

    try:

        resultados = (
            db.query(Asistencia, Usuario)
            .join(
                Usuario,
                Asistencia.user_id == Usuario.user_id
            )
            .order_by(
                Asistencia.fecha.desc(),
                Asistencia.hora_entrada.desc()
            )
            .all()
        )

        return [
            {
                "asistencia_id": asistencia.asistencia_id,
                "user_id": asistencia.user_id,
                "nombre_usuario": usuario.nombre,
                "rol_usuario": usuario.rol.nombre if (hasattr(usuario, "rol") and usuario.rol) else "Usuario",
                "fecha": asistencia.fecha,
                "hora_entrada": asistencia.hora_entrada,
                "hora_salida": asistencia.hora_salida,
                "estado": asistencia.estado,
                "observaciones": asistencia.observaciones
            }
            for asistencia, usuario in resultados
        ]

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en consulta ORM: {str(e)}"
        )