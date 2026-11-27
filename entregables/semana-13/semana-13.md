**UNIVERSIDAD NACIONAL DE INGENIERÍA**

*Facultad de Ingeniería Industrial y de Sistemas · Escuela de Ingeniería de Software*

**GUÍA PRÁCTICA — SEMANA 13** (entregable Equipo C)

**Sprint 2: integración de módulos y métricas de producto y proceso**

SW705 — Taller de Ingeniería de Software I

| Integrantes del equipo | Equipo C · David Luza Ccorimanya · Romel Rodrigo Chumpitaz Flores · Henry Javier Medina Malpartida |
| :---- | :---- |
| **Código(s)** | 20232595H · 20231014A · 20232571A |
| **Sección** | U |
| **Fecha** | 26/11/2026 |
| **Repositorio del equipo** | https://github.com/Bluethem/taller-clinica |

---

# Parte 1 — Estado del Sprint 2 a mitad de camino

## 1.1 Estado de las historias al corte

| Historia | Puntos | Estado al corte | Fecha de fin | Evidencia |
| :---- | :---- | :---- | :---- | :---- |
| HU-03 Historia clínica unificada | 8 | Hecha | 2026-11-21 | PR #12 |
| HU-04 Resultado digital laboratorio | 5 | Hecha | 2026-11-22 | PR #13 |
| HU-05 Comprobante convenio | 5 | Hecha | 2026-11-24 | PR #14 |
| SC-02 Cancelar cita (antelación mínima) | 3 | Hecha | 2026-11-25 | PR #15 |
| HU-07 Recordatorio 24 h antes | 5 | En curso | — | PR #16 (esta sesión) |

## 1.3 Resultado del programa

| Dato | Resultado del equipo |
| :---- | :---- |
| Comprometido / hecho / restante | 26 / 21 / 5 pts |
| Restante ideal el día 6 | 10,4 pts |
| Diferencia con el ideal | −5,4 pts (adelantado en hecho) |
| Ritmo del equipo | 3,50 pts/día |
| Proyección al cierre | 35,0 pts (sobreestima; solo quedan 5 pts reales) |

*Evidencia:* `metricas/salida_corte_2026-11-26.txt`

## 1.4 Interpretación y riesgos

| Riesgo | Por qué importa | Respuesta del equipo |
| :---- | :---- | :---- |
| HU-07 es la única historia pendiente (5 puntos) y no hay margen en la proyección. | Sin HU-07 no se cumple RF06 en el laboratorio ni el incremento del sprint. | Bloquear la sesión S13 a HU-07; PM evita nuevas tareas. |
| HU-07 y SC-02 modifican el mismo archivo (`app/citas.py`). | Conflicto de fusión al integrar con `main`. | Resolver en la rama HU-07 conservando ambas constantes. |

## 1.5 Reparto de la sesión

| Integrante | Responsabilidad | Partes | Pull request |
| :---- | :---- | :---- | :---- |
| David Luza (PM) | Estado sprint, métricas proceso, informe | 1, 5, 6 | Informe mitad |
| Romel Chumpitaz (DevOps) | Conflicto, CI, etiquetas | 3, integración | Revisión HU-07 |
| Henry Medina (Dev) | TDD HU-07, métricas producto | 2, 4 | Autor HU-07 |

---

# Parte 2 — HU-07

## 2.1 Casos de prueba (ventana 24 h)

| ID | Cita | ¿Se recuerda? |
| :---- | :---- | :---- |
| CP-01 | 1440 min; reservada | Sí |
| CP-02 | 1441 min; reservada | No |
| CP-03 | 60 min; reservada | Sí |
| CP-04 | 0 min; reservada | Sí |
| CP-05 | −30 min; reservada | No |
| CP-06 | 300 min; cancelada | No |
| CP-07 | 300 min; ya recordada | No |
| CP-08 | 300 min; fallo envío | No marca `recordada` |

## Resultado pytest

| Fase | Salida del equipo |
| :---- | :---- |
| Fase roja (sin código) | `ModuleNotFoundError` / pruebas fallan (esperado) |
| Fase verde | 12 passed (`python3 -m pytest -q`) |
| Defecto hallado | Marcar `recordada` sin comprobar retorno de `enviar` → corregido en CP-08 |

*Código:* `tests/test_recordatorios.py`, `app/recordatorios.py`, `app/notificaciones.py`

---

# Parte 3 — Conflicto en `app/citas.py`

## 3.2 Resolución

**Rama HU-07 añadió:** `HORAS_ANTES_RECORDATORIO = 24` y campo `recordada` en `Cita`.

**Main (SC-02) añadió:** `MINUTOS_MINIMOS_CANCELAR = 120` y función `puede_cancelar`.

**Decisión:** conservar ambos bloques; archivo resuelto en `app/citas.py` (sin marcadores).

| Archivo | Decisión | Quién decidió |
| :---- | :---- | :---- |
| `app/citas.py` | Mantener SC-02 + HU-07 | Romel + Henry |

---

# Parte 4 — Métricas de producto

| Métrica | Umbral | Resultado | ¿Cumple? |
| :---- | :---- | :---- | :---- |
| Pruebas | Verde | 12/12 | Sí |
| Cobertura ramas (módulos nuevos) | ≥ 90 % | 100 % | Sí |
| Cobertura ramas (total `app/`) | ≥ 90 % | 100 % | Sí |
| Complejidad máxima | ≤ 10 | 5 | Sí |
| Defectos abiertos | 0 | 0 | Sí |

*Evidencia:* `metricas/salida_pytest_cov.txt`, `metricas/salida_radon.txt`

---

# Parte 5 — Tiempo de ciclo

| Métrica | Resultado |
| :---- | :---- |
| PR fusionados | 4 |
| Mediana | 2,3 días |
| Máximo | 3,3 días (#14) |
| Acción | Revisor fijo en Daily; meta ≤ 2 días |

*Evidencia:* `metricas/salida_tiempo_ciclo.txt`

---

# Parte 6 — Informe

*Ver:* `docs/informe_mitad_sprint2.md`

| Evidencia | Enlace |
| :---- | :---- |
| Pull request HU-07 | (completar tras fusionar PR #16) |
| Pull request informe | (misma rama o PR docs) |
| Carpeta métricas | `metricas/` |
| Etiqueta Sprint 1 | `v0.1.0` en commit previo al laboratorio Python |