import json
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.database import get_db
from app.config.settings import settings

from app.models.nota_credito import NotaCredito
from app.models.detalle_nota_credito import DetalleNotaCredito
from app.models.factura import Factura
from app.models.cliente import Cliente
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.schemas.nota_credito import (
    NotaCreditoCreate,
    NotaCreditoResponse
)

from app.services.sunat_service import SunatService


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
# OBTENER NOTA DE CRÉDITO
# GET /api/notas-credito/{nota_credito_id}
# ============================================================

@router.get(
    "/{nota_credito_id}/estado-sunat"
)
def consultar_estado_sunat_nota_credito(
    nota_credito_id: int,
    db: Session = Depends(get_db)
):
    nota = (
        db.query(NotaCredito)
        .filter(NotaCredito.nota_credito_id == nota_credito_id)
        .first()
    )

    if not nota:
        raise HTTPException(status_code=404, detail="Nota de crédito no encontrada.")

    try:
        if not nota.respuesta_sunat:
            raise HTTPException(status_code=400, detail="La nota de crédito todavía no tiene una respuesta de APISUNAT.")

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
            raise HTTPException(
                status_code=400,
                detail="No se encontró documentId en la respuesta guardada de APISUNAT."
            )

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

        codigo_error = None
        if faults and len(faults) > 0:
            f = faults[0]
            fcode = f.get("faultcode", {}).get("_text", "") if isinstance(f.get("faultcode"), dict) else str(f.get("faultcode", ""))
            fstring = f.get("faultstring", {}).get("_text", "") if isinstance(f.get("faultstring"), dict) else str(f.get("faultstring", ""))
            codigo_error = fcode or "ERROR_SUNAT"
            nota.codigo_sunat = codigo_error
        else:
            nota.codigo_sunat = estado_api or nota.codigo_sunat or "PENDIENTE"
        nota.respuesta_sunat = json.dumps(respuesta, ensure_ascii=False)
        nota.fecha_envio_sunat = datetime.now()

        db.commit()
        db.refresh(nota)

        return {
            "nota_credito_id": nota.nota_credito_id,
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
                    "El cliente de la nota de crédito "
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
                detail=(
                    "El cliente no tiene documento "
                    "de identidad registrado."
                )
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
                detail="El total de la nota de crédito debe ser mayor a 0."
            )

        if round(subtotal + impuestos, 2) != round(total, 2):
            raise HTTPException(
                status_code=400,
                detail=f"Incoherencia en importes: Subtotal ({subtotal:.2f}) + IGV ({impuestos:.2f}) != Total ({total:.2f})."
            )

        if round(total, 2) > round(Decimal(str(factura.total)), 2):
            raise HTTPException(
                status_code=400,
                detail=f"El importe total de la nota de crédito (S/ {total:.2f}) no puede superar el importe total del comprobante modificado (S/ {factura.total:.2f})."
            )

        # ====================================================
        # 4. DETERMINAR TIPO DEL COMPROBANTE AFECTADO Y SERIE
        # ====================================================
        es_factura = factura.tipo_comprobante == "Factura Electrónica" or (factura.serie and factura.serie.startswith("F"))
        es_boleta = factura.tipo_comprobante == "Boleta Electrónica" or (factura.serie and factura.serie.startswith("B"))

        if es_factura:
            codigo_comprobante_afectado = "01"
            customer_scheme_id = "6"
            tipo_correlativo = "NOTA_CREDITO_FACTURA"
            serie_esperada_letra = "F"

            if len(documento) != 11:
                raise HTTPException(
                    status_code=400,
                    detail="El cliente de una factura debe tener RUC de 11 dígitos."
                )

        elif es_boleta:
            codigo_comprobante_afectado = "03"
            customer_scheme_id = "1"
            tipo_correlativo = "NOTA_CREDITO_BOLETA"
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

        # Fallback de compatibilidad
        if not configuracion:
            configuracion = (
                db.query(ConfiguracionCorrelativo)
                .filter(
                    ConfiguracionCorrelativo.tipo_documento == "NOTA_CREDITO",
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
        # 7. CREAR NOTA DE CRÉDITO
        # ====================================================

        nota = NotaCredito(

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
        # 8. CREAR DETALLES
        # ====================================================

        for detalle in datos.detalles:

            detalle_nota = DetalleNotaCredito(

                nota_credito_id=nota.nota_credito_id,

                item_id=detalle.item_id,

                descripcion=detalle.descripcion,

                cantidad=detalle.cantidad,

                precio_unitario=detalle.precio_unitario,

                impuesto=detalle.impuesto,

                total=detalle.total
            )

            db.add(detalle_nota)


        # ====================================================
        # 9. ACTUALIZAR CORRELATIVO
        # ====================================================

        configuracion.siguiente_correlativo = (
            correlativo + 1
        )


        # ====================================================
        # 10. GUARDAR NOTA EN BD
        # ====================================================

        db.commit()

        db.refresh(nota)


        # ====================================================
        # 11. PREPARAR DATOS PARA APISUNAT
        # ====================================================

        subtotal = Decimal(
            str(datos.subtotal)
        )

        impuestos = Decimal(
            str(datos.impuestos)
        )

        total = Decimal(
            str(datos.total)
        )


        file_name = (
            f"{settings.SUNAT_RUC}-"
            f"07-"
            f"{serie}-"
            f"{correlativo:08d}"
        )


        # ====================================================
        # 12. FECHA Y HORA DE EMISIÓN
        # ====================================================

        fecha_emision = nota.fecha_emision

        issue_date = fecha_emision.strftime(
            "%Y-%m-%d"
        )

        issue_time = fecha_emision.strftime(
            "%H:%M:%S"
        )


        # ====================================================
        # 13. CONSTRUIR DOCUMENT BODY
        # ====================================================

        document_body = {

            "cbc:UBLVersionID": {
                "_text": "2.1"
            },

            "cbc:CustomizationID": {
                "_text": "2.0"
            },

            "cbc:ID": {
                "_text": numero_nota
            },

            "cbc:IssueDate": {
                "_text": issue_date
            },

            "cbc:IssueTime": {
                "_text": issue_time
            },

            "cbc:Note": [
                {
                    "_text": (
                        f"TOTAL {total:.2f} SOLES"
                    ),
                    "_attributes": {
                        "languageLocaleID": "1000"
                    }
                }
            ],

            "cbc:DocumentCurrencyCode": {
                "_text": "PEN"
            },


            # =================================================
            # MOTIVO DE LA NOTA
            # =================================================

            "cac:DiscrepancyResponse": {

                "cbc:ResponseCode": {
                    "_text": str(
                        datos.codigo_motivo
                    )
                },

                "cbc:Description": {
                    "_text": datos.motivo
                }
            },


            # =================================================
            # COMPROBANTE AFECTADO
            # =================================================

            "cac:BillingReference": {

                "cac:InvoiceDocumentReference": {

                    "cbc:ID": {
                        "_text": factura.numero_comprobante
                    },

                    "cbc:IssueDate": {
                        "_text": factura.fecha_emision.strftime(
                            "%Y-%m-%d"
                        )
                    },

                    "cbc:DocumentTypeCode": {
                        "_text": codigo_comprobante_afectado
                    }
                }
            },


            # =================================================
            # PROVEEDOR
            # =================================================

            "cac:AccountingSupplierParty": {

                "cac:Party": {

                    "cac:PartyIdentification": {

                        "cbc:ID": {

                            "_attributes": {
                                "schemeID": "6"
                            },

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


            # =================================================
            # CLIENTE
            # =================================================

            "cac:AccountingCustomerParty": {

                "cac:Party": {

                    "cac:PartyIdentification": {

                        "cbc:ID": {

                            "_attributes": {
                                "schemeID": customer_scheme_id
                            },

                            "_text": documento
                        }
                    },

                    "cac:PartyLegalEntity": {

                        "cbc:RegistrationName": {

                            "_text": (
                                cliente.nombre_razon_social
                            )
                        }
                    }
                }
            },


            # =================================================
            # IGV
            # =================================================

            "cac:TaxTotal": {

                "cbc:TaxAmount": {

                    "_attributes": {
                        "currencyID": "PEN"
                    },

                    "_text": f"{impuestos:.2f}"
                },

                "cac:TaxSubtotal": [

                    {

                        "cbc:TaxableAmount": {

                            "_attributes": {
                                "currencyID": "PEN"
                            },

                            "_text": f"{subtotal:.2f}"
                        },

                        "cbc:TaxAmount": {

                            "_attributes": {
                                "currencyID": "PEN"
                            },

                            "_text": f"{impuestos:.2f}"
                        },

                        "cac:TaxCategory": {

                            "cac:TaxScheme": {

                                "cbc:ID": {
                                    "_text": "1000"
                                },

                                "cbc:Name": {
                                    "_text": "IGV"
                                },

                                "cbc:TaxTypeCode": {
                                    "_text": "VAT"
                                }
                            }
                        }
                    }
                ]
            },


            # =================================================
            # TOTAL
            # =================================================

            "cac:LegalMonetaryTotal": {

                "cbc:PayableAmount": {

                    "_attributes": {
                        "currencyID": "PEN"
                    },

                    "_text": f"{total:.2f}"
                }
            },


            # =================================================
            # DETALLES
            # =================================================

            "cac:CreditNoteLine": []
        }


        # ====================================================
        # 14. AGREGAR LÍNEAS
        # ====================================================

        for indice, detalle in enumerate(
            datos.detalles,
            start=1
        ):

            cantidad = Decimal(
                str(detalle.cantidad)
            )

            detalle_total = Decimal(
                str(detalle.total)
            )

            detalle_impuesto = Decimal(
                str(detalle.impuesto)
            )

            detalle_base = (
                detalle_total
                - detalle_impuesto
            )


            if cantidad != 0:

                precio_unitario = (
                    detalle_base / cantidad
                )

                precio_venta = (
                    detalle_total / cantidad
                )

            else:

                precio_unitario = Decimal("0")

                precio_venta = Decimal("0")


            linea = {

                "cbc:ID": {
                    "_text": str(indice)
                },


                "cbc:CreditedQuantity": {

                    "_attributes": {
                        "unitCode": "NIU"
                    },

                    "_text": str(cantidad)
                },


                "cbc:LineExtensionAmount": {

                    "_attributes": {
                        "currencyID": "PEN"
                    },

                    "_text": (
                        f"{detalle_base:.2f}"
                    )
                },


                "cac:PricingReference": {

                    "cac:AlternativeConditionPrice": {

                        "cbc:PriceAmount": {

                            "_attributes": {
                                "currencyID": "PEN"
                            },

                            "_text": (
                                f"{precio_venta:.2f}"
                            )
                        },

                        "cbc:PriceTypeCode": {
                            "_text": "01"
                        }
                    }
                },


                "cac:TaxTotal": {

                    "cbc:TaxAmount": {

                        "_attributes": {
                            "currencyID": "PEN"
                        },

                        "_text": (
                            f"{detalle_impuesto:.2f}"
                        )
                    },

                    "cac:TaxSubtotal": [

                        {

                            "cbc:TaxableAmount": {

                                "_attributes": {
                                    "currencyID": "PEN"
                                },

                                "_text": (
                                    f"{detalle_base:.2f}"
                                )
                            },

                            "cbc:TaxAmount": {

                                "_attributes": {
                                    "currencyID": "PEN"
                                },

                                "_text": (
                                    f"{detalle_impuesto:.2f}"
                                )
                            },

                            "cac:TaxCategory": {

                                "cbc:Percent": {
                                    "_text": "18"
                                },

                                "cbc:TaxExemptionReasonCode": {
                                    "_text": "10"
                                },

                                "cac:TaxScheme": {

                                    "cbc:ID": {
                                        "_text": "1000"
                                    },

                                    "cbc:Name": {
                                        "_text": "IGV"
                                    },

                                    "cbc:TaxTypeCode": {
                                        "_text": "VAT"
                                    }
                                }
                            }
                        }
                    ]
                },


                "cac:Item": {

                    "cbc:Description": {

                        "_text": (
                            detalle.descripcion
                        )
                    }
                },


                "cac:Price": {

                    "cbc:PriceAmount": {

                        "_attributes": {
                            "currencyID": "PEN"
                        },

                        "_text": (
                            f"{precio_unitario:.10f}"
                        )
                    }
                }
            }


            document_body[
                "cac:CreditNoteLine"
            ].append(linea)


        # ====================================================
        # 15. ENVIAR A APISUNAT
        # ====================================================

        sunat = SunatService()

        try:

            respuesta_sunat = (
                sunat.enviar_comprobante(

                    file_name=file_name,

                    document_body=document_body,

                    customer_email=(
                        cliente.email
                        if getattr(
                            cliente,
                            "email",
                            None
                        )
                        else None
                    )
                )
            )

        except Exception as error_sunat:

            # ================================================
            # LA NOTA YA ESTÁ GUARDADA EN BD
            # ================================================

            nota.estado_sunat = "Pendiente"

            nota.codigo_sunat = "ERROR"

            nota.respuesta_sunat = json.dumps(
                {
                    "error": str(error_sunat)
                },
                ensure_ascii=False
            )

            nota.fecha_envio_sunat = datetime.now()

            db.commit()

            db.refresh(nota)

            print(
                "\n"
                "====================================================\n"
                "ERROR AL ENVIAR NOTA DE CRÉDITO A APISUNAT\n"
                "====================================================\n"
                f"{repr(error_sunat)}\n"
                "====================================================\n"
            )

            return nota


        # ====================================================
        # 16. INTERPRETAR RESPUESTA APISUNAT
        # ====================================================

        estado_api = ""
        faults = []

        if isinstance(
            respuesta_sunat,
            dict
        ):

            estado_api = str(
                respuesta_sunat.get(
                    "status",
                    ""
                )
            ).upper()
            faults = respuesta_sunat.get("faults") or []

        # ====================================================
        # 17. MAPEAR ESTADO APISUNAT
        # ====================================================

        if estado_api == "ACEPTADO":

            nota.estado_sunat = "Aceptado"

        elif estado_api == "RECHAZADO" or estado_api == "EXCEPCION" or len(faults) > 0:

            nota.estado_sunat = "Rechazado"

        elif estado_api == "ANULADO":

            nota.estado_sunat = "Anulado"

        else:

            # APISUNAT puede devolver PENDIENTE
            nota.estado_sunat = "Pendiente"


        # ====================================================
        # 18. GUARDAR RESPUESTA APISUNAT
        # ====================================================

        nota.fecha_envio_sunat = datetime.now()

        nota.respuesta_sunat = json.dumps(
            respuesta_sunat,
            ensure_ascii=False
        )


        if isinstance(
            respuesta_sunat,
            dict
        ):

            if faults and len(faults) > 0:
                f = faults[0]
                fcode = f.get("faultcode", {}).get("_text", "") if isinstance(f.get("faultcode"), dict) else str(f.get("faultcode", ""))
                nota.codigo_sunat = fcode or "ERROR_SUNAT"
            else:
                codigo = (
                    respuesta_sunat.get(
                        "codigo"
                    )
                    or respuesta_sunat.get(
                        "code"
                    )
                    or respuesta_sunat.get(
                        "status"
                    )
                )

                if codigo:
                    nota.codigo_sunat = str(
                        codigo
                    )


        # ====================================================
        # 19. GUARDAR ESTADO FINAL
        # ====================================================

        db.commit()

        db.refresh(nota)

        return nota


    # ========================================================
    # ERROR HTTP CONTROLADO
    # ========================================================

    except HTTPException:

        db.rollback()

        raise


    # ========================================================
    # ERROR DE INTEGRIDAD DE BASE DE DATOS
    # ========================================================

    except IntegrityError as error:

        db.rollback()

        print(
            "\n"
            "====================================================\n"
            "ERROR DE INTEGRIDAD - NOTA DE CRÉDITO\n"
            "====================================================\n"
            f"ERROR: {repr(error)}\n"
            f"ORIGEN: {repr(error.orig)}\n"
            f"DETALLE: "
            f"{getattr(error.orig, 'detail', None)}\n"
            f"CONSTRAINT: "
            f"{getattr(error.orig, 'constraint_name', None)}\n"
            f"COLUMNA: "
            f"{getattr(error.orig, 'column_name', None)}\n"
            f"TABLA: "
            f"{getattr(error.orig, 'table_name', None)}\n"
            "====================================================\n"
        )

        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": (
                    "No se pudo registrar "
                    "la nota de crédito."
                ),

                "error": str(
                    error.orig
                ),

                "detalle": getattr(
                    error.orig,
                    "detail",
                    None
                ),

                "constraint": getattr(
                    error.orig,
                    "constraint_name",
                    None
                ),

                "columna": getattr(
                    error.orig,
                    "column_name",
                    None
                ),

                "tabla": getattr(
                    error.orig,
                    "table_name",
                    None
                )
            }
        )


    # ========================================================
    # ERROR GENERAL
    # ========================================================

    except Exception as error:

        db.rollback()

        print(
            "\n"
            "====================================================\n"
            "ERROR REAL - NOTA DE CRÉDITO\n"
            "====================================================\n"
            f"ERROR: {repr(error)}\n"
            "====================================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail={
                "mensaje": (
                    "Ocurrió un error al registrar "
                    "la nota de crédito."
                ),

                "error": str(error)
            }
        )