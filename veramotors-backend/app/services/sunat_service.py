import requests

from app.config.settings import settings


class SunatService:

    def __init__(self):

        self.url = settings.SUNAT_API_URL

        self.token = settings.SUNAT_API_TOKEN

        self.ruc = settings.SUNAT_RUC

        self.usuario = settings.SUNAT_USUARIO

        self.password = settings.SUNAT_PASSWORD

        self.ambiente = settings.SUNAT_AMBIENTE


    def enviar_comprobante(self, comprobante):

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        response = requests.post(
            self.url,
            json=comprobante,
            headers=headers,
            timeout=30
        )

        response.raise_for_status()

        return response.json()