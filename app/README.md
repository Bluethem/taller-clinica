# Práctica Sprint 2 — Semana 13 (laboratorio Python)

Módulo didáctico del taller **HU-07** (recordatorio 24 h antes): integra `citas` (agenda) y `notificaciones` (mensajería) mediante el contrato `enviar(dni, mensaje)`.

No reemplaza el backend NestJS en `src/backend`; sirve para TDD, métricas con `pytest-cov`/`radon` y el escenario de conflicto de fusión con **SC-02** en `app/citas.py`.

```bash
pip install -r requirements-practica.txt
python -m pytest -q
python metricas/metricas_corte.py metricas/sprint2.csv 2026-11-26
```