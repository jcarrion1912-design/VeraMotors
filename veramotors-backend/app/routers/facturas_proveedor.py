from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.factura_proveedor import FacturaProveedor
from app.models.detalle_factura_proveedor import DetalleFacturaProveedor
from app.models.proveedor import Proveedor
from app.schemas.factura_proveedor import FacturaProveedorCreate, FacturaProveedorResponse

router = APIRouter()


@router.get("", response_model=List[FacturaProveedorResponse])
def listar_facturas_proveedor(
    proveedor_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FacturaProveedor)

    if proveedor_id:
        query = query.filter(FacturaProveedor.proveedor_id == proveedor_id)

    if estado and estado != "Todos":
        query = query.filter(FacturaProveedor.estado == estado)

    return query.order_by(FacturaProveedor.factura_proveedor_id.desc()).all()


@router.get("/{factura_proveedor_id}", response_model=FacturaProveedorResponse)
def obtener_factura_proveedor(
    factura_proveedor_id: int,
    db: Session = Depends(get_db),
):
    factura = db.query(FacturaProveedor).filter(FacturaProveedor.factura_proveedor_id == factura_proveedor_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura de proveedor no encontrada.")
    return factura


@router.post("", response_model=FacturaProveedorResponse, status_code=201)
def crear_factura_proveedor(
    datos: FacturaProveedorCreate,
    db: Session = Depends(get_db),
):
    proveedor = db.query(Proveedor).filter(Proveedor.proveedor_id == datos.proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    factura = FacturaProveedor(
        proveedor_id=datos.proveedor_id,
        compra_id=datos.compra_id,
        recepcion_id=datos.recepcion_id,
        tipo_comprobante=datos.tipo_comprobante,
        serie=datos.serie,
        numero=datos.numero,
        fecha_emision=datos.fecha_emision,
        fecha_vencimiento=datos.fecha_vencimiento,
        subtotal=datos.subtotal,
        igv=datos.igv,
        total=datos.total,
        moneda=datos.moneda,
        estado=datos.estado,
        observaciones=datos.observaciones,
    )

    for detalle in datos.detalles:
        factura.detalles.append(
            DetalleFacturaProveedor(
                descripcion=detalle.descripcion,
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                impuesto=detalle.impuesto,
                total=detalle.total,
            )
        )

    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura
