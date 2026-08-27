from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.factura import Factura
from app.models.detalle_factura import DetalleFactura
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.schemas.facturacion import (
    FacturaCreate,
    FacturaResponse
)


router = APIRouter()


# ============================================================
# LISTAR FACTURAS
#
# GET /api/facturacion
# ============================================================

@router.get(
    "",
    response_model=list[FacturaResponse]
)
def listar_facturas(
    db: Session = Depends(get_db)
):

    facturas = (
        db.query(Factura)
        .order_by(
            Factura.factura_id.desc()
        )
        .all()
    )

    return facturas


# ============================================================
# OBTENER UNA FACTURA
#
# GET /api/facturacion/{factura_id}
# ============================================================

@router.get(
    "/{factura_id}",
    response_model=FacturaResponse
)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):

    factura = (
        db.query(Factura)
        .filter(
            Factura.factura_id == factura_id
        )
        .first()
    )

    if not factura:

        raise HTTPException(
            status_code=404,
            detail="Factura no encontrada."
        )

    return factura


# ============================================================
# CREAR FACTURA
#
# POST /api/facturacion
# ============================================================

@router.post(
    "",
    response_model=FacturaResponse,
    status_code=201
)
def crear_factura(
    datos: FacturaCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # 1. BUSCAR CONFIGURACIÓN DE FACTURA
        # ====================================================

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento
                == "FACTURA",
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
                    "para FACTURA."
                )
            )

        # ====================================================
        # 2. OBTENER SERIE Y CORRELATIVO
        # ====================================================

        serie = configuracion.prefijo

        correlativo = (
            configuracion.siguiente_correlativo
        )

        numero_comprobante = (
            f"{serie}-{correlativo:06d}"
        )

        # ====================================================
        # 3. CREAR FACTURA
        # ====================================================

        factura = Factura(

            ods_id=datos.ods_id,

            cliente_id=datos.cliente_id,

            tipo_comprobante=(
                datos.tipo_comprobante
            ),

            serie=serie,

            correlativo=correlativo,

            numero_comprobante=(
                numero_comprobante
            ),

            metodo_pago=datos.metodo_pago,

            subtotal=datos.subtotal,

            impuestos=datos.impuestos,

            descuentos=datos.descuentos,

            total=datos.total,

            estado_pago="Pendiente",

            estado_sunat="Pendiente"
        )

        db.add(factura)

        db.flush()

        # ====================================================
        # 4. GUARDAR DETALLES
        # ====================================================

        for detalle in datos.detalles:

            detalle_db = DetalleFactura(

                factura_id=factura.factura_id,

                item_id=detalle.item_id,

                descripcion=detalle.descripcion,

                cantidad=detalle.cantidad,

                precio_unitario=(
                    detalle.precio_unitario
                ),

                descuento=detalle.descuento,

                impuesto=detalle.impuesto,

                total=detalle.total
            )

            db.add(detalle_db)

        # ====================================================
        # 5. INCREMENTAR CORRELATIVO
        # ====================================================

        configuracion.siguiente_correlativo = (
            correlativo + 1
        )

        # ====================================================
        # 6. GUARDAR TODO
        # ====================================================

        db.commit()

        db.refresh(factura)

        return factura

    except HTTPException:

        db.rollback()

        raise

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "No se pudo registrar la factura. "
                "Verifica los datos enviados."
            )
        )

    except Exception as error:

        db.rollback()

        print(
            "ERROR CREANDO FACTURA:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Ocurrió un error al registrar "
                "la factura."
            )
        )