from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cierre_caja import CierreCaja
from app.routers.caja import _serializar_cierre
from app.schemas.cierre_caja import CierreCajaResponse

router = APIRouter()


@router.get("", response_model=list[CierreCajaResponse])
def listar_cierres(db: Session = Depends(get_db)):
    cierres = db.query(CierreCaja).order_by(CierreCaja.cierre_caja_id.desc()).all()
    return [_serializar_cierre(db, cierre) for cierre in cierres]


@router.get("/{cierre_id}", response_model=CierreCajaResponse)
def obtener_cierre(cierre_id: int, db: Session = Depends(get_db)):
    cierre = db.query(CierreCaja).filter(CierreCaja.cierre_caja_id == cierre_id).first()
    if not cierre:
        raise HTTPException(status_code=404, detail="Cierre de caja no encontrado.")
    return _serializar_cierre(db, cierre)
