# Avance 4 (Semana 7) — Planificación ágil del desarrollo (Scrum)

**SW705 · Taller de Ingeniería de Software I · Equipo C · Sección U**
**Caso:** Clínica San Rafael S.A.C. — Sistema de Información Clínico-Administrativo (SIGC)
**Docente:** Mg. Ing. José Carlos García La Riva · **Fecha:** 15/10/2026
**Integrantes:** David Luza Ccorimanya · Henry Javier Medina Malpartida · Romel Rodrigo Chumpitaz Flores

> **Cómo está organizado este archivo**
> - **Parte A** es el Avance 4 completo (Pasos 1 a 5 de la guía de la Semana 7), listo para pasar al .docx.
> - **Parte B** reúne la documentación ya producida en las Semanas 2 a 6 (Acta, Visión, requerimientos, arquitectura, diseño de datos y prototipo), consolidada y coherente con la Parte A.
> - Las partes pesadas de las Semanas 5 y 6 (Structurizr DSL, DBML, scripts SQL, prompt de Stitch) **no se repiten aquí**; siguen en `arquitectura-clinica-san-rafael.md` y `claude/guia-semana6-clinica-san-rafael.md` del proyecto.
> - Lo que solo el equipo puede producir (votos reales del planning poker, captura y enlace del tablero) está marcado con `____`.

**Contenido:** [Parte A](#parte-a--avance-4) · [Parte B](#parte-b--documentación-consolidada-semanas-2-a-6) · [Pendientes](#pendientes-y-decisiones-abiertas)

---

# Parte A — Avance 4

## Paso 1 — Roles y acuerdos de trabajo

| Integrante | Rol Scrum | Responsabilidades principales |
| --- | --- | --- |
| David Luza Ccorimanya | Developer | Desarrollar lo necesario para cumplir con las historias de usuario seleccionadas en el sprint backlog. |
| Henry Javier Medina Malpartida | Product Owner | Velar por el negocio, comprobando que lo realizado se alinee a los intereses del mismo y colocar plazos de entrega. |
| Romel Rodrigo Chumpitaz Flores | Scrum Master | Facilitar el proceso de Scrum brindando los recursos necesarios que soliciten los desarrolladores. |

Todos desarrollan (equipo de 3). Los roles de ingeniería del Entregable 1 se mantienen como especialidad: David (Project Manager), Romel (DevOps), Henry (Full Stack).

**Acuerdos del equipo**

- **Daily Scrum:** 15 minutos, todas las mañanas laborales a las 10:00 a. m.
- **Canal de comunicación:** Slack para el trabajo diario y un grupo de WhatsApp para emergencias y preguntas rápidas.
- **Duración del Sprint:** 3 semanas.
- **Rotación del Scrum Master:** al finalizar cada Sprint. Henry se mantiene como Product Owner. Rotación prevista: Sprint 1 → Romel; Sprint 2 → David.
- **Ceremonias** (en la semana de transición, S12): Sprint Review y Retrospectiva al cierre del Sprint 1, y Sprint Planning del Sprint 2. Refinamiento del backlog de 30 min a mitad de cada Sprint.

---

## Paso 2 — Estimación del backlog

### 2.1 Backlog completo (HU01–HU05 de la Semana 3 + historias nuevas)

El backlog de la Semana 3 solo tenía 5 historias y dejaba sin historia a RF01, RF03, RF04, RF07, RF10 y a la seguridad (hueco 5.3-#7 de la Semana 6). Se agregan **HU06 a HU12**, con el mismo formato.

| ID | Historia | Módulo / RF | Criterio de aceptación (Dado / Cuando / Entonces) |
| --- | --- | --- | --- |
| HU01 | Como personal de admisión, quiero registrar una cita indicando paciente, médico, fecha/hora y motivo, para evitar duplicados y centralizar la agenda. | M2 · RF05 | Dado que el médico no tiene otra cita en ese horario, cuando registro la cita, entonces el sistema la guarda y bloquea el horario. |
| HU02 | Como paciente, quiero recibir un recordatorio automático antes de mi cita, para no olvidarla. | M2 · RF06 | Dado que tengo una cita en las próximas 24 h, cuando se acerca la hora, entonces recibo el recordatorio por el canal registrado (SMS o correo). |
| HU03 | Como médico, quiero ver la historia clínica unificada de un paciente, sin importar la especialidad que lo atendió. | M1 · RF02 | Dado un paciente con consultas de más de una especialidad, cuando consulto su historia, entonces veo todas las entradas ordenadas por fecha. |
| HU04 | Como personal de laboratorio, quiero registrar el resultado digital de una orden, para que el médico lo consulte sin esperar el papel. | M3 · RF08 | Dado que existe una orden pendiente, cuando cargo el resultado, entonces queda disponible en la historia clínica. |
| HU05 | Como cajero, quiero generar un comprobante con el tarifario del convenio del paciente, para cobrar correctamente. | M4 · RF09 | Dado que el paciente tiene convenio, cuando genero el comprobante, entonces se aplican la tarifa y el copago del convenio. |
| **HU06** | Como personal de admisión, quiero registrar los datos personales y antecedentes de un paciente en su primera atención. | M1 · RF01 | Dado que el documento no existe en el sistema, cuando registro al paciente, entonces se crea con identificador único; si el documento ya existe, el sistema lo rechaza con un mensaje claro. |
| **HU07** | Como médico, quiero registrar una consulta con diagnóstico CIE-10, indicaciones y receta, para dejar documentada la atención. | M1 · RF03 | Dado un paciente en atención, cuando registro motivo, diagnóstico principal CIE-10, indicaciones y receta, entonces la entrada queda guardada en su historia, vinculada a la cita, y no puede modificarse. |
| **HU08** | Como médico, quiero anular una entrada de la historia indicando un motivo, para corregir errores sin perder lo registrado. | M1 · RF04 | Dado una entrada vigente, cuando la anulo con un motivo de al menos 10 caracteres, entonces permanece visible como "anulada" con motivo, usuario y fecha, y no se elimina. |
| **HU09** | Como personal de admisión, quiero reprogramar una cita, para atender el cambio de horario del paciente sin crear duplicados. | M2 · RF07 | Dado una cita programada y un nuevo horario libre del médico, cuando reprogramo, entonces la cita pasa al nuevo horario, el anterior queda libre y el cambio queda registrado con usuario y valor anterior (RNF04). |
| **HU10** | Como usuario de la clínica, quiero iniciar sesión y que mis permisos dependan de mi rol, para ver y hacer solo lo que me corresponde. | Seguridad · RNF02 | Dado un usuario activo con rol, cuando inicio sesión, entonces accedo solo a las funciones de mi rol y, tras 10 min sin actividad, la sesión se cierra. |
| **HU11** | Como administrador, quiero que quede registrado quién lee o modifica datos del paciente y de la HCE, para cumplir la Ley N.° 29733. | Auditoría · SMART 3 | Dado que un usuario lee o escribe datos del paciente, cuando la operación se confirma, entonces queda un registro (usuario, acción, fecha/hora, paciente) que nadie puede modificar ni borrar. |
| **HU12** | Como gerencia médica, quiero ver indicadores de ocupación, inasistencia, tiempos de espera e ingresos por periodo. | M5 · RF10 | Dado datos de un periodo, cuando consulto el reporte, entonces veo cada indicador calculado para ese periodo. **Estimación inicial: 13 → se divide** en HU12a (ocupación e inasistencia) y HU12b (tiempos de espera e ingresos por convenio). |

### 2.2 Planning poker

- **Historia de referencia:** HU08 *Anular entrada de HCE* = **2 puntos** (un endpoint, un diálogo y una tabla ya diseñada).
- **Serie:** 1, 2, 3, 5, 8, 13. Voto en secreto; si difieren, el voto más alto y el más bajo explican y se repite hasta el consenso.
- **Regla:** toda historia de más de 8 puntos se divide antes de entrar a un Sprint (caso HU12: 13 → 5 + 5).
- **Puntos propuestos:** parten de las estimaciones ya acordadas en la Semana 3 (HU01–HU05) y de la comparación con la referencia. **Los votos reales los llena el equipo en la sesión** (D = David, H = Henry, R = Romel).

| Orden | Historia | Prioridad | Votos del equipo (D / H / R) | Puntos acordados | Justificación de la comparación |
| --- | --- | --- | --- | --- | --- |
| 1 | HU10 Iniciar sesión y roles | Must | ____ / ____ / ____ | **5** | Incluye hash Argon2id, sesión en BD, cierre a los 10 min y guards por rol; es la base del resto. |
| 2 | HU06 Registrar paciente y antecedentes | Must | ____ / ____ / ____ | **3** | CRUD con validación de documento; más que la referencia (2) por tener dos tablas y búsqueda. |
| 3 | HU01 Registrar cita sin duplicados | Must | ____ / ____ / ____ | **5** | Restricción `EXCLUDE` en BD, transacción y error de negocio; el riesgo es la concurrencia. |
| 4 | HU11 Bitácora de auditoría | Must | ____ / ____ / ____ | **3** | Interceptor global y tabla de solo anexado; el diseño ya existe. |
| 5 | HU03 Historia clínica unificada | Must | ____ / ____ / ____ | **8** | Consulta que cruza pacientes, agenda y HCE, con la meta de < 2 s con 8 000 pacientes. |
| 6 | HU07 Registrar consulta (CIE-10, indicaciones, receta) | Must | ____ / ____ / ____ | **8** | Cuatro tablas hijas, catálogo CIE-10, solo anexado y auditoría. |
| 7 | HU08 Anular entrada de HCE | Must | ____ / ____ / ____ | **2** | **Referencia.** |
| 8 | HU09 Reprogramar cita | Must | ____ / ____ / ____ | **3** | Reutiliza HU01; añade historial con valor anterior. |
| 9 | HU04 Resultado digital de laboratorio | Must | ____ / ____ / ____ | **5** | Carga de valor o archivo y publicación en la HCE. |
| 10 | HU02 Recordatorio automático | Should | ____ / ____ / ____ | **3** | Consumidor del *outbox*; el riesgo es el proveedor de correo/SMS. |
| 11 | HU05 Comprobante según convenio | Should | ____ / ____ / ____ | **5** | Tarifario con vigencias, copago y foto del precio al emitir. |
| 12 | HU12a Reportes: ocupación e inasistencia | Should | ____ / ____ / ____ | **5** | Dos vistas de solo lectura con filtro por periodo. |
| 13 | HU12b Reportes: tiempos de espera e ingresos | Should | ____ / ____ / ____ | **5** | Dos vistas más, con cruce a facturación. |
| | **Total del backlog** | | | **60** | Must = 42 · Should = 18 |

---

## Paso 3 — Definición de Hecho y Meta del Sprint

### Definición de Hecho (DoD)

| N.º | Criterio verificable de la Definición de Hecho |
| --- | --- |
| 1 | El código está integrado a la rama principal mediante un *pull request* aprobado por otro integrante del equipo. |
| 2 | Las pruebas unitarias y de integración pasan en la integración continua (GitHub Actions) y el código nuevo tiene una cobertura de al menos 70 %. |
| 3 | Los criterios de aceptación (Dado / Cuando / Entonces) de la historia fueron probados en el entorno de pruebas y el Product Owner los aprobó. |
| 4 | La verificación de fronteras entre módulos (`dependency-cruiser`) termina con 0 violaciones. |
| 5 | Los endpoints nuevos están documentados en OpenAPI y están protegidos por el *guard* del rol correspondiente. |
| 6 | Todo cambio en la base de datos es una migración versionada que se ejecuta sin errores sobre una base vacía, con datos de prueba ficticios. |
| 7 | Toda operación que lee o escribe datos del paciente queda registrada en la bitácora de auditoría. |
| 8 | No hay errores abiertos de prioridad alta y la versión está desplegada en el entorno de pruebas con su *health check* en verde. |

### Meta del Sprint 1

> **"Que el personal de admisión pueda iniciar sesión con su rol, registrar pacientes y reservar citas sin duplicados, con cada operación auditada, en el entorno de pruebas."**

---

## Paso 4 — Sprint Backlog 1

**Capacidad.** Equipo nuevo de 3 personas, Sprint de 3 semanas, de 5 a 6 puntos por integrante según la guía → 15 a 18 puntos. Se toma **16 puntos** (≈ 5,3 por integrante): el Examen Parcial (S8) queda fuera del Sprint, que empieza el 26/10.

**Historias elegidas por prioridad y dependencia:** HU10 (base de seguridad) → HU06 → HU01 → HU11 (la auditoría se construye una vez como interceptor y se aplica a pacientes y citas; en el Sprint 2 cubre la HCE sin trabajo extra).

| Historia | Puntos | Tareas (≤ 1 día) | Responsable | Días |
| --- | --- | --- | --- | --- |
| **HU10** Iniciar sesión y roles | **5** | Monorepo pnpm (`apps/api`, `apps/web`), ESLint/Prettier y CI en GitHub Actions | Romel | 1 |
| | | Docker Compose de desarrollo (PostgreSQL 18, API, web, Caddy) | Romel | 1 |
| | | `dependency-cruiser` en CI (0 violaciones) | Romel | 0.5 |
| | | Migración del esquema `seguridad` y datos de 4 roles (a partir del script de la Semana 6) | David | 0.5 |
| | | `POST /auth/login`, `/auth/logout`, `GET /auth/me` con Passport, Argon2id y sesión en PostgreSQL | Henry | 1 |
| | | Expiración deslizante a 10 min y cookie `HttpOnly` / `Secure` / `SameSite` | Henry | 0.5 |
| | | *Guards* RBAC y decorador `@Roles` (médico, enfermera, admisión, administrador) | Henry | 1 |
| | | Pantalla P1 Inicio de sesión (Next.js) con mensajes de error | David | 1 |
| | | Pruebas: hash sin texto plano, login fallido, cierre por inactividad y acceso denegado por rol | David | 1 |
| **HU06** Registrar paciente | **3** | Migración del esquema `pacientes` (paciente, antecedente) con `CHECK` y `UNIQUE` de documento | David | 0.5 |
| | | `POST/GET/PUT /pacientes` y `POST /pacientes/{id}/antecedentes` con validación de DNI | Henry | 1 |
| | | Pantalla registrar y buscar paciente (DNI o apellidos) | David | 1 |
| | | Pruebas de integración: DNI duplicado (409) y DNI inválido | Romel | 0.5 |
| **HU01** Registrar cita sin duplicados | **5** | Migración del esquema `agenda` (especialidad, consultorio, médico, horario, cita con `EXCLUDE`, historial) y datos ficticios | Romel | 1 |
| | | `GET /citas/disponibilidad/{medico_id}` | Henry | 1 |
| | | `POST /citas` en una transacción; traducir la violación de `EXCLUDE` a "horario no disponible" | Henry | 1 |
| | | Fijar `app.usuario_id` por transacción para el historial de la cita | Henry | 0.5 |
| | | Pantalla de agenda, pasos 1 y 2 (paciente, médico y horario) | David | 1 |
| | | Pantalla de agenda, paso 3, éxito y error "horario tomado" | David | 1 |
| | | Prueba de concurrencia: 50 solicitudes al mismo horario, solo 1 se confirma | Romel | 1 |
| | | Despliegue al entorno de pruebas (VPS) con *health check* | Romel | 1 |
| **HU11** Bitácora de auditoría | **3** | Migración del esquema `auditoria` (solo anexado) y permisos del rol de aplicación | Romel | 0.5 |
| | | `AuditoriaService` e interceptor global (quién, qué, cuándo, paciente) | Henry | 1 |
| | | `GET /auditoria?paciente_id=` (solo administrador) | David | 0.5 |
| | | Pruebas: 100 % de operaciones sobre pacientes y citas registradas; `UPDATE` y `DELETE` rechazados | David | 1 |

**Capacidad estimada del equipo: 16 puntos. Total comprometido: 16 puntos** (HU10 5 + HU06 3 + HU01 5 + HU11 3).

**Carga por persona (tareas):** David 7.5 días · Henry 7 días · Romel 6.5 días · total 21 días-persona. Romel tiene menos carga de desarrollo por su rol de Scrum Master en este Sprint.

---

## Paso 5 — Plan de release y tablero

### 5.1 Plan de release

Calendario del curso: la Semana 2 empezó el lunes 07/09/2026 (Acta del 10/09). Hitos fijos: **Examen Parcial en S8** y **Examen Final en S16**.

| Periodo | Hito o Sprint | Contenido previsto |
| --- | --- | --- |
| S7 · 12–16/10 | Avance 4 · Planning del Sprint 1 | Roles, estimación, DoD, Sprint Backlog 1 y tablero. |
| S8 · 19–23/10 | **Examen Parcial** — sustentación del Entregable 1 | Documentación de ingeniería (Semanas 2–7). Sin trabajo de Sprint. |
| S9–S11 · 26/10–13/11 | **Sprint 1** — Acceso y Agenda | HU10 sesión y roles · HU06 pacientes · HU01 citas sin duplicados · HU11 auditoría (16 pts). Despliegue al entorno de pruebas. |
| S12 · 16–20/11 | Review, Retro y Planning del Sprint 2 | Demo al Product Owner, recalibrar la velocidad y ajustar el alcance. |
| S13–S15 · 23/11–11/12 | **Sprint 2** — Historia clínica | HU03 historia unificada · HU07 consulta · HU08 anulación (18 pts, si la velocidad sube a 6 por integrante). Pruebas de carga y ensayo de restauración. Feriado del 8/12. |
| S16 · 14–18/12 | **Examen Final** — sustentación del Entregable 2 | Producto funcionando en el entorno desplegado. |

### 5.2 Pronóstico del alcance frente a la capacidad (riesgo del plan)

| Concepto | Puntos |
| --- | --- |
| Capacidad estimada: Sprint 1 (16) + Sprint 2 (18, si mejora la velocidad) | 34 |
| Backlog **Must** (HU01, 03, 04, 06, 07, 08, 09, 10, 11) | 42 |
| Backlog **Should** (HU02, 05, 12a, 12b) | 18 |
| **Must que no caben:** HU09 Reprogramar cita (3) y HU04 Laboratorio (5) | 8 |

- **El plan no cubre todo el alcance del Acta.** El Acta pedía M1 y M2 completos "al cierre del Sprint 1" y M3, M4 y M5 en el Sprint 2. Con la capacidad de un equipo de 3, el calendario del curso solo da para dos Sprints de desarrollo.
- **Primer candidato a adelantar:** HU09 (3 pts, Must de M2) entra al Sprint 1 si el equipo termina antes de lo previsto.
- **Qué se propone al docente** en la retroalimentación: (1) el Entregable 2 prioriza M1 y M2 como núcleo; (2) M3, M4 y M5 se entregan en la medida que la velocidad real lo permita, con HU04 como primera; (3) se actualiza la redacción de los objetivos SMART del Acta para que hablen de "Release 1" y no de "Sprint 1".
- **Se recalibra** en el Review del Sprint 1 (S12) con la velocidad real medida.

### 5.3 Tablero Kanban del Sprint 1

Columnas: **Por hacer · En progreso · En revisión · Hecho**. Estado inicial (el Sprint empieza el 26/10): las cuatro historias en *Por hacer*.

| Por hacer (4) | En progreso (0) | En revisión (0) | Hecho (0) |
| --- | --- | --- | --- |
| **HU10** Iniciar sesión y roles (5) | | | |
| **HU06** Registrar paciente (3) | | | |
| **HU01** Registrar cita sin duplicados (5) | | | |
| **HU11** Bitácora de auditoría (3) | | | |

**Herramienta:** GitHub Projects (el equipo ya usa GitHub y Actions). Cada tarea de la tabla del Paso 4 es una tarjeta hija con su responsable y los días como estimación; el DoD se pega como lista de verificación en cada historia.

**Captura del tablero:** `____` (pegar aquí la imagen)
**Enlace al tablero:** `____`

---

# Parte B — Documentación consolidada (Semanas 2 a 6)

## B.1 Datos generales (Semana 2 · Acta de constitución)

| Campo | Detalle |
| --- | --- |
| Proyecto | Sistema de Información Clínico-Administrativo (SIGC) — Clínica San Rafael S.A.C. |
| Patrocinador | Gerencia General, Clínica San Rafael S.A.C. |
| Equipo | Equipo C (3 integrantes) |
| Fecha del acta | Semana 2 — 10/09/2026 |
| Product Owner de referencia | José Carlos García La Riva |
| Roles de ingeniería | David Luza Ccorimanya (Project Manager) · Romel Rodrigo Chumpitaz Flores (DevOps) · Henry Javier Medina Malpartida (Full Stack) |

**Caso.** Clínica privada de salud en San Borja, Lima: consulta ambulatoria multiespecialidad, laboratorio, imágenes, farmacia, hospitalización, emergencia y cirugía ambulatoria. Hoy gestiona historias clínicas en papel/Excel por especialidad, una agenda telefónica saturada (18 % de inasistencia), resultados de laboratorio en papel (hasta 48 h de demora) y reconciliación manual con 5 EPS y aseguradoras.

**Justificación.** Centralizar la información, garantizar la trazabilidad y la seguridad, optimizar los tiempos de consulta y reducir las inasistencias con una agenda en línea.

### Objetivos SMART (todos "al cierre del Sprint 1")

| N.° | Objetivo |
| --- | --- |
| 1 | M1 (HCE) con el 100 % de sus RF aprobados en pruebas de aceptación (registro, consulta y anulación con motivo, CIE-10, indicaciones y recetas) y apertura de la historia en < 2 s con 8 000 registros ficticios. |
| 2 | M2 (Agenda y citas) con el 100 % de sus RF aprobados (programación por especialidad, reprogramación en línea, recordatorios para ≥ 90 % de las citas del entorno de prueba). |
| 3 | Controles de seguridad de la Ley N.° 29733 sobre M1: RBAC con ≥ 4 perfiles (médico, enfermera, admisión, administrador) y bitácora del 100 % de lecturas y escrituras sobre la HCE. |
| 4 | Validar el flujo completo M1–M2 (de la cita al registro de la consulta) con ≥ 3 escenarios de aceptación extremo a extremo con datos ficticios. |

### Alcance por módulos

| Módulo | Alcance | Prioridad |
| --- | --- | --- |
| M1 · Historia clínica electrónica | Registro unificado: antecedentes, consultas, diagnósticos CIE-10, indicaciones y recetas | Sprint 1 (imprescindible) |
| M2 · Agenda y citas | Programación por especialidad y médico, recordatorio, reprogramación, disponibilidad consolidada | Sprint 1 (imprescindible) |
| M3 · Laboratorio e imágenes | Órdenes médicas y resultados digitales | Sprint 2 (imprescindible) |
| M4 · Facturación y convenios | Comprobantes, tarifario por convenio, copagos y glosas | Sprint 2 (imprescindible) |
| M5 · Reportes gerenciales | Ocupación, tiempos de espera, ingresos, inasistencia | Sprint 2 (imprescindible) |
| M6 · Portal del paciente / telemedicina | Agendamiento en línea y consulta virtual básica | Sprint 2 (deseable) |

### Exclusiones, supuestos y restricciones

| Tipo | Detalle |
| --- | --- |
| Exclusión 1 | Integración en tiempo real (API) con los sistemas de las 5 EPS y aseguradoras (carga manual o archivos planos). |
| Exclusión 2 | Módulos de Hospitalización y Cirugía Ambulatoria. |
| Exclusión 3 | Migración masiva de historias clínicas en papel (solo data activa y resumida de los últimos 2 años). |
| Supuesto 1 | La clínica proporciona un servidor o cuenta en la nube con recursos mínimos. |
| Supuesto 2 | El personal recibe capacitación básica antes de la puesta en marcha. |
| Restricción | Todo dato de prueba es ficticio o anonimizado; nunca datos reales de pacientes. Presupuesto de infraestructura acotado. |

### Riesgos iniciales

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Baja adopción por resistencia al cambio | Alto | Usuarios clave desde el diseño, capacitación temprana, interfaz simple. |
| Pérdida de datos por fallo de infraestructura | Alto | Respaldos automáticos diarios y plan de recuperación documentado. |
| Incumplimiento de la Ley N.° 29733 | Alto | Acceso por roles, bitácora de auditoría y anonimización en pruebas. |
| Retrasos en los módulos críticos del Sprint 1 | Alto | Priorizar M1 y M2, seguimiento semanal y MVP funcional antes de lo secundario. **Ver el pronóstico del Paso 5.2: el riesgo se confirma con los números.** |
| Retraso en la definición de requerimientos | Medio | Sesiones semanales con el Product Owner y prototipos tempranos. |

### Hitos del curso

| Semana | Hito |
| --- | --- |
| 2 | Acta de constitución y documento de visión |
| 4 | Especificación de requerimientos, backlog y modelos UML |
| 6 | Arquitectura, modelo de base de datos y prototipo UX/UI |
| 7 | Plan de release y Sprint Backlog 1 (este avance) |
| 8 | Examen Parcial — sustentación del Entregable 1 |
| 16 | Examen Final — sustentación del Entregable 2 (producto funcionando) |

## B.2 Documento de visión (Semana 2)

**Declaración de visión.** Para el personal administrativo, médico y pacientes de la Clínica San Rafael S.A.C. que necesitan gestionar de manera rápida, segura y centralizada la información clínica y las citas, el SIGC es un sistema web de gestión clínica que centraliza las historias clínicas, optimiza la programación de citas y facilita el acceso oportuno a la información; a diferencia de la gestión actual con papel/Excel y agenda telefónica, que genera duplicidad, demoras, errores administrativos y alta inasistencia.

| Perfil | Necesidad principal | Módulo |
| --- | --- | --- |
| Admisión / Recepción | Registrar pacientes, gestionar, confirmar y reprogramar citas, consultar disponibilidad | M1, M2 |
| Médico tratante | Consultar la historia, registrar consultas, diagnósticos, indicaciones y recetas | M1 |
| Enfermera | Consultar y registrar información de la atención | M1 |
| Personal de laboratorio | Registrar órdenes y cargar resultados digitales | M3 |
| Cajero / Facturación | Comprobantes, tarifas por convenio, copagos y glosas | M4 |
| Gerencia médica | Indicadores de ocupación, espera, ingresos e inasistencia | M5 |
| Paciente | Gestionar sus citas, atención virtual básica | M2, M6 |
| Aseguradoras EPS/SOAT | Recibir información digital y estandarizada para validar cobros y reducir glosas | M4 |

**Factibilidad.** *Técnica:* sistema web con base de datos centralizada, autenticación, RBAC y auditoría, desplegable en hosting de costo moderado. *Operativa:* responde a los problemas actuales y se acompaña de capacitación y pruebas de usabilidad. *Económica:* tecnologías de código abierto e infraestructura de costo moderado, con desarrollo por etapas.

## B.3 Requerimientos y backlog (Semana 3 · Guía práctica)

### Hallazgos de la educción

| N.º | Hallazgo |
| --- | --- |
| 1 | Admisión: agendar por teléfono toma hasta 20 min; cada especialidad tiene su agenda en papel/Excel, hay citas duplicadas y ~18 % de inasistencia sin recordatorios. |
| 2 | Médico: no ve el historial de un paciente atendido por otra especialidad; ya hubo un error de medicación por desconocer un tratamiento previo. |
| 3 | Laboratorio: resultados en papel con hasta 48 h de demora y órdenes físicas extraviadas. |
| 4 | Facturación: reconciliación manual con 5 EPS, errores de tarifa por convenio y más glosas. |
| 5 | Gerencia: no hay reporte consolidado de ocupación, tiempos de espera e inasistencia. |

### Requerimientos funcionales

| ID | Descripción | Módulo | Prioridad |
| --- | --- | --- | --- |
| RF01 | Registrar datos personales y antecedentes de un paciente en su primera atención. | M1 | Must |
| RF02 | Mostrar la historia clínica de forma unificada, sin importar la especialidad. | M1 | Must |
| RF03 | Registrar una consulta con diagnóstico CIE-10, indicaciones y receta. | M1 | Must |
| RF04 | Anular una entrada de la historia indicando un motivo, sin eliminarla físicamente. | M1 | Must |
| RF05 | Registrar una cita (paciente, médico, especialidad, fecha/hora y motivo). | M2 | Must |
| RF06 | Enviar un recordatorio automático antes de la cita. | M2 | Must |
| RF07 | Reprogramar una cita y actualizar la disponibilidad del médico. | M2 | Must |
| RF08 | Registrar una orden de laboratorio y asociarle un resultado digital consultable desde la HCE. | M3 | Should |
| RF09 | Generar un comprobante con la tarifa del convenio (particular, EPS o SOAT). | M4 | Should |
| RF10 | Reporte de ocupación de consultorios, tiempos de espera e inasistencia por periodo. | M5 | Should |

### Requerimientos no funcionales

| ID | Descripción | Categoría | Verificación |
| --- | --- | --- | --- |
| RNF01 | Confirmación de una cita (creación o reprogramación) en < 3 s. | Rendimiento | Prueba de carga con 50 solicitudes concurrentes. |
| RNF02 | Contraseñas con hash + salt; cierre de sesión tras 10 min de inactividad. | Seguridad | Revisión de la BD y prueba funcional de cierre por inactividad. |
| RNF03 | Disponibilidad ≥ 99 % mensual en emergencia y agenda (excluye mantenimiento avisado con 24 h). | Disponibilidad | Monitoreo de uptime y registro de incidencias. |
| RNF04 | Todo cambio en una cita queda registrado con usuario, fecha/hora y valor anterior, sin sobrescritura. | Trazabilidad | Modificar una cita y revisar el historial. |
| RNF05 | Personal con alfabetización digital básica registra una cita en ≤ 3 pasos. | Usabilidad | Prueba de usabilidad con admisión. |

Además, los RNF mínimos dados por el caso: seguridad con bitácora (Ley N.° 29733), disponibilidad en horario de atención, apertura de la HCE en < 2 s con hasta 8 000 pacientes, trazabilidad (sin borrado físico) y usabilidad.

### Backlog priorizado (MoSCoW) — situación tras este avance

| ID | Historia (resumen) | Módulo | MoSCoW | Sprint previsto | Puntos |
| --- | --- | --- | --- | --- | --- |
| HU10 | Iniciar sesión y roles | Seguridad | Must | Sprint 1 | 5 |
| HU06 | Registrar paciente y antecedentes | M1 | Must | Sprint 1 | 3 |
| HU01 | Registrar cita evitando duplicados | M2 | Must | Sprint 1 | 5 |
| HU11 | Bitácora de auditoría | Auditoría | Must | Sprint 1 | 3 |
| HU03 | Historia clínica unificada | M1 | Must | Sprint 2 | 8 |
| HU07 | Registrar consulta | M1 | Must | Sprint 2 | 8 |
| HU08 | Anular entrada de HCE | M1 | Must | Sprint 2 | 2 |
| HU09 | Reprogramar cita | M2 | Must | Por definir (primer candidato a adelantar) | 3 |
| HU04 | Resultado digital de laboratorio | M3 | Must | Por definir (en riesgo) | 5 |
| HU02 | Recordatorio automático de cita | M2 | Should | Por definir | 3 |
| HU05 | Comprobante según convenio | M4 | Should | Por definir | 5 |
| HU12a | Reportes: ocupación e inasistencia | M5 | Should | Por definir | 5 |
| HU12b | Reportes: tiempos de espera e ingresos | M5 | Should | Por definir | 5 |

*Las historias HU01–HU05 conservan la estimación y el texto de la Semana 3; HU06–HU12 son nuevas (Paso 2.1). En la Semana 3, HU02 estaba en el Sprint 1; en este plan pasa a "por definir" porque el Sprint 1 queda ocupado por la base de seguridad y agenda.*

## B.4 Arquitectura (Semana 5 · SAD)

**Estilo elegido: monolito modular** (un solo despliegue, un módulo por contexto de negocio con API pública y reglas de dependencia). Se descartaron el monolito en capas tradicional (módulos acoplados) y los microservicios (equipo de 3, un semestre, transacciones entre módulos que exigirían sagas y chocan con la prioridad de integridad).

### Atributos de calidad

| Atributo | Métrica | Riesgo si no se cumple |
| --- | --- | --- |
| Integridad de datos | 0 citas solapadas por médico (50 solicitudes concurrentes, solo 1 se confirma); 0 entradas de HCE eliminadas; operaciones multi-tabla en una transacción. | Citas duplicadas, errores de medicación, incumplimiento de la Ley N.° 29733. |
| Disponibilidad | ≥ 99 % mensual; RPO ≤ 24 h; RTO ≤ 4 h con restauración ensayada. | Sin agenda ni HCE la atención se detiene; pérdida de datos. |
| Rendimiento | HCE < 2 s (P95) con 8 000 pacientes; cita < 3 s con 50 concurrentes. | Retorno al papel; baja adopción. |
| Seguridad y trazabilidad | RBAC ≥ 4 perfiles; bitácora del 100 % de lecturas y escrituras; hash + salt; cierre a los 10 min; TLS. | Acceso indebido a datos de salud, sanciones. |
| Modificabilidad y escalabilidad | Agregar un módulo sin tocar M1 ni M2 (0 violaciones en CI); API *stateless* con ≥ 2 réplicas. | El Sprint 2 rompe lo aceptado del Sprint 1. |

### Decisiones de arquitectura (ADR)

| ADR | Decisión | Atributo principal |
| --- | --- | --- |
| ADR-01 | Monolito modular como estilo arquitectónico | Modificabilidad, costo |
| ADR-02 | PostgreSQL único con un esquema por módulo (con `uuidv7()` nativo de PostgreSQL 18) | Integridad |
| ADR-03 | Prevención de doble reserva con restricción de exclusión en la BD (`EXCLUDE USING gist`) | Integridad |
| ADR-04 | HCE de solo anexado: anulación lógica con motivo; sin `DELETE` ni `UPDATE` sobre el contenido clínico | Integridad, trazabilidad |
| ADR-05 | Comunicación entre módulos: API pública en proceso y eventos internos con *transactional outbox* | Modificabilidad, disponibilidad |
| ADR-06 | Seguridad: RBAC, sesión en servidor (Passport + `express-session` en PostgreSQL, Argon2id) y bitácora de auditoría | Seguridad |
| ADR-07 | Despliegue en contenedores (Docker Compose + Caddy) en un servidor en la nube con respaldos externos cifrados | Disponibilidad, costo |
| ADR-08 | Integración con EPS/aseguradoras por archivos planos mediante un adaptador | Alcance, modificabilidad |
| ADR-09 | Next.js solo como capa de presentación; toda la lógica vive en NestJS | Integridad, modificabilidad |

### Vistas y stack

- **Vistas (Structurizr DSL):** contexto, contenedores, componentes (vista lógica) y despliegue (vista física). El DSL completo está en `arquitectura-clinica-san-rafael.md`.
- **Dependencias entre módulos (un solo sentido, sin ciclos):** `hce → pacientes, agenda` · `agenda → pacientes` · `laboratorio → hce, pacientes` · `facturacion → agenda, pacientes` · `reportes → agenda, facturacion` (solo lectura) · `agenda → notificaciones` (evento) · todos → `auditoria`.

| Componente | Tecnología |
| --- | --- |
| Backend | Node.js LTS + NestJS + TypeScript |
| Frontend | Next.js (App Router) + TypeScript, solo presentación |
| Base de datos | PostgreSQL 18 (`btree_gist`), TypeORM con migraciones SQL |
| Seguridad | Passport, `express-session`, `connect-pg-simple`, `argon2` |
| Eventos | `@nestjs/event-emitter`, `@nestjs/schedule`, tabla *outbox* |
| Contrato de API | OpenAPI (`@nestjs/swagger`) y cliente TypeScript generado |
| Verificación de fronteras | `dependency-cruiser`, `eslint-plugin-boundaries` en CI |
| Despliegue | Docker, Docker Compose, Caddy, VPS y almacenamiento compatible con S3 para respaldos |
| CI/CD | GitHub y GitHub Actions |
| Pruebas | Jest, Supertest, Testcontainers, k6, Playwright |
| Monitoreo | `@nestjs/terminus` y un monitor externo de disponibilidad |

## B.5 Diseño de componentes, datos y prototipo (Semana 6)

### Componentes (un módulo = un esquema)

| Módulo (esquema) | Responsabilidad única | Historias |
| --- | --- | --- |
| Seguridad (`seguridad`) | Autenticación, sesión (10 min) y RBAC | HU10 (RNF02) |
| Auditoría (`auditoria`) | Bitácora de solo anexado | HU11 (Ley N.° 29733) |
| M1 · Pacientes (`pacientes`) | Datos personales y antecedentes; identificador único compartido | HU06 (RF01) |
| M1 · HCE (`hce`) | Registrar, consultar y anular consultas sin borrado físico | HU03, HU07, HU08 |
| M2 · Agenda (`agenda`) | Programar, reprogramar y cancelar citas sin doble reserva | HU01, HU09 |
| M2 · Notificaciones (`notificaciones`) | Recordatorios por correo/SMS desde eventos de cita | HU02 |
| M3 · Laboratorio (`laboratorio`) | Órdenes y resultados digitales | HU04 |
| M4 · Facturación (`facturacion`) | Tarifario por convenio, comprobantes, copagos y glosas | HU05 |
| M5 · Reportes (`reportes`, solo vistas) | Indicadores de ocupación, espera, inasistencia e ingresos | HU12 (RF10) |
| M6 · Portal del paciente | Deseable; no se diseñó | — |

### Modelo de datos

- **31 tablas y 4 vistas** de reportes en PostgreSQL 18, un esquema por módulo, en 3FN. El DBML para dbdiagram.io y los scripts `01_schema.sql` y `02_data.sql` (datos ficticios) están en `claude/guia-semana6-clinica-san-rafael.md`.
- **Reglas dentro de la base de datos:** `EXCLUDE` para citas sin solape (por médico y por consultorio), tarifas sin vigencias solapadas y un solo convenio vigente por paciente; *triggers* de solo anexado en la HCE, la bitácora y el historial de citas; `CHECK` de formato de DNI, motivo de anulación ≥ 10 caracteres y copago ≤ precio.
- **Decisiones de normalización clave:** el estado de una entrada de HCE (vigente o anulada) y el de un ítem de laboratorio (pendiente o con resultado) **se derivan**, no se guardan; el precio y el copago del comprobante son una **foto** de la tarifa al emitir (desnormalización consciente).
- **Ajuste pendiente en el SAD:** el ADR-02 no listaba el esquema `notificaciones`, que el script sí crea.

### Prototipo UX/UI

| Pantalla | Historia | Meta de usabilidad |
| --- | --- | --- |
| P1 · Inicio de sesión | HU10 | Ingresar en < 15 s |
| P2 · Agenda: reservar cita en 3 pasos | HU01 (y HU02 en la confirmación) | < 60 s y ≤ 3 pasos (RNF05) |
| P3 · Historia clínica unificada | HU03, HU08 | Encontrar la última consulta de otra especialidad en < 30 s |
| P4 · Laboratorio: cargar resultado | HU04 | < 90 s |
| P5 · Facturación: emitir comprobante | HU05 | < 60 s |

Las heurísticas de Nielsen aplicadas y el prompt de Google Stitch están en el documento de la Semana 6.

### Matriz de trazabilidad (resumen)

| Historia | Pantalla | Componente | Tablas principales |
| --- | --- | --- | --- |
| HU01 | P2 | M2 Agenda (`POST /citas`, disponibilidad) | `agenda.cita`, `medico`, `especialidad`, `consultorio`, `cita_historial`, `pacientes.paciente` |
| HU02 | P2 · paso 3 | Agenda → Notificaciones (*outbox*) | `agenda.outbox_evento`, `notificaciones.recordatorio` |
| HU03 | P3 | M1 HCE (`GET /pacientes/{id}/historia`) | `hce.entrada`, `diagnostico`, `cie10`, `indicacion`, `receta_item`, `anulacion` |
| HU04 | P4 | M3 Laboratorio | `laboratorio.orden`, `orden_item`, `examen`, `resultado` |
| HU05 | P5 | M4 Facturación | `facturacion.comprobante`, `comprobante_item`, `tarifa`, `convenio`, `paciente_convenio`, `glosa` |
| RF04 → HU08 | P3 (diálogo "Anular") | M1 HCE (`POST /consultas/{id}/anular`) | `hce.anulacion` |

Con las historias HU06 a HU12 creadas en este avance, cada tabla y cada RF del diseño queda cubierto por una historia del backlog.

---

# Pendientes y decisiones abiertas

| # | Pendiente | Responsable sugerido |
| --- | --- | --- |
| 1 | **Planning poker real:** completar la columna de votos del Paso 2 y confirmar o corregir los puntos propuestos. | Todo el equipo |
| 2 | **Tablero:** crear el tablero (GitHub Projects), cargar las tareas del Paso 4 y pegar captura y enlace en el Paso 5.3. | Romel (Scrum Master) |
| 3 | **Alcance vs. capacidad:** 8 puntos de historias Must no caben (HU09 y HU04); llevar la propuesta del Paso 5.2 al docente. | Henry (PO) |
| 4 | **Redacción del Acta:** los objetivos SMART dicen "al cierre del Sprint 1"; el plan los cumple al cierre del Sprint 2. | David (PM) |
| 5 | **Prototipo (Semana 6):** falta el enlace de Stitch, las capturas y los tiempos medidos de las 5 pantallas. | Todo el equipo |
| 6 | **ADR-02:** agregar el esquema `notificaciones` al SAD. | Henry |
| 7 | **Carátula de la guía:** figuran 2 códigos de alumno para 3 integrantes. | David |
