import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.nota_debito import NotaDebito
from app.models.detalle_nota_debito import DetalleNotaDebito
from app.models.factura import Factura
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.services.sunat_service import SunatService

from app.schemas.nota_debito import (
    NotaDebitoCreate,
    NotaDebitoResponse
)


router = APIRouter()


# ============================================================
# LISTAR NOTAS DE DÉBITO
# GET /api/notas-debito
# ============================================================

@router.get(
    "",
    response_model=list[NotaDebitoResponse]
)
def listar_notas_debito(
    db: Session = Depends(get_db)
):
    notas = (
        db.query(NotaDebito)
        .order_by(
            NotaDebito.nota_debito_id.desc()
        )
        .all()
    )

    resultado = []

    for n in notas:
        resultado.append({
            "nota_debito_id": n.nota_debito_id,
            "factura_id": n.factura_id,
            "cliente_id": n.cliente_id,
            "tipo_nota": n.tipo_nota,
            "serie": n.serie,
            "correlativo": n.correlativo,
            "numero_nota": n.numero_nota,
            "fecha_emision": n.fecha_emision,
            "codigo_motivo": n.codigo_motivo,
            "motivo": n.motivo,
            "subtotal": n.subtotal,
            "impuestos": n.impuestos,
            "total": n.total,
            "estado_sunat": n.estado_sunat,
            "codigo_sunat": n.codigo_sunat,
            "respuesta_sunat": n.respuesta_sunat,
            "fecha_envio_sunat": n.fecha_envio_sunat,
            "cliente_nombre": (
                n.cliente.nombre_razon_social
                if n.cliente
                else None
            ),
            "numero_factura": (
                n.factura.numero_comprobante
                if n.factura
                else None
            ),
            "detalles": n.detalles
        })

    return resultado


# ============================================================
# OBTENER NOTA DE DÉBITO
# GET /api/notas-debito/{nota_debito_id}
# ============================================================

@router.get(
    "/{nota_debito_id}/estado-sunat"
)
def consultar_estado_sunat_nota_debito(
    nota_debito_id: int,
    db: Session = Depends(get_db)
):
    nota = (
        db.query(NotaDebito)
        .filter(NotaDebito.nota_debito_id == nota_debito_id)
        .first()
    )

    if not nota:
        raise HTTPException(status_code=404, detail="Nota de débito no encontrada.")

    try:
        if not nota.respuesta_sunat:
            raise HTTPException(status_code=400, detail="La nota de débito todavía no tiene una respuesta de APISUNAT.")

        try:
            respuesta_guardada = json.loads(nota.respuesta_sunat)
        except (TypeError, json.JSONDecodeError):
            respuesta_guardada = {}

        document_id = (
            respuesta_guardada.get("documentId")
            or respuesta_guardada.get("documentID")
            or respuesta_guardada.get("document_id")
            or respuesta_guardada.get("id")
        ) if isinstance(respuesta_guardada, dict) else None

        if not document_id:
            raise HTTPException(status_code=400, detail="No se encontró documentId en la respuesta guardada de APISUNAT.")

        respuesta = SunatService().consultar_estado(str(document_id))
        estado_api = str(respuesta.get("status", "")).strip().upper() if isinstance(respuesta, dict) else ""

        if estado_api == "ACEPTADO":
            nota.estado_sunat = "Aceptado"
        elif estado_api == "RECHAZADO":
            nota.estado_sunat = "Rechazado"
        elif estado_api == "ANULADO":
            nota.estado_sunat = "Anulado"
        else:
            nota.estado_sunat = "Pendiente"

        nota.codigo_sunat = estado_api or nota.codigo_sunat or "PENDIENTE"
        nota.respuesta_sunat = json.dumps(respuesta, ensure_ascii=False)
        nota.fecha_envio_sunat = datetime.now()

        db.commit()
        db.refresh(nota)

        return {
            "nota_debito_id": nota.nota_debito_id,
            "numero_nota": nota.numero_nota,
            "estado_sunat": nota.estado_sunat,
            "codigo_sunat": nota.codigo_sunat,
            "respuesta_sunat": respuesta,
            "fecha_envio_sunat": nota.fecha_envio_sunat
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"No se pudo consultar el estado en APISUNAT: {error}")


@router.get(
    "/{nota_debito_id}",
    response_model=NotaDebitoResponse
)
def obtener_nota_debito(
    nota_debito_id: int,
    db: Session = Depends(get_db)
):

    nota = (
        db.query(NotaDebito)
        .filter(
            NotaDebito.nota_debito_id
            == nota_debito_id
        )
        .first()
    )

    if not nota:
        raise HTTPException(
            status_code=404,
            detail="Nota de débito no encontrada."
        )

    return nota


# ============================================================
# CREAR NOTA DE DÉBITO
# POST /api/notas-debito
# ============================================================

@router.post(
    "",
    response_model=NotaDebitoResponse,
    status_code=201
)
def crear_nota_debito(
    datos: NotaDebitoCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # 1. VERIFICAR COMPROBANTE AFECTADO
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
                detail="El comprobante indicado no existe."
            )

        # ====================================================
        # 2. VERIFICAR CLIENTE
        # ====================================================

        if datos.cliente_id != factura.cliente_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "El cliente de la nota de débito "
                    "no coincide con el comprobante afectado."
                )
            )

        # ====================================================
        # 3. CONFIGURACIÓN DEL CORRELATIVO
        # ====================================================

        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento
                == "NOTA_DEBITO",
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
                    "para NOTA_DEBITO."
                )
            )

        # ====================================================
        # 4. GENERAR CORRELATIVO
        # ====================================================

        serie = configuracion.prefijo

        correlativo = (
            configuracion.siguiente_correlativo
        )

        numero_nota = (
            f"{serie}-{correlativo:08d}"
        )

        # ====================================================
        # 5. CREAR NOTA DE DÉBITO
        # ====================================================

        nota = NotaDebito(

            factura_id=datos.factura_id,

            cliente_id=datos.cliente_id,

            tipo_nota=datos.tipo_nota,

            serie=serie,

            correlativo=correlativo,

            numero_nota=numero_nota,

            codigo_motivo=datos.codigo_motivo,

            motivo=datos.motivo,

            subtotal=datos.subtotal,

            impuestos=datos.impuestos,

            total=datos.total,

            estado_sunat="Pendiente"
        )

        db.add(nota)

        db.flush()

        # ====================================================
        # 6. CREAR DETALLES
        # ====================================================

        for detalle in datos.detalles:

            detalle_nota = DetalleNotaDebito(

                nota_debito_id=nota.nota_debito_id,

                item_id=detalle.item_id,

                descripcion=detalle.descripcion,

                cantidad=detalle.cantidad,

                precio_unitario=detalle.precio_unitario,

                impuesto=detalle.impuesto,

                total=detalle.total
            )

            db.add(detalle_nota)

        # ====================================================
        # 7. ACTUALIZAR CORRELATIVO
        # ====================================================

        configuracion.siguiente_correlativo = (
            correlativo + 1
        )

        # ====================================================
        # 8. GUARDAR
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
                "No se pudo registrar la nota de débito."
            )
        )

    except Exception as error:

        db.rollback()

        print(
            "ERROR CREANDO NOTA DE DÉBITO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Ocurrió un error al registrar "
                "la nota de débito."
            )
        )