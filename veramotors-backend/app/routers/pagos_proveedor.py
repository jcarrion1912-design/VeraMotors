from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.factura_proveedor import FacturaProveedor
from app.models.pago_proveedor import PagoProveedor
from app.schemas.pago_proveedor import PagoProveedorCreate, PagoProveedorResponse

router = APIRouter()


@router.get("", response_model=List[PagoProveedorResponse])
def listar_pagos_proveedor(
    factura_proveedor_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(PagoProveedor)

    if factura_proveedor_id:
        query = query.filter(PagoProveedor.factura_proveedor_id == factura_proveedor_id)

    return query.order_by(PagoProveedor.pago_proveedor_id.desc()).all()


@router.get("/{pago_proveedor_id}", response_model=PagoProveedorResponse)
def obtener_pago_proveedor(
    pago_proveedor_id: int,
    db: Session = Depends(get_db),
):
    pago = db.query(PagoProveedor).filter(PagoProveedor.pago_proveedor_id == pago_proveedor_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago de proveedor no encontrado.")
    return pago


@router.post("", response_model=PagoProveedorResponse, status_code=201)
def crear_pago_proveedor(
    datos: PagoProveedorCreate,
    db: Session = Depends(get_db),
):
    factura = db.query(FacturaProveedor).filter(FacturaProveedor.factura_proveedor_id == datos.factura_proveedor_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura de proveedor no encontrada.")

    pagos_existentes = db.query(PagoProveedor).filter(PagoProveedor.factura_proveedor_id == datos.factura_proveedor_id).all()
    total_pagado = sum((Decimal(str(p.monto)) for p in pagos_existentes), Decimal("0"))
    saldo = Decimal(str(factura.total)) - total_pagado

    monto = Decimal(str(datos.monto))
    if monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero.")

    if monto > saldo:
        raise HTTPException(status_code=400, detail=f"El pago excede el saldo pendiente. Saldo máximo: {saldo}")

    pago = PagoProveedor(
        factura_proveedor_id=datos.factura_proveedor_id,
        usuario_id=datos.usuario_id,
        monto=monto,
        metodo_pago=datos.metodo_pago,
        observaciones=datos.observaciones,
    )
    db.add(pago)
    db.flush()

    nuevo_total_pagado = total_pagado + monto
    if nuevo_total_pagado >= Decimal(str(factura.total)):
        factura.estado = "Pagada"
    else:
        factura.estado = "Parcialmente pagada"

    db.commit()
    db.refresh(pago)
    return pago
