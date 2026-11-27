"""Modelo de citas de la clínica (módulo agenda)."""

from dataclasses import dataclass
from datetime import datetime

ESTADO_RESERVADA = "reservada"
ESTADO_CANCELADA = "cancelada"

# SC-02: cancelación con antelación mínima (historia fusionada en main)
MINUTOS_MINIMOS_CANCELAR = 120

# HU-07: ventana del recordatorio automático
HORAS_ANTES_RECORDATORIO = 24


@dataclass
class Cita:
    dni: str
    inicio: datetime
    estado: str = ESTADO_RESERVADA
    recordada: bool = False


def puede_cancelar(cita: Cita, ahora: datetime) -> bool:
    """Indica si la cita puede cancelarse según la regla de SC-02."""
    if cita.estado == ESTADO_CANCELADA:
        return False
    minutos = (cita.inicio - ahora).total_seconds() / 60
    return minutos >= MINUTOS_MINIMOS_CANCELAR