import json
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.config.settings import settings

from app.models.nota_debito import NotaDebito
from app.models.detalle_nota_debito import DetalleNotaDebito
from app.models.factura import Factura
from app.models.cliente import Cliente
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
# CONSULTAR ESTADO SUNAT DE NOTA DE DÉBITO
# GET /api/notas-debito/{nota_debito_id}/estado-sunat
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
        faults = respuesta.get("faults") or [] if isinstance(respuesta, dict) else []

        if estado_api == "ACEPTADO":
            nota.estado_sunat = "Aceptado"
        elif estado_api == "RECHAZADO" or estado_api == "EXCEPCION" or len(faults) > 0:
            nota.estado_sunat = "Rechazado"
        elif estado_api == "ANULADO":
            nota.estado_sunat = "Anulado"
        else:
            nota.estado_sunat = "Pendiente"

        if faults and len(faults) > 0:
            f = faults[0]
            fcode = f.get("faultcode", {}).get("_text", "") if isinstance(f.get("faultcode"), dict) else str(f.get("faultcode", ""))
            nota.codigo_sunat = fcode or "ERROR_SUNAT"
        else:
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
        cliente = (
            db.query(Cliente)
            .filter(
                Cliente.cliente_id
                == datos.cliente_id
            )
            .first()
        )

        if not cliente:
            raise HTTPException(
                status_code=404,
                detail="Cliente no encontrado."
            )

        if datos.cliente_id != factura.cliente_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "El cliente de la nota de débito "
                    "no coincide con el comprobante afectado."
                )
            )

        # ====================================================
        # 3. VALIDAR DOCUMENTO DEL CLIENTE
        # ====================================================
        documento = cliente.documento_identidad
        if not documento:
            raise HTTPException(
                status_code=400,
                detail="El cliente no tiene documento de identidad registrado."
            )
        documento = str(documento).strip()

        # ====================================================
        # 3.5 VALIDAR IMPORTES Y MONTOS
        # ====================================================
        subtotal = Decimal(str(datos.subtotal))
        impuestos = Decimal(str(datos.impuestos))
        total = Decimal(str(datos.total))

        if total <= 0:
            raise HTTPException(
                status_code=400,
                detail="El total de la nota de débito debe ser mayor a 0."
            )

        if round(subtotal + impuestos, 2) != round(total, 2):
            raise HTTPException(
                status_code=400,
                detail=f"Incoherencia en importes: Subtotal ({subtotal:.2f}) + IGV ({impuestos:.2f}) != Total ({total:.2f})."
            )

        # ====================================================
        # 4. DETERMINAR TIPO DEL COMPROBANTE AFECTADO Y SERIE
        # ====================================================
        es_factura = factura.tipo_comprobante == "Factura Electrónica" or (factura.serie and factura.serie.startswith("F"))
        es_boleta = factura.tipo_comprobante == "Boleta Electrónica" or (factura.serie and factura.serie.startswith("B"))

        if es_factura:
            codigo_comprobante_afectado = "01"
            customer_scheme_id = "6"
            tipo_correlativo = "NOTA_DEBITO_FACTURA"
            serie_esperada_letra = "F"

            if len(documento) != 11:
                raise HTTPException(
                    status_code=400,
                    detail="El cliente de una factura debe tener RUC de 11 dígitos."
                )

        elif es_boleta:
            codigo_comprobante_afectado = "03"
            customer_scheme_id = "1"
            tipo_correlativo = "NOTA_DEBITO_BOLETA"
            serie_esperada_letra = "B"

            if len(documento) != 8:
                raise HTTPException(
                    status_code=400,
                    detail="El cliente de una boleta debe tener DNI de 8 dígitos."
                )

        else:
            raise HTTPException(
                status_code=400,
                detail="El comprobante afectado no es Factura Electrónica ni Boleta Electrónica."
            )

        # ====================================================
        # 5. CONFIGURACIÓN DEL CORRELATIVO
        # ====================================================
        configuracion = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento == tipo_correlativo,
                ConfiguracionCorrelativo.activo == True
            )
            .with_for_update()
            .first()
        )

        if not configuracion:
            configuracion = (
                db.query(ConfiguracionCorrelativo)
                .filter(
                    ConfiguracionCorrelativo.tipo_documento == "NOTA_DEBITO",
                    ConfiguracionCorrelativo.activo == True
                )
                .with_for_update()
                .first()
            )

        if not configuracion:
            raise HTTPException(
                status_code=404,
                detail=f"No existe una configuración activa para {tipo_correlativo}."
            )

        serie = configuracion.prefijo.strip()
        if not serie.startswith(serie_esperada_letra):
            raise HTTPException(
                status_code=400,
                detail=f"Incoherencia normativa SUNAT: Para modificar un comprobante tipo '{factura.tipo_comprobante}', la serie debe iniciar con '{serie_esperada_letra}' (configurada: '{serie}')."
            )

        correlativo = configuracion.siguiente_correlativo
        numero_nota = f"{serie}-{correlativo:08d}"

        # ====================================================
        # 6. CREAR NOTA DE DÉBITO EN BASE DE DATOS
        # ====================================================
        nota = NotaDebito(
            factura_id=datos.factura_id,
            cliente_id=datos.cliente_id,
            tipo_nota=datos.tipo_nota,
            serie=serie,
            correlativo=correlativo,
            numero_nota=numero_nota,
            fecha_emision=datetime.now(),
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
        # 7. CREAR DETALLES
        # ====================================================
        detalles_list = list(datos.detalles) if datos.detalles else []
        if not detalles_list:
            # Si no vino desglose de ítems, crear una línea global representativa
            detalles_list = [{
                "item_id": None,
                "descripcion": datos.motivo or "Cargo adicional por nota de débito",
                "cantidad": Decimal("1"),
                "precio_unitario": subtotal,
                "impuesto": impuestos,
                "total": total
            }]

        for detalle in detalles_list:
            d_item_id = getattr(detalle, "item_id", None) if not isinstance(detalle, dict) else detalle.get("item_id")
            d_desc = getattr(detalle, "descripcion", "") if not isinstance(detalle, dict) else detalle.get("descripcion")
            d_cant = getattr(detalle, "cantidad", 1) if not isinstance(detalle, dict) else detalle.get("cantidad")
            d_pu = getattr(detalle, "precio_unitario", 0) if not isinstance(detalle, dict) else detalle.get("precio_unitario")
            d_imp = getattr(detalle, "impuesto", 0) if not isinstance(detalle, dict) else detalle.get("impuesto")
            d_tot = getattr(detalle, "total", 0) if not isinstance(detalle, dict) else detalle.get("total")

            detalle_nota = DetalleNotaDebito(
                nota_debito_id=nota.nota_debito_id,
                item_id=d_item_id,
                descripcion=d_desc,
                cantidad=d_cant,
                precio_unitario=d_pu,
                impuesto=d_imp,
                total=d_tot
            )
            db.add(detalle_nota)

        # ====================================================
        # 8. ACTUALIZAR CORRELATIVO
        # ====================================================
        configuracion.siguiente_correlativo = correlativo + 1

        db.commit()
        db.refresh(nota)

        # ====================================================
        # 9. CONSTRUIR PAYLOAD UBL 2.1 PARA APISUNAT
        # ====================================================
        file_name = f"{settings.SUNAT_RUC}-08-{serie}-{correlativo:08d}"
        issue_date = nota.fecha_emision.strftime("%Y-%m-%d")
        issue_time = nota.fecha_emision.strftime("%H:%M:%S")

        document_body = {
            "cbc:UBLVersionID": {"_text": "2.1"},
            "cbc:CustomizationID": {"_text": "2.0"},
            "cbc:ID": {"_text": numero_nota},
            "cbc:IssueDate": {"_text": issue_date},
            "cbc:IssueTime": {"_text": issue_time},
            "cbc:Note": [
                {
                    "_text": f"TOTAL {total:.2f} SOLES",
                    "_attributes": {"languageLocaleID": "1000"}
                }
            ],
            "cbc:DocumentCurrencyCode": {"_text": "PEN"},
            "cac:DiscrepancyResponse": {
                "cbc:ResponseCode": {"_text": str(datos.codigo_motivo)},
                "cbc:Description": {"_text": datos.motivo}
            },
            "cac:BillingReference": {
                "cac:InvoiceDocumentReference": {
                    "cbc:ID": {"_text": factura.numero_comprobante},
                    "cbc:IssueDate": {"_text": factura.fecha_emision.strftime("%Y-%m-%d")},
                    "cbc:DocumentTypeCode": {"_text": codigo_comprobante_afectado}
                }
            },
            "cac:AccountingSupplierParty": {
                "cac:Party": {
                    "cac:PartyIdentification": {
                        "cbc:ID": {
                            "_attributes": {"schemeID": "6"},
                            "_text": settings.SUNAT_RUC
                        }
                    },
                    "cac:PartyName": {
                        "cbc:Name": {
                            "_text": settings.SUNAT_RAZON_SOCIAL
                        }
                    },
                    "cac:PartyLegalEntity": {
                        "cbc:RegistrationName": {
                            "_text": settings.SUNAT_RAZON_SOCIAL
                        },
                        "cac:RegistrationAddress": {
                            "cbc:AddressTypeCode": {
                                "_text": settings.SUNAT_CODIGO_ESTABLECIMIENTO
                            }
                        }
                    }
                }
            },
            "cac:AccountingCustomerParty": {
                "cac:Party": {
                    "cac:PartyIdentification": {
                        "cbc:ID": {
                            "_attributes": {"schemeID": customer_scheme_id},
                            "_text": documento
                        }
                    },
                    "cac:PartyLegalEntity": {
                        "cbc:RegistrationName": {
                            "_text": cliente.nombre_razon_social
                        }
                    }
                }
            },
            "cac:TaxTotal": {
                "cbc:TaxAmount": {
                    "_attributes": {"currencyID": "PEN"},
                    "_text": f"{impuestos:.2f}"
                },
                "cac:TaxSubtotal": [
                    {
                        "cbc:TaxableAmount": {
                            "_attributes": {"currencyID": "PEN"},
                            "_text": f"{subtotal:.2f}"
                        },
                        "cbc:TaxAmount": {
                            "_attributes": {"currencyID": "PEN"},
                            "_text": f"{impuestos:.2f}"
                        },
                        "cac:TaxCategory": {
                            "cac:TaxScheme": {
                                "cbc:ID": {"_text": "1000"},
                                "cbc:Name": {"_text": "IGV"},
                                "cbc:TaxTypeCode": {"_text": "VAT"}
                            }
                        }
                    }
                ]
            },
            "cac:RequestedMonetaryTotal": {
                "cbc:PayableAmount": {
                    "_attributes": {"currencyID": "PEN"},
                    "_text": f"{total:.2f}"
                }
            },
            "cac:DebitNoteLine": []
        }

        # Generar líneas de la Nota de Débito
        for indice, det in enumerate(detalles_list, start=1):
            cant = Decimal(str(getattr(det, "cantidad", 1) if not isinstance(det, dict) else det.get("cantidad", 1)))
            det_total = Decimal(str(getattr(det, "total", 0) if not isinstance(det, dict) else det.get("total", 0)))
            det_imp = Decimal(str(getattr(det, "impuesto", 0) if not isinstance(det, dict) else det.get("impuesto", 0)))
            det_desc = getattr(det, "descripcion", "") if not isinstance(det, dict) else det.get("descripcion", "")
            det_base = det_total - det_imp

            if cant > 0:
                p_unitario = det_base / cant
                p_venta = det_total / cant
            else:
                p_unitario = Decimal("0")
                p_venta = Decimal("0")

            linea = {
                "cbc:ID": {"_text": str(indice)},
                "cbc:DebitedQuantity": {
                    "_attributes": {"unitCode": "NIU"},
                    "_text": str(cant)
                },
                "cbc:LineExtensionAmount": {
                    "_attributes": {"currencyID": "PEN"},
                    "_text": f"{det_base:.2f}"
                },
                "cac:PricingReference": {
                    "cac:AlternativeConditionPrice": {
                        "cbc:PriceAmount": {
                            "_attributes": {"currencyID": "PEN"},
                            "_text": f"{p_venta:.2f}"
                        },
                        "cbc:PriceTypeCode": {"_text": "01"}
                    }
                },
                "cac:TaxTotal": {
                    "cbc:TaxAmount": {
                        "_attributes": {"currencyID": "PEN"},
                        "_text": f"{det_imp:.2f}"
                    },
                    "cac:TaxSubtotal": [
                        {
                            "cbc:TaxableAmount": {
                                "_attributes": {"currencyID": "PEN"},
                                "_text": f"{det_base:.2f}"
                            },
                            "cbc:TaxAmount": {
                                "_attributes": {"currencyID": "PEN"},
                                "_text": f"{det_imp:.2f}"
                            },
                            "cac:TaxCategory": {
                                "cbc:Percent": {"_text": "18"},
                                "cbc:TaxExemptionReasonCode": {"_text": "10"},
                                "cac:TaxScheme": {
                                    "cbc:ID": {"_text": "1000"},
                                    "cbc:Name": {"_text": "IGV"},
                                    "cbc:TaxTypeCode": {"_text": "VAT"}
                                }
                            }
                        }
                    ]
                },
                "cac:Item": {
                    "cbc:Description": {"_text": det_desc}
                },
                "cac:Price": {
                    "cbc:PriceAmount": {
                        "_attributes": {"currencyID": "PEN"},
                        "_text": f"{p_unitario:.10f}"
                    }
                }
            }
            document_body["cac:DebitNoteLine"].append(linea)

        # ====================================================
        # 10. ENVIAR A APISUNAT
        # ====================================================
        sunat = SunatService()
        try:
            respuesta_sunat = sunat.enviar_comprobante(
                file_name=file_name,
                document_body=document_body,
                customer_email=(cliente.email if getattr(cliente, "email", None) else None)
            )
        except Exception as error_sunat:
            nota.estado_sunat = "Pendiente"
            nota.codigo_sunat = "ERROR"
            nota.respuesta_sunat = json.dumps({"error": str(error_sunat)}, ensure_ascii=False)
            nota.fecha_envio_sunat = datetime.now()
            db.commit()
            db.refresh(nota)
            print("\nERROR AL ENVIAR NOTA DE DÉBITO A APISUNAT:", repr(error_sunat))
            return nota

        # ====================================================
        # 11. INTERPRETAR RESPUESTA APISUNAT
        # ====================================================
        estado_api = ""
        faults = []
        if isinstance(respuesta_sunat, dict):
            estado_api = str(respuesta_sunat.get("status", "")).upper()
            faults = respuesta_sunat.get("faults") or []

        if estado_api == "ACEPTADO":
            nota.estado_sunat = "Aceptado"
        elif estado_api == "RECHAZADO" or estado_api == "EXCEPCION" or len(faults) > 0:
            nota.estado_sunat = "Rechazado"
        elif estado_api == "ANULADO":
            nota.estado_sunat = "Anulado"
        else:
            nota.estado_sunat = "Pendiente"

        nota.fecha_envio_sunat = datetime.now()
        nota.respuesta_sunat = json.dumps(respuesta_sunat, ensure_ascii=False)

        if isinstance(respuesta_sunat, dict):
            if faults and len(faults) > 0:
                f = faults[0]
                fcode = f.get("faultcode", {}).get("_text", "") if isinstance(f.get("faultcode"), dict) else str(f.get("faultcode", ""))
                nota.codigo_sunat = fcode or "ERROR_SUNAT"
            else:
                codigo = (
                    respuesta_sunat.get("codigo")
                    or respuesta_sunat.get("code")
                    or respuesta_sunat.get("status")
                )
                if codigo:
                    nota.codigo_sunat = str(codigo)

        db.commit()
        db.refresh(nota)
        return nota

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as error:
        db.rollback()
        print("ERROR DE INTEGRIDAD EN NOTA DE DÉBITO:", error)
        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": "No se pudo registrar la nota de débito.",
                "error": str(error.orig)
            }
        )

    except Exception as error:
        db.rollback()
        print("ERROR CREANDO NOTA DE DÉBITO:", error)
        raise HTTPException(
            status_code=500,
            detail={
                "mensaje": "Ocurrió un error al registrar la nota de débito.",
                "error": str(error)
            }
        )