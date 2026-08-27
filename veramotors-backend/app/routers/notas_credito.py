from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.nota_credito import NotaCredito
from app.models.factura import Factura
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.schemas.nota_credito import (
    NotaCreditoCreate,
    NotaCreditoResponse
)


router = APIRouter()


# ============================================================
# LISTAR NOTAS DE CRÉDITO
# GET /api/notas-credito
# ============================================================

@router.get(
    "",
    response_model=list[NotaCreditoResponse]
)
def listar_notas_credito(
    db: Session = Depends(get_db)
):
    notas = (
        db.query(NotaCredito)
        .order_by(
            NotaCredito.nota_credito_id.desc()
        )
        .all()
    )
    resultado = []
    for n in notas:
        resultado.append({
            "nota_credito_id": n.nota_credito_id,
            "factura_id": n.factura_id,
            "cliente_id": n.cliente_id,
            "tipo_nota": n.tipo_nota,
            "serie": n.serie,
            "correlativo": n.correlativo,
            "numero_nota": n.numero_nota,
            "fecha_emision": n.fecha_emision,
            "motivo": n.motivo,
            "subtotal": n.subtotal,
            "impuestos": n.impuestos,
            "total": n.total,
            "estado_sunat": n.estado_sunat,
            "codigo_sunat": n.codigo_sunat,
            "respuesta_sunat": n.respuesta_sunat,
            "fecha_envio_sunat": n.fecha_envio_sunat,
            "cliente_nombre": n.cliente.nombre_razon_social if n.cliente else None,
            "numero_factura": n.factura.numero_comprobante if n.factura else None
        })
    return resultado


# ============================================================
# OBTENER NOTA DE CRÉDITO
# GET /api/notas-credito/{nota_credito_id}
# ============================================================

@router.get(
    "/{nota_credito_id}",
    response_model=NotaCreditoResponse
)
def obtener_nota_credito(
    nota_credito_id: int,
    db: Session = Depends(get_db)
):

    nota = (
        db.query(NotaCredito)
        .filter(
            NotaCredito.nota_credito_id
            == nota_credito_id
        )
        .first()
    )

    if not nota:

        raise HTTPException(
            status_code=404,
            detail="Nota de crédito no encontrada."
        )

    return nota


# ============================================================
# CREAR NOTA DE CRÉDITO
# POST /api/notas-credito
# ============================================================

@router.post(
    "",
    response_model=NotaCreditoResponse,
    status_code=201
)
def crear_nota_credito(
    datos: NotaCreditoCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # 1. VERIFICAR FACTURA
        # ====================================================

        factura = (
            db.query(Factura)
            .filter(
                Factura.factura_id
                == datos.factura_id
            )
            .first()
        )

        if not factura:

            raise HTTPException(
                status_code=404,
                detail="La factura indicada no existe."
            )

        # ====================================================
        # 2. CONFIGURACIÓN DEL CORRELATIVO
        # ====================================================

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento
                == "NOTA_CREDITO",
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
                    "para NOTA_CREDITO."
                )
            )

        # ====================================================
        # 3. GENERAR CORRELATIVO
        # ====================================================

        serie = configuracion.prefijo

        correlativo = (
            configuracion.siguiente_correlativo
        )

        numero_nota = (
            f"{serie}-{correlativo:06d}"
        )

        # ====================================================
        # 4. CREAR NOTA
        # ====================================================

        nota = NotaCredito(

            factura_id=datos.factura_id,

            cliente_id=datos.cliente_id,

            tipo_nota=datos.tipo_nota,

            serie=serie,

            correlativo=correlativo,

            numero_nota=numero_nota,

            motivo=datos.motivo,

            subtotal=datos.subtotal,

            impuestos=datos.impuestos,

            total=datos.total,

            estado_sunat="Pendiente"
        )

        db.add(nota)

        db.flush()

        # ====================================================
        # 5. ACTUALIZAR CORRELATIVO
        # ====================================================

        configuracion.siguiente_correlativo = (
            correlativo + 1
        )

        # ====================================================
        # 6. GUARDAR
        # ====================================================

        db.commit()

        db.refresh(nota)

        return nota

    except HTTPException:

        db.rollback()
        raise

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "No se pudo registrar la nota de crédito."
            )
        )

    except Exception as error:

        db.rollback()

        print(
            "ERROR CREANDO NOTA DE CRÉDITO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Ocurrió un error al registrar "
                "la nota de crédito."
            )
        )