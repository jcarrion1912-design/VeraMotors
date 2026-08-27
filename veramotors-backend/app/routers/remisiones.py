from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.remision import Remision
from app.models.detalle_remision import DetalleRemision
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.schemas.remision import (
    RemisionCreate,
    RemisionResponse
)


router = APIRouter()


# ============================================================
# LISTAR REMISIONES
#
# GET /api/remisiones
# ============================================================

@router.get(
    "",
    response_model=list[RemisionResponse]
)
def listar_remisiones(
    db: Session = Depends(get_db)
):

    remisiones = (
        db.query(Remision)
        .order_by(
            Remision.remision_id.desc()
        )
        .all()
    )

    return remisiones


# ============================================================
# OBTENER REMISIÓN
#
# GET /api/remisiones/{remision_id}
# ============================================================

@router.get(
    "/{remision_id}",
    response_model=RemisionResponse
)
def obtener_remision(
    remision_id: int,
    db: Session = Depends(get_db)
):

    remision = (
        db.query(Remision)
        .filter(
            Remision.remision_id == remision_id
        )
        .first()
    )

    if not remision:

        raise HTTPException(
            status_code=404,
            detail="Remisión no encontrada."
        )

    return remision


# ============================================================
# CREAR REMISIÓN
#
# POST /api/remisiones
# ============================================================

@router.post(
    "",
    response_model=RemisionResponse,
    status_code=201
)
def crear_remision(
    datos: RemisionCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # BUSCAR CORRELATIVO
        # ====================================================

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento
                == "REMISION",

                ConfiguracionCorrelativo.activo
                == True
            )
            .with_for_update()
            .first()
        )

        if not configuracion:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No existe una configuración activa "
                    "para REMISION."
                )
            )

        serie = configuracion.prefijo

        correlativo = (
            configuracion.siguiente_correlativo
        )

        numero_remision = (
            f"{serie}-{correlativo:06d}"
        )

        # ====================================================
        # CREAR REMISIÓN
        # ====================================================

        remision = Remision(

            cliente_id=datos.cliente_id,

            vehiculo_id=datos.vehiculo_id,

            ods_id=datos.ods_id,

            tipo_remision=datos.tipo_remision,

            serie=serie,

            correlativo=correlativo,

            numero_remision=numero_remision,

            motivo_traslado=datos.motivo_traslado,

            punto_partida=datos.punto_partida,

            punto_llegada=datos.punto_llegada,

            estado="Pendiente",

            estado_sunat="Pendiente"
        )

        db.add(remision)

        db.flush()

        # ====================================================
        # DETALLES
        # ====================================================

        for detalle in datos.detalles:

            detalle_db = DetalleRemision(

                remision_id=remision.remision_id,

                item_id=detalle.item_id,

                descripcion=detalle.descripcion,

                cantidad=detalle.cantidad
            )

            db.add(detalle_db)

        # ====================================================
        # INCREMENTAR CORRELATIVO
        # ====================================================

        configuracion.siguiente_correlativo = (
            correlativo + 1
        )

        # ====================================================
        # GUARDAR
        # ====================================================

        db.commit()

        db.refresh(remision)

        return remision

    except HTTPException:

        db.rollback()

        raise

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "No se pudo registrar la remisión. "
                "Verifica los datos enviados."
            )
        )

    except Exception as error:

        db.rollback()

        print(
            "ERROR CREANDO REMISIÓN:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Ocurrió un error al registrar "
                "la remisión."
            )
        )