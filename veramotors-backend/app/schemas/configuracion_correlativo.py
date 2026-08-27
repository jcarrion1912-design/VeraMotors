from pydantic import BaseModel, Field


class ConfiguracionCorrelativoResponse(BaseModel):
    correlativo_id: int
    tipo_documento: str
    prefijo: str
    siguiente_correlativo: int
    activo: bool

    class Config:
        from_attributes = True


class ConfiguracionCorrelativoUpdate(BaseModel):
    prefijo: str = Field(
        ...,
        min_length=1,
        max_length=10
    )

    siguiente_correlativo: int = Field(
        ...,
        gt=0
    )

    activo: bool = True