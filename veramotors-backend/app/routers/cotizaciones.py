from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.cotizacion import Cotizacion
from app.models.detalle_cotizacion import DetalleCotizacion
from app.models.configuracion_correlativo import ConfiguracionCorrelativo
from app.models.cliente import Cliente
from app.models.vehiculo import Vehiculo
from app.schemas.cotizacion import CotizacionCreate, CotizacionResponse

router = APIRouter()


@router.get("", response_model=List[CotizacionResponse])
def listar_cotizaciones(cliente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Cotizacion)
    if cliente_id:
        query = query.filter(Cotizacion.cliente_id == cliente_id)
    cotizaciones = query.order_by(Cotizacion.cotizacion_id.desc()).all()
    resultado = []
    for c in cotizaciones:
        c_dict = {
            "cotizacion_id": c.cotizacion_id,
            "codigo_cotizacion": c.codigo_cotizacion,
            "cliente_id": c.cliente_id,
            "vehiculo_id": c.vehiculo_id,
            "fecha": c.fecha,
            "total": c.total,
            "estado": c.estado,
            "cliente_nombre": c.cliente.nombre_razon_social if c.cliente else None,
            "cliente_documento": c.cliente.documento_identidad if c.cliente else None,
            "vehiculo_placa": c.vehiculo.placa if c.vehiculo else None,
            "vehiculo_modelo": f"{c.vehiculo.marca} {c.vehiculo.modelo}" if c.vehiculo else None,
            "detalles": c.detalles or []
        }
        resultado.append(c_dict)
    return resultado


@router.get("/{cotizacion_id}", response_model=CotizacionResponse)
def obtener_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    c = db.query(Cotizacion).filter(Cotizacion.cotizacion_id == cotizacion_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
    return {
        "cotizacion_id": c.cotizacion_id,
        "codigo_cotizacion": c.codigo_cotizacion,
        "cliente_id": c.cliente_id,
        "vehiculo_id": c.vehiculo_id,
        "fecha": c.fecha,
        "total": c.total,
        "estado": c.estado,
        "cliente_nombre": c.cliente.nombre_razon_social if c.cliente else None,
        "cliente_documento": c.cliente.documento_identidad if c.cliente else None,
        "vehiculo_placa": c.vehiculo.placa if c.vehiculo else None,
        "vehiculo_modelo": f"{c.vehiculo.marca} {c.vehiculo.modelo}" if c.vehiculo else None,
        "detalles": c.detalles or []
    }


@router.post("", response_model=CotizacionResponse, status_code=201)
def crear_cotizacion(datos: CotizacionCreate, db: Session = Depends(get_db)):
    try:
        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(ConfiguracionCorrelativo.tipo_documento == "COTIZACION", ConfiguracionCorrelativo.activo == True)
            .with_for_update()
            .first()
        )

        if not configuracion:
            codigo = f"COT-{1000 + db.query(Cotizacion).count() + 1}"
        else:
            codigo = f"{configuracion.prefijo}-{configuracion.siguiente_correlativo}"
            configuracion.siguiente_correlativo += 1

        cotizacion = Cotizacion(
            codigo_cotizacion=codigo,
            cliente_id=datos.cliente_id,
            vehiculo_id=datos.vehiculo_id,
            total=datos.total,
            estado=datos.estado
        )
        db.add(cotizacion)
        db.flush()

        if datos.detalles:
            for d in datos.detalles:
                det = DetalleCotizacion(
                    cotizacion_id=cotizacion.cotizacion_id,
                    item_id=d.item_id,
                    descripcion=d.descripcion,
                    cantidad=d.cantidad,
                    precio_unitario=d.precio_unitario,
                    descuento=d.descuento,
                    impuesto=d.impuesto,
                    total=d.total
                )
                db.add(det)

        db.commit()
        db.refresh(cotizacion)

        return {
            "cotizacion_id": cotizacion.cotizacion_id,
            "codigo_cotizacion": cotizacion.codigo_cotizacion,
            "cliente_id": cotizacion.cliente_id,
            "vehiculo_id": cotizacion.vehiculo_id,
            "fecha": cotizacion.fecha,
            "total": cotizacion.total,
            "estado": cotizacion.estado,
            "cliente_nombre": cotizacion.cliente.nombre_razon_social if cotizacion.cliente else None,
            "cliente_documento": cotizacion.cliente.documento_identidad if cotizacion.cliente else None,
            "vehiculo_placa": cotizacion.vehiculo.placa if cotizacion.vehiculo else None,
            "vehiculo_modelo": f"{cotizacion.vehiculo.marca} {cotizacion.vehiculo.modelo}" if cotizacion.vehiculo else None,
            "detalles": cotizacion.detalles or []
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))