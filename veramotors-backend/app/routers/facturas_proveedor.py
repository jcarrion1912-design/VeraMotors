from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pypdf.errors import PdfReadError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import admin_o_repuestos
from app.database import get_db
from app.models.compra import Compra
from app.models.factura_proveedor import FacturaProveedor
from app.models.detalle_factura_proveedor import DetalleFacturaProveedor
from app.models.proveedor import Proveedor
from app.models.recepcion import Recepcion
from app.schemas.factura_proveedor import FacturaProveedorCreate, FacturaProveedorResponse
from app.services.facturas_proveedor_documentos import (
    MAX_PDF_BYTES,
    codigo_interno,
    extraer_datos_comprobante,
    generar_pdf_interno,
    ruta_pdf_original,
)

router = APIRouter()
CENTAVO = Decimal("0.01")


def _redondear_monto(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def _calcular_importes(detalles):
    subtotal = Decimal("0")
    igv = Decimal("0")
    lineas = []

    for detalle in detalles:
        cantidad = Decimal(str(detalle.cantidad))
        precio = Decimal(str(detalle.precio_unitario))
        impuesto = _redondear_monto(Decimal(str(detalle.impuesto or 0)))
        importe = _redondear_monto(cantidad * precio)
        total_linea = _redondear_monto(importe + impuesto)
        subtotal += importe
        igv += impuesto
        lineas.append(
            {
                "descripcion": detalle.descripcion.strip(),
                "cantidad": cantidad,
                "precio_unitario": precio,
                "impuesto": impuesto,
                "total": total_linea,
            }
        )

    subtotal = _redondear_monto(subtotal)
    igv = _redondear_monto(igv)
    return lineas, subtotal, igv, _redondear_monto(subtotal + igv)


def _validar_relaciones(datos: FacturaProveedorCreate, db: Session) -> None:
    if datos.compra_id is not None:
        compra = db.query(Compra).filter(Compra.compra_id == datos.compra_id).first()
        if not compra:
            raise HTTPException(status_code=404, detail="Orden de compra no encontrada.")
        if compra.proveedor_id != datos.proveedor_id:
            raise HTTPException(
                status_code=422,
                detail="La orden de compra no pertenece al proveedor seleccionado.",
            )

    if datos.recepcion_id is not None:
        recepcion = db.query(Recepcion).filter(Recepcion.recepcion_id == datos.recepcion_id).first()
        if not recepcion:
            raise HTTPException(status_code=404, detail="Recepción no encontrada.")
        if recepcion.proveedor_id != datos.proveedor_id:
            raise HTTPException(
                status_code=422,
                detail="La recepción no pertenece al proveedor seleccionado.",
            )
        if datos.compra_id is not None and recepcion.compra_id != datos.compra_id:
            raise HTTPException(
                status_code=422,
                detail="La recepción seleccionada no pertenece a la orden de compra indicada.",
            )


def _extraer_pdf_o_error(contenido: bytes) -> dict:
    if not contenido.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="El archivo seleccionado no es un PDF válido.")
    try:
        return extraer_datos_comprobante(contenido)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (PdfReadError, OSError) as error:
        raise HTTPException(status_code=422, detail="No se pudo leer el PDF enviado.") from error


@router.post("/extraer-pdf", dependencies=[Depends(admin_o_repuestos)])
async def extraer_datos_pdf_proveedor(archivo: UploadFile = File(...)):
    contenido = await archivo.read(MAX_PDF_BYTES + 1)
    if len(contenido) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 25 MB.")
    return _extraer_pdf_o_error(contenido)


@router.post(
    "/{factura_proveedor_id}/pdf-original",
    status_code=201,
    dependencies=[Depends(admin_o_repuestos)],
)
async def guardar_pdf_original_proveedor(
    factura_proveedor_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    factura = db.query(FacturaProveedor).filter(
        FacturaProveedor.factura_proveedor_id == factura_proveedor_id
    ).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura de proveedor no encontrada.")

    contenido = await archivo.read(MAX_PDF_BYTES + 1)
    if len(contenido) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 25 MB.")
    _extraer_pdf_o_error(contenido)

    destino = ruta_pdf_original(factura_proveedor_id)
    creado = False
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        with destino.open("xb") as archivo_destino:
            creado = True
            archivo_destino.write(contenido)
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail="La factura ya tiene un PDF original adjunto.") from error
    except OSError as error:
        if creado:
            try:
                destino.unlink()
            except FileNotFoundError:
                pass
            except OSError as error_limpieza:
                raise HTTPException(
                    status_code=500,
                    detail="Falló el guardado y no se pudo retirar el archivo incompleto.",
                ) from error_limpieza
        raise HTTPException(status_code=500, detail="No se pudo guardar el PDF en el almacenamiento configurado.") from error

    return {
        "factura_proveedor_id": factura_proveedor_id,
        "codigo_interno": codigo_interno(factura_proveedor_id),
        "archivo_guardado": True,
    }


@router.get(
    "/{factura_proveedor_id}/pdf-original",
    dependencies=[Depends(admin_o_repuestos)],
)
def obtener_pdf_original_proveedor(
    factura_proveedor_id: int,
    descargar: bool = False,
    db: Session = Depends(get_db),
):
    factura = db.query(FacturaProveedor).filter(
        FacturaProveedor.factura_proveedor_id == factura_proveedor_id
    ).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura de proveedor no encontrada.")

    ruta = ruta_pdf_original(factura_proveedor_id)
    if not ruta.is_file():
        raise HTTPException(status_code=404, detail="Esta factura no tiene un PDF original almacenado.")

    nombre = f"{codigo_interno(factura_proveedor_id)}-original.pdf"
    try:
        contenido = ruta.read_bytes()
    except OSError as error:
        raise HTTPException(status_code=500, detail="No se pudo leer el PDF original almacenado.") from error
    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'{"attachment" if descargar else "inline"}; filename="{nombre}"'
        },
    )


@router.get(
    "/{factura_proveedor_id}/pdf-interno",
    dependencies=[Depends(admin_o_repuestos)],
)
def descargar_pdf_interno_proveedor(
    factura_proveedor_id: int,
    descargar: bool = False,
    db: Session = Depends(get_db),
):
    factura = db.query(FacturaProveedor).filter(
        FacturaProveedor.factura_proveedor_id == factura_proveedor_id
    ).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura de proveedor no encontrada.")

    contenido = generar_pdf_interno(factura)
    nombre = f"{codigo_interno(factura_proveedor_id)}-registro-interno.pdf"
    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'{"attachment" if descargar else "inline"}; filename="{nombre}"'
        },
    )


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
    if datos.ruc_comprobante and datos.ruc_comprobante != proveedor.ruc:
        raise HTTPException(
            status_code=422,
            detail="El RUC del comprobante no corresponde al proveedor seleccionado.",
        )

    _validar_relaciones(datos, db)

    detalles_calculados = []
    subtotal = datos.subtotal
    igv = datos.igv
    total = datos.total
    if datos.detalles:
        detalles_calculados, subtotal, igv, total = _calcular_importes(datos.detalles)

    factura = FacturaProveedor(
        proveedor_id=datos.proveedor_id,
        compra_id=datos.compra_id,
        recepcion_id=datos.recepcion_id,
        tipo_comprobante="Factura",
        serie=datos.serie.strip().upper(),
        numero=datos.numero.strip(),
        fecha_emision=datos.fecha_emision,
        fecha_vencimiento=datos.fecha_vencimiento,
        subtotal=subtotal,
        igv=igv,
        total=total,
        moneda=datos.moneda,
        estado="Pendiente",
        observaciones=datos.observaciones,
    )

    for detalle in detalles_calculados:
        factura.detalles.append(
            DetalleFacturaProveedor(**detalle)
        )

    db.add(factura)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un comprobante con ese tipo, serie y número para este proveedor.")
    db.refresh(factura)
    return factura
