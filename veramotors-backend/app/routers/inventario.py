from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inventario import Inventario
from app.models.categoria import Categoria
from app.schemas.inventario import (
    InventarioCreate,
    InventarioResponse,
    InventarioUpdate,
)

router = APIRouter()


def serializar_item(item: Inventario):
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
        ),
    }


@router.get("", response_model=List[InventarioResponse])
def listar_inventario(
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Inventario)
        .filter(Inventario.activo.is_(True))
    )

    if tipo and tipo != "Todos":
        query = query.filter(Inventario.tipo == tipo)

    if categoria_id:
        query = query.filter(
            Inventario.categoria_id == categoria_id
        )

    items = (
        query
        .order_by(Inventario.item_id.asc())
        .all()
    )

    return [serializar_item(item) for item in items]


@router.get("/categorias")
def listar_categorias_inventario(
    db: Session = Depends(get_db),
):
    categorias = (
        db.query(Categoria)
        .filter(Categoria.activo.is_(True))
        .order_by(Categoria.nombre.asc())
        .all()
    )

    return [
        {
            "categoria_id": categoria.categoria_id,
            "nombre": categoria.nombre,
        }
        for categoria in categorias
    ]


@router.get(
    "/{item_id}",
    response_model=InventarioResponse,
)
def obtener_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(Inventario)
        .filter(Inventario.item_id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Ítem no encontrado.",
        )

    return serializar_item(item)


@router.post(
    "",
    response_model=InventarioResponse,
    status_code=201,
)
def crear_item(
    datos: InventarioCreate,
    db: Session = Depends(get_db),
):
    categoria = (
        db.query(Categoria)
        .filter(
            Categoria.categoria_id == datos.categoria_id,
            Categoria.activo.is_(True),
        )
        .first()
    )

    if not categoria:
        raise HTTPException(
            status_code=400,
            detail="La categoría seleccionada no existe o está inactiva.",
        )

    existente = (
        db.query(Inventario)
        .filter(
            Inventario.codigo_referencia
            == datos.codigo_referencia.strip()
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un ítem con ese código de referencia.",
        )

    item = Inventario(
        tipo=datos.tipo,
        categoria_id=datos.categoria_id,
        codigo_referencia=datos.codigo_referencia.strip(),
        nombre_nomenclatura=datos.nombre_nomenclatura.strip(),
        unidad_medida=datos.unidad_medida,
        marca=datos.marca.strip() if datos.marca else None,
        stock_actual=datos.stock_actual,
        stock_minimo=datos.stock_minimo,
        costo_compra=datos.costo_compra,
        margen_ganancia=datos.margen_ganancia,
        precio_venta=datos.precio_venta,
        impuesto=datos.impuesto,
        activo=True,
    )

    try:
        db.add(item)
        db.commit()
        db.refresh(item)

        return serializar_item(item)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="No se pudo registrar el ítem porque existe información duplicada.",
        )


@router.put(
    "/{item_id}",
    response_model=InventarioResponse,
)
def actualizar_item(
    item_id: int,
    datos: InventarioUpdate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(Inventario)
        .filter(Inventario.item_id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Ítem no encontrado.",
        )

    cambios = datos.model_dump(
        exclude_unset=True
    )

    if "categoria_id" in cambios:
        categoria = (
            db.query(Categoria)
            .filter(
                Categoria.categoria_id
                == cambios["categoria_id"],
                Categoria.activo.is_(True),
            )
            .first()
        )

        if not categoria:
            raise HTTPException(
                status_code=400,
                detail="La categoría seleccionada no existe o está inactiva.",
            )

    if "codigo_referencia" in cambios:
        codigo = cambios["codigo_referencia"].strip()

        duplicado = (
            db.query(Inventario)
            .filter(
                Inventario.codigo_referencia == codigo,
                Inventario.item_id != item_id,
            )
            .first()
        )

        if duplicado:
            raise HTTPException(
                status_code=409,
                detail="Otro ítem ya utiliza ese código de referencia.",
            )

        cambios["codigo_referencia"] = codigo

    if "nombre_nomenclatura" in cambios:
        cambios["nombre_nomenclatura"] = (
            cambios["nombre_nomenclatura"].strip()
        )

    if "marca" in cambios and cambios["marca"]:
        cambios["marca"] = cambios["marca"].strip()

    for campo, valor in cambios.items():
        setattr(item, campo, valor)

    try:
        db.commit()
        db.refresh(item)

        return serializar_item(item)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="No se pudo actualizar el ítem.",
        )


@router.delete(
    "/{item_id}",
)
def desactivar_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(Inventario)
        .filter(Inventario.item_id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Ítem no encontrado.",
        )

    item.activo = False

    db.commit()

    return {
        "ok": True,
        "message": "Ítem desactivado correctamente.",
        "item_id": item.item_id,
    }