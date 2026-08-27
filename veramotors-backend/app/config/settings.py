from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # ============================================================
    # BASE DE DATOS
    # ============================================================

    DATABASE_URL: str


    # ============================================================
    # API SUNAT
    # ============================================================

    SUNAT_API_URL: str
    SUNAT_API_TOKEN: str

    SUNAT_RUC: str
    SUNAT_USUARIO: str
    SUNAT_PASSWORD: str

    SUNAT_AMBIENTE: str = "BETA"


    # ============================================================
    # CONFIGURACIÓN
    # ============================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()