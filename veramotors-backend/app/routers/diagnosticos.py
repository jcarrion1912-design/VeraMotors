from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.detalle_ods import DetalleODS
from app.models.diagnostico_tecnico import DiagnosticoTecnico
from app.models.inventario import Inventario
from app.models.ods import OrdenServicio
from app.schemas.diagnostico import DiagnosticoCreate, DiagnosticoResponse, DiagnosticosODSResponse

router = APIRouter()
CENTAVO = Decimal("0.01")


def _serializar_diagnostico(diagnostico: DiagnosticoTecnico) -> dict:
    return {
        "diagnostico_id": diagnostico.diagnostico_id,
        "ods_id": diagnostico.ods_id,
        "falla_reportada": diagnostico.falla_reportada,
        "comentarios_tecnico": diagnostico.comentarios_tecnico,
        "fotos_urls": diagnostico.fotos_urls,
        "tiempo_estimado_horas": diagnostico.tiempo_estimado_horas,
        "horas_hombre": diagnostico.horas_hombre,
        "fecha_diagnostico": diagnostico.fecha_diagnostico,
        "repuestos": [],
    }


def _obtener_diagnosticos_ods(db: Session, ods_id: int) -> dict:
    orden = db.query(OrdenServicio.ods_id).filter(OrdenServicio.ods_id == ods_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")

    diagnosticos = (
        db.query(DiagnosticoTecnico)
        .filter(DiagnosticoTecnico.ods_id == ods_id)
        .order_by(DiagnosticoTecnico.fecha_diagnostico.desc(), DiagnosticoTecnico.diagnostico_id.desc())
        .all()
    )
    detalles = (
        db.query(DetalleODS, Inventario)
        .join(Inventario, Inventario.item_id == DetalleODS.item_id)
        .filter(DetalleODS.ods_id == ods_id)
        .order_by(DetalleODS.detalle_id)
        .all()
    )
    return {
        "ods_id": ods_id,
        "diagnosticos": [_serializar_diagnostico(item) for item in diagnosticos],
        "repuestos": [
            {
                "item_id": detalle.item_id,
                "codigo_referencia": inventario.codigo_referencia,
                "nombre_nomenclatura": inventario.nombre_nomenclatura,
                "cantidad": detalle.cantidad,
            }
            for detalle, inventario in detalles
        ],
    }


@router.get("/ods/{ods_id}", response_model=DiagnosticosODSResponse)
def listar_diagnosticos_ods(ods_id: int, db: Session = Depends(get_db)):
    return _obtener_diagnosticos_ods(db, ods_id)


@router.post("/{ods_id}", response_model=DiagnosticoResponse, status_code=201)
def crear_diagnostico(ods_id: int, datos: DiagnosticoCreate, db: Session = Depends(get_db)):
    try:
        orden = db.query(OrdenServicio).filter(OrdenServicio.ods_id == ods_id).first()
        if not orden:
            raise HTTPException(status_code=404, detail="Orden de servicio no encontrada.")

        if not datos.falla_reportada.strip():
            raise HTTPException(status_code=400, detail="La falla reportada es obligatoria.")
        if len({linea.item_id for linea in datos.repuestos}) != len(datos.repuestos):
            raise HTTPException(status_code=400, detail="No repitas un repuesto en el mismo diagnóstico.")

        diagnostico = DiagnosticoTecnico(
            ods_id=ods_id,
            falla_reportada=datos.falla_reportada.strip(),
            comentarios_tecnico=datos.comentarios_tecnico,
            fotos_urls=datos.fotos_urls,
            tiempo_estimado_horas=datos.tiempo_estimado_horas,
            horas_hombre=datos.horas_hombre,
            fecha_diagnostico=datetime.now(),
        )
        db.add(diagnostico)

        for linea in datos.repuestos:
            item = db.query(Inventario).filter(
                Inventario.item_id == linea.item_id,
                Inventario.activo.is_(True),
            ).first()
            if not item:
                raise HTTPException(status_code=404, detail=f"Repuesto {linea.item_id} no existe o está inactivo.")

            cantidad = Decimal(str(linea.cantidad))
            precio = Decimal(str(item.precio_venta))
            subtotal = (cantidad * precio).quantize(CENTAVO, rounding=ROUND_HALF_UP)
            impuesto = (subtotal * Decimal(str(item.impuesto)) / Decimal("100")).quantize(CENTAVO, rounding=ROUND_HALF_UP)
            db.add(DetalleODS(
                ods_id=ods_id,
                item_id=item.item_id,
                cantidad=cantidad,
                precio_unitario=precio,
                impuesto=impuesto,
                total=subtotal + impuesto,
            ))

        orden.estado_actual = "Repuestos" if datos.repuestos else "Reparación"
        db.commit()
        db.refresh(diagnostico)
        return _serializar_diagnostico(diagnostico)
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo registrar el diagnóstico por una relación inválida.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo guardar el diagnóstico; la operación fue revertida.")
