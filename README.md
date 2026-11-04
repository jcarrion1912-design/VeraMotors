# VeraMotors

ERP para la gestión integral de un taller automotriz: citas, órdenes de servicio con inspección 3D, inventario, compras, facturación electrónica (SUNAT), caja, bancos, asistencia y reportes.

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | React 19, Vite, React Router, Three.js, CSS plano con tokens |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | JWT en cookie `httpOnly`, contraseñas con bcrypt |

## Estructura

```text
├── src/
│   ├── components/   Chasis (sidebar, header) y componentes compartidos
│   ├── config/       Navegación por rol y etapas del flujo del taller
│   ├── context/      Sesión y rol del usuario
│   ├── layouts/      Layout principal
│   ├── pages/        Un directorio por módulo
│   ├── services/     Llamadas a la API
│   └── styles/       Sistema de diseño
├── public/           Modelos 3D y archivos estáticos
└── veramotors-backend/
    ├── app/          routers, schemas, models, core
    ├── tests/        Pruebas sobre SQLite en memoria
    └── migracion_fase*.py
```

## Puesta en marcha

Necesitas Node.js, Python 3.10 o superior y acceso a una base PostgreSQL.

Los comandos funcionan en PowerShell y Bash. En PowerShell 5.1 no se puede usar `&&`: ejecútalos uno por uno.

### Backend

```bash
cd veramotors-backend
```

```bash
pip install -r requirements.txt
```

Crea `veramotors-backend/.env` con las [variables de entorno](#variables-de-entorno) y arranca el servidor:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

El servidor no arranca sin una `SECRET_KEY` de al menos 32 caracteres. Puedes generarla con:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Frontend

Desde la raíz del proyecto:

```bash
npm install
```

```bash
npm run dev
```

La aplicación queda en <http://localhost:5173>. Vite reenvía `/api` al backend en el puerto 8000; este proxy es necesario para que la cookie de sesión funcione.

## Variables de entorno

Van en `veramotors-backend/.env`, que Git ignora. Nunca subas este archivo ni el archivo `env` de la raíz.

| Variable | Obligatoria | Descripción | Desarrollo | Producción |
|---|---|---|---|---|
| `DATABASE_URL` | Sí | Conexión a PostgreSQL | Base de prueba | Base real |
| `SECRET_KEY` | Sí | Firma los tokens (mínimo 32 caracteres) | Propia | Propia y distinta |
| `COOKIE_SECURE` | No | Cookie solo por HTTPS. Por defecto `true` | `false` | `true` |
| `HABILITAR_DOCS` | No | Publica `/docs` y `/redoc`. Por defecto `false` | `true` | `false` |
| `PERMITIR_LOGIN_DEMO` | No | Habilita el Modo Demo. Por defecto `false` | `true` | `false` |
| `SUNAT_*` | Para facturar | Conexión con APISUNAT: `SUNAT_API_URL`, `SUNAT_API_TOKEN`, `SUNAT_PERSONA_ID`, `SUNAT_RUC`, `SUNAT_USUARIO`, `SUNAT_PASSWORD`, `SUNAT_AMBIENTE`, `SUNAT_RAZON_SOCIAL`, `SUNAT_CODIGO_ESTABLECIMIENTO` | Credenciales de prueba | Credenciales reales |

## Base de datos

Los scripts `migracion_fase*.py` son aditivos y parten de un esquema ya existente: el esquema inicial no está versionado en este repositorio. Para una base nueva, primero restaura una copia de la estructura actual.

Se ejecutan desde `veramotors-backend`, usando la base indicada en `.env`:

```bash
python migracion_fase6_compras_empresa.py
```

Comprueba a qué base apunta `DATABASE_URL` antes de ejecutar cualquier migración.

## Seguridad y roles

- Toda la API exige sesión, salvo login, logout, Modo Demo, la raíz `/` y la vista pública de aprobación del cliente.
- El token va en una cookie `httpOnly` y `SameSite=Strict` que dura 8 horas. JavaScript no puede leerla.
- El autor de cada operación se toma de la sesión, no de lo que envía el cliente.
- El login se bloquea 10 minutos tras 5 fallos por cuenta e IP, o 30 por IP.
- El enlace de aprobación del cliente va firmado y vence en 7 días.

Permisos que aplica el servidor:

| Módulo | Administrador | Asesor de Servicio | Asesor de Repuestos | Técnico |
|---|---|---|---|---|
| Facturación, notas, guías, caja, cobros | Sí | Sí | No | No |
| Compras, proveedores, recepciones, facturas de proveedor | Sí | No | Sí | No |
| Inventario: consultar | Sí | Sí | Sí | Sí |
| Inventario: modificar | Sí | No | Sí | No |
| Bancos, asistencia | Sí | No | No | No |
| Reportes de negocio | Sí | Sí | Sí | No |
| Rentabilidad | Sí | No | No | No |
| Desempeño de técnicos | Sí | Sí | Sí | Solo el propio |
| Crear o activar usuarios, cambiar configuración | Sí | No | No | No |

Clientes, vehículos, citas, cotizaciones y órdenes de servicio están disponibles para cualquier usuario con sesión.

## Pruebas y calidad

Las pruebas de backend corren sobre SQLite en memoria y no tocan la base del `.env`:

```bash
cd veramotors-backend
```

```bash
python -m unittest tests.test_auth tests.test_compras_empresa
```

Los archivos `test_fase*.py` de `veramotors-backend` son anteriores y no siguen este aislamiento: revisa qué hacen antes de ejecutarlos.

Frontend, desde la raíz del proyecto:

```bash
npm run lint
```

```bash
npm run build
```

## Despliegue

- **Mismo dominio:** sirve el frontend y `/api` desde el mismo dominio, con el servidor web reenviando `/api` al backend. Sin esto, la cookie de sesión no viaja.
- **HTTPS y variables:** usa HTTPS y los valores de la columna Producción.
- **Proxy:** pasa la IP real del cliente a uvicorn; si no, todos los usuarios cuentan como una misma IP en el límite de intentos.
- **Un solo proceso:** el límite de intentos vive en memoria. Con varios workers, cada uno lleva su propia cuenta.

`veramotors-backend/Dockerfile` construye la imagen del backend.

## Diseño

La línea visual, los tokens y los componentes están en la [guía de estilo](src/styles/README.md). Consúltala antes de crear o modificar pantallas.
