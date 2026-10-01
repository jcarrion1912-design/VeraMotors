import json
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.config.settings import settings

from app.models.factura import Factura
from app.models.detalle_factura import DetalleFactura
from app.models.cliente import Cliente
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.configuracion_correlativo import ConfiguracionCorrelativo

from app.schemas.facturacion import (
    FacturaCreate,
    FacturaResponse,
    PagoFacturaRequest
)

from app.services.sunat_service import SunatService


router = APIRouter()


# ============================================================
# LISTAR FACTURAS
# ============================================================

@router.get("", response_model=list[FacturaResponse])
def listar_facturas(
    db: Session = Depends(get_db)
):
    return db.query(Factura).all()


# ============================================================
# OBTENER FACTURA
# ============================================================

@router.get("/{factura_id}/estado-sunat")
def consultar_estado_sunat_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    factura = (
        db.query(Factura)
        .filter(Factura.factura_id == factura_id)
        .first()
    )

    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    try:
        if not factura.respuesta_sunat:
            raise HTTPException(
                status_code=400,
                detail="La factura todavía no tiene una respuesta de APISUNAT."
            )

        try:
            respuesta_guardada = json.loads(factura.respuesta_sunat)
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
                detail=(
                    "No se encontró documentId en la respuesta guardada de APISUNAT. "
                    "Este comprobante debe volver a enviarse para poder consultar su estado."
                )
            )

        respuesta = SunatService().consultar_estado(str(document_id))
        estado_api = str(respuesta.get("status", "")).strip().upper() if isinstance(respuesta, dict) else ""

        if estado_api == "ACEPTADO":
            factura.estado_sunat = "Aceptado"
        elif estado_api == "RECHAZADO":
            factura.estado_sunat = "Rechazado"
        elif estado_api == "ANULADO":
            factura.estado_sunat = "Anulado"
        else:
            # APISUNAT usa PENDIENTE/EXCEPCION además de los estados finales.
            factura.estado_sunat = "Pendiente"

        factura.codigo_sunat = estado_api or factura.codigo_sunat or "PENDIENTE"
        factura.respuesta_sunat = json.dumps(respuesta, ensure_ascii=False)
        factura.fecha_envio_sunat = datetime.now()

        db.commit()
        db.refresh(factura)

        return {
            "factura_id": factura.factura_id,
            "numero_comprobante": factura.numero_comprobante,
            "estado_sunat": factura.estado_sunat,
            "codigo_sunat": factura.codigo_sunat,
            "respuesta_sunat": respuesta,
            "fecha_envio_sunat": factura.fecha_envio_sunat
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo consultar el estado en APISUNAT: {error}"
        )


@router.get("/{factura_id}", response_model=FacturaResponse)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    factura = (
        db.query(Factura)
        .filter(Factura.factura_id == factura_id)
        .first()
    )

    if not factura:
        raise HTTPException(
            status_code=404,
            detail="Factura no encontrada"
        )

    return factura


# ============================================================
# CREAR FACTURA / BOLETA
# ============================================================

@router.post("", response_model=FacturaResponse, status_code=201)
def crear_factura(
    datos: FacturaCreate,
    db: Session = Depends(get_db)
):

    try:

        # ========================================================
        # 1. TIPOS DE COMPROBANTE
        # ========================================================

        tipos_validos = {
            "Factura Electrónica": {
                "tipo": "FACTURA",
                "codigo": "01"
            },
            "Boleta Electrónica": {
                "tipo": "BOLETA",
                "codigo": "03"
            }
        }

        if datos.tipo_comprobante not in tipos_validos:
            raise HTTPException(
                status_code=400,
                detail="Tipo de comprobante no válido"
            )

        configuracion = tipos_validos[
            datos.tipo_comprobante
        ]

        tipo_correlativo = configuracion["tipo"]
        codigo_documento = configuracion["codigo"]

        # ========================================================
        # 2. BUSCAR CLIENTE
        # ========================================================

        cliente = (
            db.query(Cliente)
            .filter(
                Cliente.cliente_id == datos.cliente_id
            )
            .first()
        )

        if not cliente:
            raise HTTPException(
                status_code=404,
                detail="Cliente no encontrado"
            )

        # ========================================================
        # 3. VALIDAR DOCUMENTO DEL CLIENTE
        # ========================================================

        documento = cliente.documento_identidad

        if not documento:
            raise HTTPException(
                status_code=400,
                detail="El cliente no tiene documento de identidad registrado"
            )

        documento = str(documento).strip()

        if codigo_documento == "01":

            if len(documento) != 11:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Para una Factura Electrónica "
                        "el cliente debe tener RUC de 11 dígitos"
                    )
                )

        elif codigo_documento == "03":

            if len(documento) != 8:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Para una Boleta Electrónica "
                        "el cliente debe tener DNI de 8 dígitos"
                    )
                )

        # ========================================================
        # 4. OBTENER CORRELATIVO
        # ========================================================

        correlativo_config = (
            db.query(ConfiguracionCorrelativo)
            .filter(
                ConfiguracionCorrelativo.tipo_documento
                == tipo_correlativo
            )
            .filter(
                ConfiguracionCorrelativo.activo == True
            )
            .with_for_update()
            .first()
        )

        if not correlativo_config:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No existe configuración de correlativo "
                    f"para {tipo_correlativo}"
                )
            )

        # Tu modelo utiliza:
        # prefijo
        # siguiente_correlativo

        serie = correlativo_config.prefijo

        correlativo = (
            correlativo_config.siguiente_correlativo
        )

        numero_comprobante = (
            f"{serie}-{correlativo:08d}"
        )

        # ========================================================
        # 5. CREAR FACTURA / BOLETA
        # ========================================================

        factura = Factura(
            ods_id=None,
            cliente_id=datos.cliente_id,
            tipo_comprobante=datos.tipo_comprobante,
            serie=serie,
            correlativo=correlativo,
            numero_comprobante=numero_comprobante,
            fecha_emision=datetime.now(),
            fecha_vencimiento=datos.fecha_vencimiento,
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

        # ========================================================
        # 6. CREAR DETALLES
        # ========================================================

        for detalle in datos.detalles:

            detalle_factura = DetalleFactura(
                factura_id=factura.factura_id,
                item_id=detalle.item_id,
                descripcion=detalle.descripcion,
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                descuento=detalle.descuento,
                impuesto=detalle.impuesto,
                total=detalle.total
            )

            db.add(detalle_factura)

        total_factura = Decimal(str(datos.total))
        estado_inicial = "Pagada" if total_factura == 0 else "Pendiente"
        if total_factura == 0:
            factura.estado_pago = "Pagado"
        db.add(CuentaPorCobrar(
            factura_id=factura.factura_id,
            cliente_id=factura.cliente_id,
            fecha_emision=factura.fecha_emision,
            fecha_vencimiento=datos.fecha_vencimiento or factura.fecha_emision,
            monto_total=total_factura,
            monto_pagado=Decimal("0.00"),
            saldo=total_factura,
            estado=estado_inicial,
        ))

        # ========================================================
        # 7. ACTUALIZAR CORRELATIVO
        # ========================================================

        correlativo_config.siguiente_correlativo = (
            correlativo + 1
        )

        # Guardamos la factura y el nuevo correlativo.
        db.commit()

        db.refresh(factura)

        # ========================================================
        # 8. PREPARAR DATOS PARA APISUNAT
        # ========================================================

        file_name = (
            f"{settings.SUNAT_RUC}-"
            f"{codigo_documento}-"
            f"{serie}-"
            f"{correlativo:08d}"
        )

        subtotal = Decimal(
            str(datos.subtotal)
        )

        impuestos = Decimal(
            str(datos.impuestos)
        )

        total = Decimal(
            str(datos.total)
        )

        # ========================================================
        # 9. DATOS DEL CLIENTE
        # ========================================================

        if codigo_documento == "01":
            customer_scheme_id = "6"
        else:
            customer_scheme_id = "1"

        # ========================================================
        # 10. CONSTRUIR DOCUMENT BODY
        # ========================================================

        document_body = {

            "cbc:UBLVersionID": {
                "_text": "2.1"
            },

            "cbc:CustomizationID": {
                "_text": "2.0"
            },

            "cbc:ID": {
                "_text": numero_comprobante
            },

            "cbc:IssueDate": {
                "_text": datetime.now().strftime(
                    "%Y-%m-%d"
                )
            },

            "cbc:IssueTime": {
                "_text": datetime.now().strftime(
                    "%H:%M:%S"
                )
            },

            "cbc:InvoiceTypeCode": {
                "_text": codigo_documento,
                "_attributes": {
                    "listID": "0101"
                }
            },

            "cbc:DocumentCurrencyCode": {
                "_text": "PEN"
            },

            "cbc:Note": {
                "_text": (
                    f"TOTAL {total:.2f} SOLES"
                )
            },

            # ====================================================
            # PROVEEDOR
            # ====================================================

            "cac:AccountingSupplierParty": {

                "cac:Party": {

                    "cac:PartyIdentification": {

                        "cbc:ID": {

                            "_text": settings.SUNAT_RUC,

                            "_attributes": {
                                "schemeID": "6"
                            }
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
                                "_text": getattr(settings, "SUNAT_CODIGO_ESTABLECIMIENTO", "0000")
                            }
                        }
                    }
                }
            },

            # ====================================================
            # CLIENTE
            # ====================================================

            "cac:AccountingCustomerParty": {

                "cac:Party": {

                    "cac:PartyIdentification": {

                        "cbc:ID": {

                            "_text": documento,

                            "_attributes": {
                                "schemeID":
                                    customer_scheme_id
                            }
                        }
                    },

                    "cac:PartyLegalEntity": {

                        "cbc:RegistrationName": {

                            "_text":
                                cliente.nombre_razon_social
                        }
                    }
                }
            },

            # ====================================================
            # IGV
            # ====================================================

            "cac:TaxTotal": {

                "cbc:TaxAmount": {

                    "_text": f"{impuestos:.2f}",

                    "_attributes": {
                        "currencyID": "PEN"
                    }
                },

                "cac:TaxSubtotal": {

                    "cbc:TaxableAmount": {

                        "_text": f"{subtotal:.2f}",

                        "_attributes": {
                            "currencyID": "PEN"
                        }
                    },

                    "cbc:TaxAmount": {

                        "_text": f"{impuestos:.2f}",

                        "_attributes": {
                            "currencyID": "PEN"
                        }
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
            },

            # ====================================================
            # TOTALES
            # ====================================================

            "cac:LegalMonetaryTotal": {

                "cbc:LineExtensionAmount": {

                    "_text": f"{subtotal:.2f}",

                    "_attributes": {
                        "currencyID": "PEN"
                    }
                },

                "cbc:TaxInclusiveAmount": {

                    "_text": f"{total:.2f}",

                    "_attributes": {
                        "currencyID": "PEN"
                    }
                },

                "cbc:PayableAmount": {

                    "_text": f"{total:.2f}",

                    "_attributes": {
                        "currencyID": "PEN"
                    }
                }
            },

            # ====================================================
            # FORMA DE PAGO
            # ====================================================

            "cac:PaymentTerms": {

                "cbc:ID": {
                    "_text": "FormaPago"
                },

                "cbc:PaymentMeansID": {

                    "_text": "Contado"
                }
            },

            # ====================================================
            # DETALLES
            # ====================================================

            "cac:InvoiceLine": []
        }

        # ========================================================
        # 11. AGREGAR LÍNEAS
        # ========================================================

        for detalle in datos.detalles:

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
                detalle_total -
                detalle_impuesto
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

                    "_text": str(
                        detalle.item_id or 1
                    )
                },

                "cbc:InvoicedQuantity": {

                    "_text": str(cantidad),

                    "_attributes": {
                        "unitCode": "NIU"
                    }
                },

                "cbc:LineExtensionAmount": {

                    "_text": (
                        f"{detalle_base:.2f}"
                    ),

                    "_attributes": {
                        "currencyID": "PEN"
                    }
                },

                "cac:PricingReference": {

                    "cac:AlternativeConditionPrice": {

                        "cbc:PriceAmount": {

                            "_text": (
                                f"{precio_venta:.2f}"
                            ),

                            "_attributes": {
                                "currencyID": "PEN"
                            }
                        },

                        "cbc:PriceTypeCode": {
                            "_text": "01"
                        }
                    }
                },

                "cac:TaxTotal": {

                    "cbc:TaxAmount": {

                        "_text": (
                            f"{detalle_impuesto:.2f}"
                        ),

                        "_attributes": {
                            "currencyID": "PEN"
                        }
                    },

                    "cac:TaxSubtotal": {

                        "cbc:TaxableAmount": {

                            "_text": (
                                f"{detalle_base:.2f}"
                            ),

                            "_attributes": {
                                "currencyID": "PEN"
                            }
                        },

                        "cbc:TaxAmount": {

                            "_text": (
                                f"{detalle_impuesto:.2f}"
                            ),

                            "_attributes": {
                                "currencyID": "PEN"
                            }
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
                },

                "cac:Item": {

                    "cbc:Description": {

                        "_text":
                            detalle.descripcion
                    }
                },

                "cac:Price": {

                    "cbc:PriceAmount": {

                        "_text": (
                            f"{precio_unitario:.10f}"
                        ),

                        "_attributes": {
                            "currencyID": "PEN"
                        }
                    }
                }
            }

            document_body[
                "cac:InvoiceLine"
            ].append(linea)

        # ========================================================
        # 12. ENVIAR A APISUNAT
        # ========================================================

        sunat = SunatService()

        respuesta_sunat = (
            sunat.enviar_comprobante(
                file_name=file_name,
                document_body=document_body,
                customer_email=cliente.email
            )
        )

        # ========================================================
        # 13. INTERPRETAR RESPUESTA SUNAT
        # ========================================================

        estado_api = ""

        if isinstance(respuesta_sunat, dict):

            estado_api = str(
                respuesta_sunat.get(
                    "status",
                    ""
                )
            ).upper()

        # ========================================================
        # 14. MAPEAR ESTADO APISUNAT A LA BD
        # ========================================================

        if estado_api == "ACEPTADO":

            factura.estado_sunat = "Aceptado"

        elif estado_api == "RECHAZADO":

            factura.estado_sunat = "Rechazado"

        elif estado_api == "ANULADO":

            factura.estado_sunat = "Anulado"

        else:

            # APISUNAT actualmente está devolviendo PENDIENTE.
            factura.estado_sunat = "Pendiente"

        # ========================================================
        # 15. GUARDAR RESPUESTA SUNAT
        # ========================================================

        factura.fecha_envio_sunat = datetime.now()

        factura.respuesta_sunat = json.dumps(
            respuesta_sunat,
            ensure_ascii=False
        )

        if isinstance(
            respuesta_sunat,
            dict
        ):

            codigo = (
                respuesta_sunat.get("codigo")
                or respuesta_sunat.get("code")
                or respuesta_sunat.get("status")
            )

            if codigo:

                factura.codigo_sunat = str(
                    codigo
                )

        db.commit()

        db.refresh(factura)

        return factura

    # ============================================================
    # ERRORES HTTP CONTROLADOS
    # ============================================================

    except HTTPException:

        db.rollback()

        raise

    # ============================================================
    # ERROR REAL
    # ============================================================

    except Exception as e:

        db.rollback()

        print(
            "\n"
            "=============================================\n"
            "ERROR REAL EN FACTURACION\n"
            "=============================================\n"
            f"{repr(e)}\n"
            "=============================================\n"
        )

        raise HTTPException(
            status_code=400,
            detail=f"Error interno: {str(e)}"
        )


# ============================================================
# ACTUALIZAR ESTADO DE PAGO
# ============================================================

@router.patch("/{factura_id}/pago")
def actualizar_estado_pago(
    factura_id: int,
    pago: PagoFacturaRequest,
    db: Session = Depends(get_db)
):
    raise HTTPException(
        status_code=409,
        detail="El estado de pago no se modifica directamente. Registra el cobro en POST /api/pagos.",
    )