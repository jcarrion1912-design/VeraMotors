from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limite_intentos import LimiteIntentos
from app.core.security import ROL_ADMIN, abrir_sesion, cerrar_sesion, verificar_password
from app.database import get_db
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, LoginResponse


router = APIRouter()

VENTANA_INTENTOS_SEGUNDOS = 10 * 60

# Por correo e IP frena a quien prueba claves de una cuenta sin bloquear al dueño desde otro equipo;
# por IP frena a quien recorre muchas cuentas desde el mismo origen.
limite_cuenta = LimiteIntentos(maximo=5, ventana_segundos=VENTANA_INTENTOS_SEGUNDOS)
limite_ip = LimiteIntentos(maximo=30, ventana_segundos=VENTANA_INTENTOS_SEGUNDOS)


def _respuesta_sesion(respuesta: Response, usuario: Usuario) -> dict:
    abrir_sesion(respuesta, usuario.user_id)
    rol_nombre = usuario.rol.nombre if getattr(usuario, "rol", None) else "Sin rol"

    return {
        "user_id": usuario.user_id,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "rol": rol_nombre,
        "activo": usuario.activo,
    }


@router.post("/login", response_model=LoginResponse)
def login(
    datos: LoginRequest,
    request: Request,
    respuesta: Response,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "desconocida"
    clave_cuenta = f"{ip}:{datos.email.lower()}"
    limite_ip.verificar(ip)
    limite_cuenta.verificar(clave_cuenta)

    def _credenciales_invalidas():
        limite_ip.registrar_fallo(ip)
        limite_cuenta.registrar_fallo(clave_cuenta)
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )

    # Buscar usuario por correo
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == datos.email)
        .first()
    )

    # Usuario no existe
    if not usuario:
        raise _credenciales_invalidas()

    # Verificar contraseña antes de revelar el estado de la cuenta
    if not verificar_password(datos.password, usuario.password_hash):
        raise _credenciales_invalidas()

    # Usuario desactivado
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado"
        )

    # Login correcto
    limite_cuenta.limpiar(clave_cuenta)
    return _respuesta_sesion(respuesta, usuario)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(respuesta: Response):
    cerrar_sesion(respuesta)


@router.post("/demo", response_model=LoginResponse)
def login_demo(
    respuesta: Response,
    db: Session = Depends(get_db)
):
    # Entra sin contraseña: solo existe si el .env lo habilita de forma explícita.
    if not settings.PERMITIR_LOGIN_DEMO:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    usuario = (
        db.query(Usuario)
        .join(Rol, Rol.rol_id == Usuario.rol_id)
        .filter(Rol.nombre == ROL_ADMIN, Usuario.activo.is_(True))
        .order_by(Usuario.user_id.asc())
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No hay un administrador activo para el modo demo."
        )

    return _respuesta_sesion(respuesta, usuario)
