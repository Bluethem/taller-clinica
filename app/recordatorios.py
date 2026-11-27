"""Recordatorios de cita: integra agenda (citas) y mensajería (notificador)."""

from datetime import datetime

from app.citas import (
    ESTADO_RESERVADA,
    HORAS_ANTES_RECORDATORIO,
    Cita,
)


def _minutos_hasta(cita: Cita, ahora: datetime) -> float:
    return (cita.inicio - ahora).total_seconds() / 60


def _en_ventana_recordatorio(minutos: float) -> bool:
    limite = HORAS_ANTES_RECORDATORIO * 60
    return 0 <= minutos <= limite


def citas_a_recordar(citas: list[Cita], ahora: datetime) -> list[Cita]:
    resultado: list[Cita] = []
    for c in citas:
        if c.estado != ESTADO_RESERVADA:
            continue
        if c.recordada:
            continue
        if _en_ventana_recordatorio(_minutos_hasta(c, ahora)):
            resultado.append(c)
    return resultado


def enviar_recordatorios(citas: list[Cita], ahora: datetime, notificador) -> int:
    enviados = 0
    for cita in citas_a_recordar(citas, ahora):
        mensaje = (
            f"Recordatorio: tiene cita el {cita.inicio:%d/%m/%Y a las %H:%M}."
        )
        if notificador.enviar(cita.dni, mensaje):
            cita.recordada = True
            enviados += 1
    return enviados