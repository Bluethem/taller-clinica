from datetime import datetime, timedelta

import pytest

from app.citas import ESTADO_CANCELADA, ESTADO_RESERVADA, Cita
from app.notificaciones import NotificadorSimulado
from app.recordatorios import citas_a_recordar, enviar_recordatorios

AHORA = datetime(2026, 11, 25, 10, 0, 0)


def _cita(minutos_desde_ahora: int, estado: str = ESTADO_RESERVADA, recordada: bool = False) -> Cita:
    return Cita(
        dni="12345678",
        inicio=AHORA + timedelta(minutes=minutos_desde_ahora),
        estado=estado,
        recordada=recordada,
    )


@pytest.mark.parametrize(
    "minutos,estado,recordada,esperado",
    [
        pytest.param(1440, ESTADO_RESERVADA, False, True, id="CP-01-24h"),
        pytest.param(1441, ESTADO_RESERVADA, False, False, id="CP-02-fuera-ventana"),
        pytest.param(60, ESTADO_RESERVADA, False, True, id="CP-03-1h"),
        pytest.param(0, ESTADO_RESERVADA, False, True, id="CP-04-ahora"),
        pytest.param(-30, ESTADO_RESERVADA, False, False, id="CP-05-pasada"),
        pytest.param(300, ESTADO_CANCELADA, False, False, id="CP-06-cancelada"),
        pytest.param(300, ESTADO_RESERVADA, True, False, id="CP-07-ya-recordada"),
    ],
)
def test_citas_a_recordar_ventana(minutos, estado, recordada, esperado):
    citas = [_cita(minutos, estado, recordada)]
    resultado = citas_a_recordar(citas, AHORA)
    if esperado:
        assert resultado == citas
    else:
        assert resultado == []


def test_cp08_envio_falla_no_marca_recordada():
    cita = _cita(300)
    notificador = NotificadorSimulado(fallar_en={"12345678"})
    enviados = enviar_recordatorios([cita], AHORA, notificador)
    assert enviados == 0
    assert not cita.recordada
    assert notificador.envios == []


def test_enviar_recordatorios_marca_solo_si_envio_ok():
    cita = _cita(300)
    notificador = NotificadorSimulado()
    enviados = enviar_recordatorios([cita], AHORA, notificador)
    assert enviados == 1
    assert cita.recordada
    assert len(notificador.envios) == 1