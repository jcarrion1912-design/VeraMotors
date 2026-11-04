from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import date, datetime, timedelta

from app.core.security import (
    ROL_TECNICO,
    get_current_user,
    nombre_rol,
    personal_administrativo,
    solo_admin,
)
from app.database import get_db
from app.models.factura import Factura
from app.models.inventario import Inventario
from app.models.ods import OrdenServicio
from app.models.usuario import Usuario
from app.models.asistencia import Asistencia
from app.models.cita import Cita
from app.models.pago import Pago
from app.models.rol import Rol

router = APIRouter()


@router.get("/dashboard", dependencies=[Depends(personal_administrativo)])
def obtener_dashboard_metricas(db: Session = Depends(get_db)):
    """
    Retorna métricas principales para el dashboard
    """
    
    # Cobros registrados (últimos 30 días)
    fecha_hace_30 = datetime.now() - timedelta(days=30)
    ingresos_recientes = db.query(func.sum(Pago.monto)).filter(
        Pago.fecha >= fecha_hace_30
    ).scalar() or Decimal("0")

    # Órdenes de servicio completadas
    ods_completadas = db.query(func.count(OrdenServicio.ods_id)).filter(
        OrdenServicio.estado_actual.in_(["Archivados", "Completado"])
    ).scalar() or 0

    ods_en_taller = db.query(func.count(OrdenServicio.ods_id)).filter(
        ~OrdenServicio.estado_actual.in_(["Archivados", "Completado"])
    ).scalar() or 0

    citas_hoy = db.query(func.count(Cita.cita_id)).filter(
        func.date(Cita.fecha_hora_inicio) == date.today(),
        Cita.estado != "Anulada",
    ).scalar() or 0

    primer_dia_mes = date.today().replace(day=1)
    asistencias_mes = db.query(func.count(Asistencia.asistencia_id)).filter(
        Asistencia.fecha >= primer_dia_mes
    ).scalar() or 0

    # Inventario stock bajo
    stock_bajo = db.query(func.count(Inventario.item_id)).filter(
        Inventario.stock_actual <= Inventario.stock_minimo
    ).scalar() or 0

    # Valor total de inventario
    valor_inventario = db.query(
        func.sum(Inventario.stock_actual * Inventario.precio_venta)
    ).scalar() or Decimal("0")

    return {
        "ventas_totales": float(ingresos_recientes),
        "ingresos_ultimos_30_dias": float(ingresos_recientes),
        "ods_completadas": ods_completadas,
        "ods_en_taller": ods_en_taller,
        "citas_hoy": citas_hoy,
        "asistencias_mes": asistencias_mes,
        "items_stock_bajo": stock_bajo,
        "valor_inventario": float(valor_inventario),
        "fecha_actualizacion": datetime.now().isoformat()
    }


@router.get("/ventasPeriodo", dependencies=[Depends(personal_administrativo)])
def obtener_ventas_periodo(
    fecha_inicio: str,
    fecha_fin: str,
    db: Session = Depends(get_db)
):
    """
    Retorna ventas en un período específico
    """
    try:
        inicio = datetime.fromisoformat(fecha_inicio)
        fin = datetime.fromisoformat(fecha_fin)
    except ValueError:
        return {"error": "Formato de fecha inválido. Use ISO format"}

    ventas = db.query(Factura).filter(
        Factura.fecha_emision.between(inicio, fin),
        Factura.estado_pago != "Anulado",
    ).all()

    total = sum(float(f.total) for f in ventas)

    return {
        "periodo": {
            "inicio": fecha_inicio,
            "fin": fecha_fin
        },
        "cantidad_facturas": len(ventas),
        "total_ventas": total,
        "promedio_venta": total / len(ventas) if ventas else 0
    }


@router.get("/rentabilidad", dependencies=[Depends(solo_admin)])
def obtener_rentabilidad(db: Session = Depends(get_db)):
    """
    Retorna análisis de rentabilidad
    """
    # Ingresos totales
    ingresos = db.query(func.sum(Factura.total)).scalar() or Decimal("0")

    # Costos (suma de costos en inventario)
    costos = db.query(
        func.sum(Inventario.stock_actual * Inventario.costo_compra)
    ).scalar() or Decimal("0")

    ingresos_float = float(ingresos)
    costos_float = float(costos)
    margen = ((ingresos_float - costos_float) / ingresos_float * 100) if ingresos_float > 0 else 0

    return {
        "ingresos_totales": ingresos_float,
        "costos_totales": costos_float,
        "margen_bruto": margen,
        "ganancia": ingresos_float - costos_float
    }


@router.get("/inventario-resumen", dependencies=[Depends(personal_administrativo)])
def obtener_inventario_resumen(db: Session = Depends(get_db)):
    """
    Retorna resumen del inventario
    """
    items_totales = db.query(func.count(Inventario.item_id)).scalar() or 0
    stock_bajo = db.query(func.count(Inventario.item_id)).filter(
        Inventario.stock_actual <= Inventario.stock_minimo
    ).scalar() or 0

    valor_total = db.query(
        func.sum(Inventario.stock_actual * Inventario.precio_venta)
    ).scalar() or Decimal("0")

    return {
        "items_totales": items_totales,
        "items_stock_bajo": stock_bajo,
        "valor_inventario": float(valor_total),
        "porcentaje_bajo": (stock_bajo / items_totales * 100) if items_totales > 0 else 0
    }


@router.get("/asistencia-resumen", dependencies=[Depends(personal_administrativo)])
def obtener_asistencia_resumen(db: Session = Depends(get_db)):
    """
    Retorna resumen de asistencia del mes
    """
    hoy = datetime.now().date()
    primer_dia = hoy.replace(day=1)

    asistencias = db.query(Asistencia).filter(
        Asistencia.fecha >= primer_dia
    ).all()

    puntual = sum(1 for a in asistencias if a.estado == "Puntual")
    tardanzas = sum(1 for a in asistencias if a.estado == "Tardanza")
    faltas = sum(1 for a in asistencias if a.estado == "Inasistencia")

    return {
        "puntual": puntual,
        "tardanzas": tardanzas,
        "faltas": faltas,
        "total": len(asistencias)
    }


@router.get("/tecnicos-desempenio")
def obtener_tecnicos_desempenio(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    Retorna desempeño de técnicos
    """
    consulta = db.query(Usuario).join(Rol, Rol.rol_id == Usuario.rol_id).filter(
        Rol.nombre == "Técnico Automotriz",
        Usuario.activo.is_(True),
    )

    # Un técnico solo ve su propio desempeño.
    if nombre_rol(usuario_actual) == ROL_TECNICO:
        consulta = consulta.filter(Usuario.user_id == usuario_actual.user_id)

    tecnicos = consulta.all()

    desempenio = []
    for tecnico in tecnicos:
        ods = db.query(func.count(OrdenServicio.ods_id)).filter(
            OrdenServicio.tecnico_id == tecnico.user_id
        ).scalar() or 0

        ods_completadas = db.query(func.count(OrdenServicio.ods_id)).filter(
            OrdenServicio.tecnico_id == tecnico.user_id,
            OrdenServicio.estado_actual == "Completado"
        ).scalar() or 0

        desempenio.append({
            "tecnico_id": tecnico.user_id,
            "nombre": tecnico.nombre,
            "ods_totales": ods,
            "ods_completadas": ods_completadas,
            "tasa_completacion": (ods_completadas / ods * 100) if ods > 0 else 0
        })

    return desempenio
