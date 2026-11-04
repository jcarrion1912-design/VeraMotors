import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

<<<<<<< HEAD
=======
load_dotenv()

>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab

class Settings(BaseSettings):
    PROJECT_NAME: str = "VERAMOTORS SAC API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

<<<<<<< HEAD
=======
    # Permite POST /api/auth/demo. Solo para desarrollo local: en producción debe quedar en false.
    PERMITIR_LOGIN_DEMO: bool = False

    # La cookie de sesión solo viaja por HTTPS. En desarrollo con http se desactiva en el .env.
    COOKIE_SECURE: bool = True

    # Publica /docs, /redoc y el esquema OpenAPI. En producción debe quedar en false.
    HABILITAR_DOCS: bool = False

>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        case_sensitive = True


# ESTA LÍNEA ES LA QUE FALTA O TIENE UN ERROR DE NOMBRE:
settings = Settings()
