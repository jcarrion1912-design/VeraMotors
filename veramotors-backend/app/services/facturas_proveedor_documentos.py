import os
import re
from datetime import datetime
from decimal import Decimal
from html import escape
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader

from app.config.settings import settings


MAX_PDF_BYTES = 25 * 1024 * 1024
MAX_PDF_PAGES = 100


def extraer_datos_comprobante(contenido: bytes) -> dict:
    lector = PdfReader(BytesIO(contenido), strict=False)
    if lector.is_encrypted:
        raise ValueError("El PDF está protegido y no se puede leer.")
    if len(lector.pages) > MAX_PDF_PAGES:
        raise ValueError(f"El PDF supera el límite de {MAX_PDF_PAGES} páginas.")

    texto = "\n".join(pagina.extract_text() or "" for pagina in lector.pages)
    campos = {}

    ruc = re.search(r"\bR\.?\s*U\.?\s*C\.?\s*[:\-]?\s*(\d{11})\b", texto, re.IGNORECASE)
    if ruc:
        campos["ruc"] = ruc.group(1)

    serie_numero = re.search(r"\b([FBET]\d{3,5})\s*[-–]\s*(\d{1,12})\b", texto, re.IGNORECASE)
    if serie_numero:
        campos["serie"] = serie_numero.group(1).upper()
        campos["numero"] = serie_numero.group(2)

    texto_mayusculas = texto.upper()
    if "NOTA DE CRÉDITO" in texto_mayusculas or "NOTA DE CREDITO" in texto_mayusculas:
        campos["tipo_comprobante"] = "Nota de Crédito"
    elif "NOTA DE DÉBITO" in texto_mayusculas or "NOTA DE DEBITO" in texto_mayusculas:
        campos["tipo_comprobante"] = "Nota de Débito"
    elif "RECIBO POR HONORARIOS" in texto_mayusculas:
        campos["tipo_comprobante"] = "Recibo por Honorarios"
    elif "BOLETA" in texto_mayusculas:
        campos["tipo_comprobante"] = "Boleta"
    elif "FACTURA" in texto_mayusculas:
        campos["tipo_comprobante"] = "Factura"

    razon_social = re.search(
        r"(?:RAZ[ÓO]N\s+SOCIAL(?:\s+DEL\s+EMISOR)?|EMISOR)\s*[:\-]\s*([^\r\n]{3,200})",
        texto,
        re.IGNORECASE,
    )
    if razon_social:
        campos["razon_social"] = razon_social.group(1).strip()

    fecha = re.search(
        r"(?:FECHA\s+DE\s+EMISI[ÓO]N|FECHA\s+EMISI[ÓO]N|EMISI[ÓO]N)\s*[:\-]?\s*"
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})",
        texto,
        re.IGNORECASE,
    )
    if fecha:
        try:
            formato = "%Y-%m-%d" if "-" in fecha.group(1) and len(fecha.group(1).split("-")[0]) == 4 else None
            if formato:
                fecha_emision = datetime.strptime(fecha.group(1), formato)
            else:
                separador = "/" if "/" in fecha.group(1) else "-"
                fecha_emision = datetime.strptime(fecha.group(1), f"%d{separador}%m{separador}%Y")
            campos["fecha_emision"] = fecha_emision.date().isoformat()
        except ValueError:
            pass

    if re.search(r"(?:US\$|\bUSD\b|\bD[ÓO]LARES\b)", texto, re.IGNORECASE):
        campos["moneda"] = "USD"
    elif re.search(r"(?:S\/|\bSOLES\b|\bPEN\b)", texto, re.IGNORECASE):
        campos["moneda"] = "PEN"

    patrones_importe = {
        "subtotal": r"(?:SUB\s*TOTAL|OP(?:ERACIONES)?\s+GRAVADAS)\s*[:\-]?\s*",
        "igv": r"\bIGV\b\s*[:\-]?\s*",
        "total": r"(?:IMPORTE\s+TOTAL|TOTAL\s+A\s+PAGAR|TOTAL\s+DEL\s+COMPROBANTE|\bTOTAL\b)\s*[:\-]?\s*",
    }
    for campo, patron in patrones_importe.items():
        coincidencia = re.search(
            patron + r"(?:S\/|US\$|PEN|USD)?\s*([\d.,]+)",
            texto,
            re.IGNORECASE,
        )
        if coincidencia:
            campos[campo] = _parsear_importe(coincidencia.group(1))

    return {
        **campos,
        "texto_extraido": bool(texto.strip()),
        "ocr_requerido": not bool(texto.strip()),
        "advertencia": "Datos leídos del archivo para revisión; la lectura no valida autenticidad ni vigencia del comprobante.",
    }


def _parsear_importe(valor: str) -> str:
    normalizado = valor.strip()
    if "," in normalizado and "." in normalizado:
        decimal = "," if normalizado.rfind(",") > normalizado.rfind(".") else "."
        separador_miles = "." if decimal == "," else ","
        normalizado = normalizado.replace(separador_miles, "")
        normalizado = normalizado.replace(decimal, ".")
    elif "," in normalizado:
        normalizado = normalizado.replace(".", "").replace(",", ".")
    return str(Decimal(normalizado).quantize(Decimal("0.01")))


def ruta_pdf_original(factura_id: int) -> Path:
    directorio = os.environ.get(
        "FACTURAS_PROVEEDOR_STORAGE_DIR",
        settings.FACTURAS_PROVEEDOR_STORAGE_DIR,
    )
    raiz = Path(directorio)
    if not raiz.is_absolute():
        raiz = Path(__file__).resolve().parents[2] / raiz
    return raiz.resolve() / f"{factura_id}.pdf"


def generar_pdf_interno(factura) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Paragraph,
        Flowable,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = BytesIO()
    documento = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Registro interno {codigo_interno(factura.factura_proveedor_id)}",
    )
    estilos = getSampleStyleSheet()
    estilos.add(ParagraphStyle(
        name="VMTitle",
        parent=estilos["Title"],
        textColor=colors.HexColor("#134455"),
        alignment=TA_RIGHT,
        fontSize=15,
        leading=18,
    ))
    estilos.add(ParagraphStyle(
        name="VMNotice",
        parent=estilos["Normal"],
        alignment=TA_CENTER,
        textColor=colors.HexColor("#8a3c12"),
        fontSize=9,
    ))
    estilo_celda = ParagraphStyle("VMTabla", parent=estilos["BodyText"], fontSize=8, leading=10)

    def p(valor, estilo=estilo_celda):
        return Paragraph(escape(str(valor if valor is not None else "—")), estilo)

    def etiqueta(valor):
        return Paragraph(f"<b>{escape(str(valor))}</b>", estilo_celda)

    moneda = factura.moneda or "PEN"

    def importe(valor):
        return f"{moneda} {Decimal(str(valor or 0)):,.2f}"

    def fecha(valor):
        return valor.strftime("%d/%m/%Y") if valor else "—"

    codigo = codigo_interno(factura.factura_proveedor_id)

    class MarcaVeramotors(Flowable):
        def __init__(self):
            super().__init__()
            self.width = 18 * mm
            self.height = 18 * mm

        def draw(self):
            self.canv.setFillColor(colors.HexColor("#134455"))
            self.canv.roundRect(0, 0, self.width, self.height, 3 * mm, stroke=0, fill=1)
            self.canv.setStrokeColor(colors.HexColor("#86b8c7"))
            self.canv.setLineWidth(1.2 * mm)
            self.canv.arc(3 * mm, 3 * mm, 15 * mm, 15 * mm, startAng=25, extent=130)
            self.canv.setStrokeColor(colors.HexColor("#f2851b"))
            self.canv.line(9 * mm, 8 * mm, 13 * mm, 13 * mm)
            self.canv.setFillColor(colors.HexColor("#f2851b"))
            self.canv.circle(9 * mm, 8 * mm, 1.2 * mm, stroke=0, fill=1)

    encabezado = Table(
        [[
            MarcaVeramotors(),
            Paragraph("<b>VERAMOTORS S.A.C.</b>", estilos["Heading2"]),
            Paragraph(f"<b>{codigo}</b>", estilos["VMTitle"]),
        ]],
        colWidths=[18 * mm, 85 * mm, 75 * mm],
    )
    encabezado.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#134455")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    datos = [
        [etiqueta("Proveedor"), p(factura.proveedor.razon_social), etiqueta("RUC"), p(factura.proveedor.ruc)],
        [etiqueta("Tipo"), p(factura.tipo_comprobante), etiqueta("Serie - Número"), p(f"{factura.serie}-{factura.numero}")],
        [etiqueta("Emisión"), p(fecha(factura.fecha_emision)), etiqueta("Vencimiento"), p(fecha(factura.fecha_vencimiento))],
        [etiqueta("Compra relacionada"), p(factura.compra.codigo_compra if factura.compra else "—"), etiqueta("Estado de pago"), p(factura.estado)],
    ]
    tabla_datos = Table(datos, colWidths=[32 * mm, 59 * mm, 32 * mm, 55 * mm])
    tabla_datos.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef3f5")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#eef3f5")),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5da")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    lineas = [[etiqueta("Descripción"), etiqueta("Cantidad"), etiqueta("Precio unit."), etiqueta("Impuesto"), etiqueta("Total")]]
    for detalle in factura.detalles:
        lineas.append([
            p(detalle.descripcion),
            p(detalle.cantidad),
            p(importe(detalle.precio_unitario)),
            p(importe(detalle.impuesto)),
            p(importe(detalle.total)),
        ])
    tabla_lineas = Table(lineas, colWidths=[66 * mm, 20 * mm, 30 * mm, 28 * mm, 34 * mm], repeatRows=1)
    tabla_lineas.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#134455")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5da")),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    totales = Table([
        [etiqueta("Subtotal"), p(importe(factura.subtotal))],
        [etiqueta("IGV"), p(importe(factura.igv))],
        [etiqueta("Total"), p(importe(factura.total))],
    ], colWidths=[30 * mm, 36 * mm])
    totales.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, 2), (-1, 2), 0.8, colors.HexColor("#134455")),
    ]))

    historia = [
        encabezado,
        Spacer(1, 5 * mm),
        Paragraph("REGISTRO INTERNO DE FACTURA DE PROVEEDOR", estilos["Heading2"]),
        Paragraph("Representación administrativa interna de VeraMotors. No es un comprobante electrónico oficial emitido por SUNAT.", estilos["VMNotice"]),
        Spacer(1, 5 * mm),
        tabla_datos,
        Spacer(1, 7 * mm),
        tabla_lineas,
        Spacer(1, 5 * mm),
        Table([[Spacer(1, 1), totales]], colWidths=[112 * mm, 66 * mm]),
    ]
    if factura.observaciones:
        historia.extend([Spacer(1, 5 * mm), p(f"Observaciones: {factura.observaciones}")])

    documento.build(historia)
    return buffer.getvalue()


def codigo_interno(factura_id: int) -> str:
    return f"FPROV-{factura_id:04d}"
