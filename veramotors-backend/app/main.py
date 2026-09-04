from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine

import app.models

from app.routers import (
    auth,
    usuarios,
    clientes,
    vehiculos,
    citas,
    inventario,
    cotizaciones,
    ods,
    diagnosticos,
    facturacion,
    asistencia,
    configuracion,
    ia_rag,
    notas_credito,
    notas_debito,
    remisiones,
    cierre_caja,
    compras,
    proveedores,
    bancos,
    reportes
)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REGISTRO DE ROUTERS
# =========================================================

# Autenticación
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Autenticación"]
)


# Usuarios
app.include_router(
    usuarios.router,
    prefix=f"{settings.API_V1_STR}/usuarios",
    tags=["Usuarios"]
)


# Clientes
app.include_router(
    clientes.router,
    prefix=f"{settings.API_V1_STR}/clientes",
    tags=["Clientes"]
)


# Vehículos
app.include_router(
    vehiculos.router,
    prefix=f"{settings.API_V1_STR}/vehiculos",
    tags=["Vehículos"]
)


# Citas
app.include_router(
    citas.router,
    prefix=f"{settings.API_V1_STR}/citas",
    tags=["Citas"]
)


# Inventario
app.include_router(
    inventario.router,
    prefix=f"{settings.API_V1_STR}/inventario",
    tags=["Inventario"]
)


# Cotizaciones
app.include_router(
    cotizaciones.router,
    prefix=f"{settings.API_V1_STR}/cotizaciones",
    tags=["Cotizaciones"]
)


# Órdenes de Servicio
app.include_router(
    ods.router,
    prefix=f"{settings.API_V1_STR}/ods",
    tags=["Órdenes de Servicio"]
)


# Diagnósticos
app.include_router(
    diagnosticos.router,
    prefix=f"{settings.API_V1_STR}/diagnosticos",
    tags=["Diagnósticos"]
)


# Facturación
app.include_router(
    facturacion.router,
    prefix=f"{settings.API_V1_STR}/facturacion",
    tags=["Facturación"]
)


# Asistencia
app.include_router(
    asistencia.router,
    prefix=f"{settings.API_V1_STR}/asistencia",
    tags=["Asistencia RRHH"]
)


# Configuración
app.include_router(
    configuracion.router,
    prefix=f"{settings.API_V1_STR}/configuracion",
    tags=["Configuración"]
)


# IA / RAG
app.include_router(
    ia_rag.router,
    prefix=f"{settings.API_V1_STR}/ia",
    tags=["Asistente IA RAG"]
)

# Notas de Crédito
app.include_router(
    notas_credito.router,
    prefix=f"{settings.API_V1_STR}/notas-credito",
    tags=["Notas de Crédito"]
)

# Notas de Débito
app.include_router(
    notas_debito.router,
    prefix=f"{settings.API_V1_STR}/notas-debito",
    tags=["Notas de Débito"]
)

# Remisiones
app.include_router(
    remisiones.router,
    prefix=f"{settings.API_V1_STR}/remisiones",
    tags=["Remisiones"]
)


# Cierre de Caja
app.include_router(
    cierre_caja.router,
    prefix=f"{settings.API_V1_STR}/cierre-caja",
    tags=["Cierre de Caja"]
)


# Compras
app.include_router(
    compras.router,
    prefix=f"{settings.API_V1_STR}/compras",
    tags=["Compras"]
)


# Proveedores
app.include_router(
    proveedores.router,
    prefix=f"{settings.API_V1_STR}/proveedores",
    tags=["Proveedores"]
)


# Bancos y Tesorería
app.include_router(
    bancos.router,
    prefix=f"{settings.API_V1_STR}/bancos",
    tags=["Bancos y Tesorería"]
)


# Reportes y Métricas
app.include_router(
    reportes.router,
    prefix=f"{settings.API_V1_STR}/reportes",
    tags=["Reportes y Métricas"]
)


# =========================================================
# RUTA PRINCIPAL
# =========================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME
    }