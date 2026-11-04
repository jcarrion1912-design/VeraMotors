from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import admin_o_repuestos, facturacion_y_caja, get_current_user, solo_admin
from app.database import engine

import app.models

from app.routers import (
    aprobacion_cliente,
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
    cierre_caja,
    cuentas_por_cobrar,
    pagos,
    caja,
    compras,
    recepciones,
    facturas_proveedor,
    pagos_proveedor,
    proveedores,
    bancos,
    reportes
)


app = FastAPI(
    title=settings.PROJECT_NAME,
    # La documentación expone toda la API: solo se publica si el .env lo pide.
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.HABILITAR_DOCS else None,
    docs_url="/docs" if settings.HABILITAR_DOCS else None,
    redoc_url="/redoc" if settings.HABILITAR_DOCS else None,
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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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


# Aprobación del cliente: pública, protegida por el token firmado del enlace
app.include_router(
    aprobacion_cliente.router,
    prefix=f"{settings.API_V1_STR}/aprobacion-cliente",
    tags=["Aprobación del cliente"]
)


# Usuarios
app.include_router(
    usuarios.router,
    prefix=f"{settings.API_V1_STR}/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(get_current_user)]
)


# Clientes
app.include_router(
    clientes.router,
    prefix=f"{settings.API_V1_STR}/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]
)


# Vehículos
app.include_router(
    vehiculos.router,
    prefix=f"{settings.API_V1_STR}/vehiculos",
    tags=["Vehículos"],
    dependencies=[Depends(get_current_user)]
)


# Citas
app.include_router(
    citas.router,
    prefix=f"{settings.API_V1_STR}/citas",
    tags=["Citas"],
    dependencies=[Depends(get_current_user)]
)


# Inventario
app.include_router(
    inventario.router,
    prefix=f"{settings.API_V1_STR}/inventario",
    tags=["Inventario"],
    dependencies=[Depends(get_current_user)]
)


# Cotizaciones
app.include_router(
    cotizaciones.router,
    prefix=f"{settings.API_V1_STR}/cotizaciones",
    tags=["Cotizaciones"],
    dependencies=[Depends(get_current_user)]
)


# Órdenes de Servicio
app.include_router(
    ods.router,
    prefix=f"{settings.API_V1_STR}/ods",
    tags=["Órdenes de Servicio"],
    dependencies=[Depends(get_current_user)]
)


# Diagnósticos
app.include_router(
    diagnosticos.router,
    prefix=f"{settings.API_V1_STR}/diagnosticos",
    tags=["Diagnósticos"],
    dependencies=[Depends(get_current_user)]
)


# Facturación
app.include_router(
    facturacion.router,
    prefix=f"{settings.API_V1_STR}/facturacion",
    tags=["Facturación"],
    dependencies=[Depends(facturacion_y_caja)]
)


# Asistencia
app.include_router(
    asistencia.router,
    prefix=f"{settings.API_V1_STR}/asistencia",
    tags=["Asistencia RRHH"],
    dependencies=[Depends(solo_admin)]
)


# Configuración
app.include_router(
    configuracion.router,
    prefix=f"{settings.API_V1_STR}/configuracion",
    tags=["Configuración"],
    dependencies=[Depends(get_current_user)]
)


# IA / RAG
app.include_router(
    ia_rag.router,
    prefix=f"{settings.API_V1_STR}/ia",
    tags=["Asistente IA RAG"],
    dependencies=[Depends(get_current_user)]
)

# Notas de Crédito
app.include_router(
    notas_credito.router,
    prefix=f"{settings.API_V1_STR}/notas-credito",
    tags=["Notas de Crédito"],
    dependencies=[Depends(facturacion_y_caja)]
)

# Notas de Débito
app.include_router(
    notas_debito.router,
    prefix=f"{settings.API_V1_STR}/notas-debito",
    tags=["Notas de Débito"],
    dependencies=[Depends(facturacion_y_caja)]
)

<<<<<<< HEAD
=======
# Remisiones
app.include_router(
    remisiones.router,
    prefix=f"{settings.API_V1_STR}/remisiones",
    tags=["Remisiones"],
    dependencies=[Depends(facturacion_y_caja)]
)


>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
# Cierre de Caja
app.include_router(
    cierre_caja.router,
    prefix=f"{settings.API_V1_STR}/cierre-caja",
    tags=["Cierre de Caja"],
    dependencies=[Depends(facturacion_y_caja)]
)

app.include_router(
    cuentas_por_cobrar.router,
    prefix=f"{settings.API_V1_STR}/cuentas-por-cobrar",
    tags=["Cuentas por Cobrar"],
    dependencies=[Depends(facturacion_y_caja)]
)

app.include_router(
    pagos.router,
    prefix=f"{settings.API_V1_STR}/pagos",
    tags=["Pagos"],
    dependencies=[Depends(facturacion_y_caja)]
)

app.include_router(
    caja.router,
    prefix=f"{settings.API_V1_STR}/caja",
    tags=["Caja"],
    dependencies=[Depends(facturacion_y_caja)]
)


# Compras
app.include_router(
    compras.router,
    prefix=f"{settings.API_V1_STR}/compras",
    tags=["Compras"],
    dependencies=[Depends(admin_o_repuestos)]
)


# Recepciones
app.include_router(
    recepciones.router,
    prefix=f"{settings.API_V1_STR}/recepciones",
    tags=["Recepciones"],
    dependencies=[Depends(admin_o_repuestos)]
)


# Facturas de Proveedor
app.include_router(
    facturas_proveedor.router,
    prefix=f"{settings.API_V1_STR}/facturas-proveedor",
    tags=["Facturas Proveedor"],
    dependencies=[Depends(admin_o_repuestos)]
)


# Pagos de Proveedor
app.include_router(
    pagos_proveedor.router,
    prefix=f"{settings.API_V1_STR}/pagos-proveedor",
    tags=["Pagos Proveedor"],
    dependencies=[Depends(admin_o_repuestos)]
)


# Proveedores
app.include_router(
    proveedores.router,
    prefix=f"{settings.API_V1_STR}/proveedores",
    tags=["Proveedores"],
    dependencies=[Depends(admin_o_repuestos)]
)


# Bancos y Tesorería
app.include_router(
    bancos.router,
    prefix=f"{settings.API_V1_STR}/bancos",
    tags=["Bancos y Tesorería"],
    dependencies=[Depends(solo_admin)]
)


# Reportes y Métricas
app.include_router(
    reportes.router,
    prefix=f"{settings.API_V1_STR}/reportes",
    tags=["Reportes y Métricas"],
    dependencies=[Depends(get_current_user)]
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