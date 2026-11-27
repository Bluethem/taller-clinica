# Informe de mitad del Sprint 2 — SIGC Clínica San Rafael S.A.C.

**Equipo C:** David Luza Ccorimanya · Romel Rodrigo Chumpitaz Flores · Henry Javier Medina Malpartida  
**Fecha de corte:** 2026-11-26 (día 6 de 10)

## 1. Estado del sprint

| Métrica | Valor |
| --- | --- |
| Puntos comprometidos | 26 |
| Puntos hechos al corte | 21 |
| Puntos restantes | 5 (HU-07) |

**Historias hechas:** HU-03, HU-04, HU-05, SC-02.  
**En curso:** HU-07 Recordatorio de cita 24 h antes (integración agenda + notificaciones).

Burndown: ver `metricas/salida_corte_2026-11-26.txt`. El equipo va **adelantado** en puntos completados respecto al ideal lineal, pero la única historia pendiente (5 pts) coincide con el restante del gráfico; la proyección lineal sobrestima la capacidad (35 pts) porque ya no quedan historias paralelizables.

## 2. Métricas de proceso

- **Ritmo:** 3,50 pts/día.
- **Tiempo de ciclo (PR fusionados en el sprint):** mediana 2,3 días; máximo 3,3 días (PR #14 HU-05).
- **Pull request más lento:** #14 (HU-05), 3,3 días — revisión cruzada con cambios en tarifario.

**Acción acordada:** revisar PRs en menos de 24 h hábiles; Romel configura recordatorio en el tablero y se asigna revisor por turno en la Daily.

## 3. Métricas de producto

| Métrica | Umbral | Resultado | ¿Cumple? |
| --- | --- | --- | --- |
| Pruebas | Todas en verde | 11/11 | Sí |
| Cobertura con ramas (módulos nuevos: recordatorios, notificaciones) | ≥ 90 % | 100 % | Sí |
| Cobertura con ramas (total `app/`) | ≥ 90 % | 97 % | Sí |
| Complejidad ciclomática máxima | ≤ 10 por función | 4 (`enviar_recordatorios`) | Sí |
| Defectos abiertos | 0 | 0 | Sí |

**Mutaciones manuales (4.3):**

| Mutación | Prueba que la detecta | ¿Detectada? |
| --- | --- | --- |
| `<=` cambiado por `<` en la ventana (1440 min) | `CP-01-24h` | Sí |
| Se quita `not c.recordada` | `CP-07-ya-recordada` | Sí |

## 4. Riesgos y decisiones

| Riesgo | Decisión | Responsable |
| --- | --- | --- |
| HU-07 es la única historia pendiente (5 pts) y condiciona el objetivo del sprint. | Prioridad 1 en la sesión de la Semana 13; sin nuevas historias hasta fusionar HU-07. | David (PM) |
| HU-07 y SC-02 modifican `app/citas.py`. | Fusionar `main` en la rama HU-07 y conservar `MINUTOS_MINIMOS_CANCELAR` (SC-02) y `HORAS_ANTES_RECORDATORIO` + `recordada` (HU-07). | Romel + Henry |
| Posible cuello de botella en revisión (PR #14 tardó 3,3 días). | Revisor designado en Daily; meta de ciclo ≤ 2 días. | Romel |

## 5. Plan hasta el cierre del sprint

| Día | Actividad |
| --- | --- |
| 26/11 (S13) | Cierre HU-07 (TDD, conflicto, métricas) e informe de mitad. |
| 27/11 | Pulido de cobertura en `citas.py` (rama `puede_cancelar`); demo interna. |
| 28/11 | Integración con backend NestJS (evento outbox) — spike, no bloqueante para DoD de la práctica Python. |
| 01/12 | Sprint Review y preparación Avance 6. |
| 02/12 | Cierre Sprint 2; etiqueta `v0.2.0` si DoD completa. |

**Solicitud al Product Owner:** confirmar que el recordatorio Python de la práctica es el mismo criterio RF06 (24 h antes) para alinear con HU02 en producción.