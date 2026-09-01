from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.inventario import Inventario
from app.models.categoria import Categoria
from app.schemas.inventario import (
    InventarioCreate,
    InventarioResponse
)


router = APIRouter()


def convertir_item(item):

    return {
        "item_id": item.item_id,
        "tipo": item.tipo,
        "categoria_id": item.categoria_id,
        "codigo_referencia": item.codigo_referencia,
        "nombre_nomenclatura": item.nombre_nomenclatura,
        "unidad_medida": item.unidad_medida,
        "marca": item.marca,
        "stock_actual": item.stock_actual,
        "stock_minimo": item.stock_minimo,
        "costo_compra": item.costo_compra,
        "margen_ganancia": item.margen_ganancia,
        "precio_venta": item.precio_venta,
        "impuesto": item.impuesto,
        "activo": item.activo,
        "categoria_nombre": (
            item.categoria.nombre
            if getattr(item, "categoria", None)
            else None
        )
    }


@router.get(
    "",
    response_model=List[InventarioResponse]
)
def listar_inventario(
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Inventario)

    if tipo and tipo != "Todos":
        query = query.filter(
            Inventario.tipo == tipo
        )

    if categoria_id:
        query = query.filter(
            Inventario.categoria_id == categoria_id
        )

    items = query.order_by(
        Inventario.item_id.asc()
    ).all()

    resultado = []

    for item in items:

        categoria = db.query(Categoria).filter(
            Categoria.categoria_id == item.categoria_id
        ).first()

        resultado.append({
            "item_id": item.item_id,
            "tipo": item.tipo,
            "categoria_id": item.categoria_id,
            "codigo_referencia": item.codigo_referencia,
            "nombre_nomenclatura": item.nombre_nomenclatura,
            "unidad_medida": item.unidad_medida,
            "marca": item.marca,
            "stock_actual": item.stock_actual,
            "stock_minimo": item.stock_minimo,
            "costo_compra": item.costo_compra,
            "margen_ganancia": item.margen_ganancia,
            "precio_venta": item.precio_venta,
            "impuesto": item.impuesto,
            "activo": item.activo,
            "categoria_nombre": (
                categoria.nombre
                if categoria
                else None
            )
        })

    return resultado


@router.get(
    "/{item_id}",
    response_model=InventarioResponse
)
def obtener_item(
    item_id: int,
    db: Session = Depends(get_db)
):

    item = db.query(Inventario).filter(
        Inventario.item_id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Ítem no encontrado."
        )

    categoria = db.query(Categoria).filter(
        Categoria.categoria_id == item.categoria_id
    ).first()

    return {
        "item_id": item.item_id,
        "tipo": item.tipo,
        "categoria_id": item.categoria_id,
        "codigo_referencia": item.codigo_referencia,
        "nombre_nomenclatura": item.nombre_nomenclatura,
        "unidad_medida": item.unidad_medida,
        "marca": item.marca,
        "stock_actual": item.stock_actual,
        "stock_minimo": item.stock_minimo,
        "costo_compra": item.costo_compra,
        "margen_ganancia": item.margen_ganancia,
        "precio_venta": item.precio_venta,
        "impuesto": item.impuesto,
        "activo": item.activo,
        "categoria_nombre": (
            categoria.nombre
            if categoria
            else None
        )
    }


@router.post(
    "",
    response_model=InventarioResponse,
    status_code=201
)
def crear_item(
    datos: InventarioCreate,
    db: Session = Depends(get_db)
):

    item = Inventario(
        **datos.model_dump()
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    categoria = db.query(Categoria).filter(
        Categoria.categoria_id == item.categoria_id
    ).first()

    return {
        "item_id": item.item_id,
        "tipo": item.tipo,
        "categoria_id": item.categoria_id,
        "codigo_referencia": item.codigo_referencia,
        "nombre_nomenclatura": item.nombre_nomenclatura,
        "unidad_medida": item.unidad_medida,
        "marca": item.marca,
        "stock_actual": item.stock_actual,
        "stock_minimo": item.stock_minimo,
        "costo_compra": item.costo_compra,
        "margen_ganancia": item.margen_ganancia,
        "precio_venta": item.precio_venta,
        "impuesto": item.impuesto,
        "activo": item.activo,
        "categoria_nombre": (
            categoria.nombre
            if categoria
            else None
        )
    }