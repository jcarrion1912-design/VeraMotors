from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.usuario import Usuario

ROL_ADMIN = "Administrador"
ROL_ASESOR_SERVICIO = "Asesor de Servicio"
ROL_ASESOR_REPUESTOS = "Asesor de Repuestos"
ROL_TECNICO = "Técnico Automotriz"

COOKIE_SESION = "vm_sesion"
USO_SESION = "sesion"
USO_APROBACION = "aprobacion"
DIAS_LINK_APROBACION = 7

# Sin una clave propia cualquiera podría firmar tokens: mejor no arrancar.
if len(settings.SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY no configurada o demasiado corta (mínimo 32 caracteres). "
        "Defínela en el .env del backend."
    )

_bearer = HTTPBearer(auto_error=False)


# bcrypt solo usa los primeros 72 bytes; las versiones nuevas fallan si reciben más.
def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def hashear_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verificar_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _firmar(datos: dict, vigencia: timedelta) -> str:
    ahora = datetime.now(timezone.utc)
    return jwt.encode(
        {**datos, "iat": ahora, "exp": ahora + vigencia},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def crear_token(user_id: int) -> str:
    return _firmar(
        {"sub": str(user_id), "uso": USO_SESION},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def crear_token_aprobacion(ods_id: int) -> tuple[str, datetime]:
    vigencia = timedelta(days=DIAS_LINK_APROBACION)
    return (
        _firmar({"ods_id": ods_id, "uso": USO_APROBACION}, vigencia),
        datetime.now(timezone.utc) + vigencia,
    )


def leer_token_aprobacion(token: str) -> int:
    """Devuelve la ODS del enlace; un token de sesión u otro uso no sirve aquí."""
    try:
        datos = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if datos.get("uso") != USO_APROBACION:
            raise ValueError
        return int(datos["ods_id"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace no es válido o ya venció. Solicita uno nuevo al taller.",
        )


def abrir_sesion(respuesta: Response, user_id: int) -> None:
    # httponly impide leerla desde JavaScript; samesite=strict bloquea su envío desde otros sitios.
    respuesta.set_cookie(
        COOKIE_SESION,
        crear_token(user_id),
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/api",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="strict",
    )


def cerrar_sesion(respuesta: Response) -> None:
    respuesta.delete_cookie(
        COOKIE_SESION,
        path="/api",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="strict",
    )


def _no_autorizado(detalle: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalle,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    request: Request,
    credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    # El navegador usa la cookie; la cabecera queda para integraciones y pruebas.
    token = request.cookies.get(COOKIE_SESION) or (credenciales.credentials if credenciales else None)
    if not token:
        raise _no_autorizado("Inicia sesión para continuar.")

    try:
        datos = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if datos.get("uso") != USO_SESION:
            raise ValueError
        user_id = int(datos["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise _no_autorizado("La sesión no es válida o ya expiró.")

    # Se consulta en cada petición para que desactivar a alguien tenga efecto inmediato.
    usuario = db.query(Usuario).filter(Usuario.user_id == user_id).first()
    if not usuario or not usuario.activo:
        raise _no_autorizado("La sesión no es válida o ya expiró.")

    return usuario


def nombre_rol(usuario: Usuario) -> str:
    return usuario.rol.nombre.strip() if getattr(usuario, "rol", None) else ""


def requerir_roles(*roles: str):
    def _verificar(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if nombre_rol(usuario) not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu rol no tiene permiso para esta acción.",
            )
        return usuario

    return _verificar


# Matriz de permisos: coincide con los módulos que cada rol ve en el menú.
solo_admin = requerir_roles(ROL_ADMIN)
admin_o_repuestos = requerir_roles(ROL_ADMIN, ROL_ASESOR_REPUESTOS)
facturacion_y_caja = requerir_roles(ROL_ADMIN, ROL_ASESOR_SERVICIO)
personal_administrativo = requerir_roles(ROL_ADMIN, ROL_ASESOR_SERVICIO, ROL_ASESOR_REPUESTOS)
