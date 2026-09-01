from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, LoginResponse


router = APIRouter()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


@router.post("/login", response_model=LoginResponse)
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):

    # Buscar usuario por correo
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == datos.email)
        .first()
    )

    # Usuario no existe
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )

    # Usuario desactivado
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado"
        )

    # Verificar contraseña
    try:
        contraseña_correcta = pwd_context.verify(
            datos.password,
            usuario.password_hash
        )
    except Exception:
        contraseña_correcta = False

    if not contraseña_correcta:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )

    # Login correcto
    rol_nombre = usuario.rol.nombre if getattr(usuario, "rol", None) else "Sin rol"

    return {
        "user_id": usuario.user_id,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "rol": rol_nombre,
        "activo": usuario.activo
    }