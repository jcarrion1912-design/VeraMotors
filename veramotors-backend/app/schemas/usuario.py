from pydantic import BaseModel, EmailStr, Field, model_validator


class UsuarioResponse(BaseModel):
    user_id: int
    nombre: str
    email: EmailStr
    rol_id: int
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    rol_id: int = Field(..., gt=0)
    password: str = Field(..., min_length=6, max_length=100)
    confirmar_password: str = Field(..., min_length=6, max_length=100)
    activo: bool = True

    @model_validator(mode="after")
    def validar_password(self):
        if self.password != self.confirmar_password:
            raise ValueError("Las contraseñas no coinciden.")

        return self


class UsuarioEstadoUpdate(BaseModel):
    activo: bool