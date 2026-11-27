"""Contrato de notificación (módulo mensajería)."""


class NotificadorSimulado:
    """Notificador de prueba: puede simular fallos de envío."""

    def __init__(self, fallar_en: set[str] | None = None):
        self._fallar_en = fallar_en or set()
        self.envios: list[tuple[str, str]] = []

    def enviar(self, dni: str, mensaje: str) -> bool:
        if dni in self._fallar_en:
            return False
        self.envios.append((dni, mensaje))
        return True