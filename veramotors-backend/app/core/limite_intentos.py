import math
import threading
import time

from fastapi import HTTPException, status


class LimiteIntentos:
    """
    Cuenta intentos fallidos en memoria dentro de una ventana de tiempo.
    Vale por proceso: si se despliega con varios workers, hay que moverlo a un almacén compartido.
    """

    def __init__(self, maximo: int, ventana_segundos: int):
        self.maximo = maximo
        self.ventana = ventana_segundos
        self._fallos: dict[str, list[float]] = {}
        self._candado = threading.Lock()

    def _vigentes(self, clave: str, ahora: float) -> list[float]:
        vigentes = [t for t in self._fallos.get(clave, []) if ahora - t < self.ventana]
        if vigentes:
            self._fallos[clave] = vigentes
        else:
            self._fallos.pop(clave, None)
        return vigentes

    def verificar(self, clave: str) -> None:
        ahora = time.monotonic()
        with self._candado:
            vigentes = self._vigentes(clave, ahora)
            if len(vigentes) >= self.maximo:
                espera = max(1, math.ceil(self.ventana - (ahora - vigentes[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos fallidos. Vuelve a intentar en {math.ceil(espera / 60)} minuto(s).",
                    headers={"Retry-After": str(espera)},
                )

    def registrar_fallo(self, clave: str) -> None:
        ahora = time.monotonic()
        with self._candado:
            self._vigentes(clave, ahora)
            self._fallos.setdefault(clave, []).append(ahora)

    def limpiar(self, clave: str) -> None:
        with self._candado:
            self._fallos.pop(clave, None)

    def reiniciar(self) -> None:
        with self._candado:
            self._fallos.clear()
