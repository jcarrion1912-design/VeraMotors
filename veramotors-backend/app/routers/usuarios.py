from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.security import hashear_password, solo_admin
from app.database import get_db
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.schemas.usuario import UsuarioResponse, UsuarioCreate


router = APIRouter()


# ============================================================
# LISTAR USUARIOS
# GET /api/usuarios
# ============================================================

@router.get(
    "",
    response_model=List[UsuarioResponse]
)
def listar_usuarios(
    db: Session = Depends(get_db)
):

    usuarios = (
        db.query(Usuario)
        .order_by(Usuario.user_id.asc())
        .all()
    )

    resultado = []

    for usuario in usuarios:

        resultado.append(
            UsuarioResponse(
                user_id=usuario.user_id,
                nombre=usuario.nombre,
                email=usuario.email,
                rol_id=usuario.rol_id,
                rol=usuario.rol.nombre,
                activo=usuario.activo
            )
        )

    return resultado


# ============================================================
# CREAR USUARIO
# POST /api/usuarios
# ============================================================

@router.post(
    "",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(solo_admin)]
)
def crear_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db)
):

    # ========================================================
    # VERIFICAR CORREO
    # ========================================================

    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.email == str(datos.email))
        .first()
    )

    if usuario_existente:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario registrado con ese correo."
        )


    # ========================================================
    # VERIFICAR ROL
    # ========================================================

    rol = (
        db.query(Rol)
        .filter(
            Rol.rol_id == datos.rol_id,
            Rol.activo == True
        )
        .first()
    )

    if not rol:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol seleccionado no existe o está inactivo."
        )


    # ========================================================
    # ENCRIPTAR CONTRASEÑA
    # ========================================================

    password_hash = hashear_password(
        datos.password
    )


    # ========================================================
    # CREAR USUARIO
    # ========================================================

    nuevo_usuario = Usuario(
        nombre=datos.nombre.strip(),
        rol_id=datos.rol_id,
        email=str(datos.email),
        password_hash=password_hash,
        activo=datos.activo
    )


    db.add(nuevo_usuario)


    try:

        db.commit()

        db.refresh(nuevo_usuario)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el usuario."
        )


    # ========================================================
    # RESPUESTA
    # ========================================================

    return UsuarioResponse(
        user_id=nuevo_usuario.user_id,
        nombre=nuevo_usuario.nombre,
        email=nuevo_usuario.email,
        rol_id=nuevo_usuario.rol_id,
        rol=rol.nombre,
        activo=nuevo_usuario.activo
    )


# ============================================================
# ACTIVAR / DESACTIVAR USUARIO
# PATCH /api/usuarios/{user_id}/estado
# ============================================================

@router.patch(
    "/{user_id}/estado",
    response_model=UsuarioResponse,
    dependencies=[Depends(solo_admin)]
)
def cambiar_estado_usuario(
    user_id: int,
    db: Session = Depends(get_db)
):

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.user_id == user_id
        )
        .first()
    )


    if not usuario:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )


    # ========================================================
    # CAMBIAR ESTADO
    # ========================================================

    usuario.activo = not usuario.activo


    try:

        db.commit()

        db.refresh(usuario)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo cambiar el estado del usuario."
        )


    return UsuarioResponse(
        user_id=usuario.user_id,
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        rol=usuario.rol.nombre,
        activo=usuario.activo
    )