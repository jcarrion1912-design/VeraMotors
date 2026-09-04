import requests

from app.config.settings import settings


class SunatService:

    def __init__(self):

        self.url = settings.SUNAT_API_URL

        self.persona_id = settings.SUNAT_PERSONA_ID

        self.persona_token = settings.SUNAT_API_TOKEN

        self.ruc = settings.SUNAT_RUC

        self.ambiente = settings.SUNAT_AMBIENTE


    def enviar_comprobante(
        self,
        file_name,
        document_body,
        customer_email=None
    ):

        payload = {

            "personaId": self.persona_id,

            "personaToken": self.persona_token,

            "fileName": file_name,

            "documentBody": document_body
        }


        if customer_email:

            payload["customerEmail"] = (
                customer_email
            )


        headers = {

            "Content-Type": "application/json",

            "Accept": "application/json"
        }


        response = requests.post(

            self.url,

            json=payload,

            headers=headers,

            timeout=30
        )


        response.raise_for_status()


        return response.json()

    def consultar_estado(self, document_id):
        """Consulta en APISUNAT el estado actual de un documento enviado."""
        if not document_id:
            raise ValueError("APISUNAT no devolvió un documentId para este comprobante.")

        # SUNAT_API_URL normalmente apunta a /personas/v1/sendBill.
        # El endpoint de consulta usa la misma base: /documents/{documentId}/getById
        base_url = self.url.split("/personas/", 1)[0].rstrip("/")
        consulta_url = f"{base_url}/documents/{document_id}/getById"

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(
            consulta_url,
            headers=headers,
            timeout=30
        )

        response.raise_for_status()

        return response.json()
