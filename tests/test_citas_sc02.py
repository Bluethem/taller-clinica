from datetime import datetime, timedelta

from app.citas import ESTADO_CANCELADA, Cita, puede_cancelar

AHORA = datetime(2026, 11, 25, 10, 0, 0)


def test_sc02_no_cancelar_con_menos_de_120_minutos():
    cita = Cita(dni="12345678", inicio=AHORA + timedelta(minutes=60))
    assert puede_cancelar(cita, AHORA) is False


def test_sc02_si_cancelar_con_antelacion_suficiente():
    cita = Cita(dni="12345678", inicio=AHORA + timedelta(minutes=180))
    assert puede_cancelar(cita, AHORA) is True


def test_sc02_cita_ya_cancelada():
    cita = Cita(
        dni="12345678",
        inicio=AHORA + timedelta(minutes=180),
        estado=ESTADO_CANCELADA,
    )
    assert puede_cancelar(cita, AHORA) is False