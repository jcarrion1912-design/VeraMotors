from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine 
from app.routers import (
    auth, clientes, vehiculos, citas, 
    inventario, cotizaciones, ods, 
    diagnosticos, facturacion, asistencia, ia_rag
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Autenticación"])
app.include_router(clientes.router, prefix=f"{settings.API_V1_STR}/clientes", tags=["Clientes"])
app.include_router(vehiculos.router, prefix=f"{settings.API_V1_STR}/vehiculos", tags=["Vehículos"])
app.include_router(citas.router, prefix=f"{settings.API_V1_STR}/citas", tags=["Citas"])
app.include_router(inventario.router, prefix=f"{settings.API_V1_STR}/inventario", tags=["Inventario"])
app.include_router(cotizaciones.router, prefix=f"{settings.API_V1_STR}/cotizaciones", tags=["Cotizaciones"])
app.include_router(ods.router, prefix=f"{settings.API_V1_STR}/ods", tags=["Órdenes de Servicio"])
app.include_router(diagnosticos.router, prefix=f"{settings.API_V1_STR}/diagnosticos", tags=["Diagnósticos"])
app.include_router(facturacion.router, prefix=f"{settings.API_V1_STR}/facturacion", tags=["Facturación"])
app.include_router(asistencia.router, prefix=f"{settings.API_V1_STR}/asistencia", tags=["Asistencia RRHH"])
app.include_router(ia_rag.router, prefix=f"{settings.API_V1_STR}/ia", tags=["Asistente IA RAG"])

@app.get("/")
def root():
    return {"status": "ok", "app": settings.PROJECT_NAME}