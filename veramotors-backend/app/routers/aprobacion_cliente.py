from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, crear_token_aprobacion, leer_token_aprobacion
from app.database import get_db
from app.models.cotizacion import Cotizacion
from app.models.ods import OrdenServicio
from app.schemas.aprobacion_cliente import (
    DecisionAprobacion,
    EnlaceAprobacionResponse,
    ResumenAprobacion,
)

router = APIRouter()


def _ods_del_token(token: str, db: Session) -> OrdenServicio:
    ods = (
        db.query(OrdenServicio)
        .filter(OrdenServicio.ods_id == leer_token_aprobacion(token))
        .first()
    )
    if not ods:
        raise HTTPException(status_code=404, detail="La orden de servicio ya no existe.")
    return ods


def _resumen(ods: OrdenServicio, db: Session) -> dict:
    cotizacion = None
    if ods.cotizacion_id:
        cotizacion = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == ods.cotizacion_id).first()

    vehiculo = ods.vehiculo
    motivo = ((ods.inspeccion_json or {}).get("motivo_servicio") or {}).get("motivo_detallado")

    return {
        "codigo_ods": ods.codigo_ods,
        "cliente_nombre": ods.cliente.nombre_razon_social if ods.cliente else None,
        "vehiculo": f"{vehiculo.marca} {vehiculo.modelo}" if vehiculo else None,
        "placa": vehiculo.placa if vehiculo else None,
        "procedimiento": ods.tipo_procedimiento,
        "motivo": motivo,
        "estado_aprobacion": ods.estado_aprobacion_cliente,
        "items": [
            {"descripcion": d.descripcion, "cantidad": d.cantidad, "total": d.total}
            for d in (cotizacion.detalles if cotizacion else [])
        ],
        "total": cotizacion.total if cotizacion else None,
    }


# Lo usa el asesor: requiere sesión.
@router.post("/enlace/{ods_id}", response_model=EnlaceAprobacionResponse, dependencies=[Depends(get_current_user)])
def generar_enlace(ods_id: int, db: Session = Depends(get_db)):
    if not db.query(OrdenServicio.ods_id).filter(OrdenServicio.ods_id == ods_id).first():
        raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")

    token, vence = crear_token_aprobacion(ods_id)
    return {"token": token, "vence": vence}


# Lo usa el cliente: sin sesión, el token firmado del enlace es la autorización.
@router.get("/{token}", response_model=ResumenAprobacion)
def ver_solicitud(token: str, db: Session = Depends(get_db)):
    return _resumen(_ods_del_token(token, db), db)


@router.post("/{token}", response_model=ResumenAprobacion)
def registrar_decision(token: str, datos: DecisionAprobacion, db: Session = Depends(get_db)):
    ods = _ods_del_token(token, db)

    if ods.estado_aprobacion_cliente != "Pendiente":
        raise HTTPException(
            status_code=409,
            detail=f"Esta orden ya fue respondida: {ods.estado_aprobacion_cliente}.",
        )

    ods.estado_aprobacion_cliente = datos.decision
    # Mismo efecto que cuando el asesor registra la aprobación.
    if datos.decision == "Aprobado" and ods.estado_actual in ("Recepción", "Pendiente"):
        ods.estado_actual = "Diagnóstico"

    db.commit()
    db.refresh(ods)
    return _resumen(ods, db)
