**UNIVERSIDAD NACIONAL DE INGENIERÍA**
 
Facultad de Ingeniería Industrial y de Sistemas · Escuela de Ingeniería de Software
 
**TALLER DE INGENIERÍA DE SOFTWARE I (SW705)**
 
**GUÍA PRÁCTICA — SEMANA 3**
 
*Ingeniería de requerimientos aplicada: educción, especificación y backlog priorizado*
 
Caso: Clínica San Rafael S.A.C. — Equipo C
 
**Equipo C — Integrantes y roles**
 
- David Luza Ccorimanya — Project Manager
 
- Romel Rodrigo Chumpitaz Flores — DevOps
 
- Henry Javier Medina Malpartida — Full Stack
 
**Paso 1 — Educción de requerimientos**
 
Hallazgos obtenidos a partir del caso empresarial y de las entrevistas simuladas con los perfiles de usuario definidos en el documento de visión (admisión, médico, enfermera, personal de laboratorio, cajero y gerencia médica).
 
| **N.º** | **Hallazgo de la educción de requerimientos** |
| --- | --- |
| 1 | Entrevista con personal de admisión: agendar una cita por teléfono toma hasta 20 minutos porque cada especialidad maneja su propia agenda en papel/Excel; esto genera citas duplicadas y una tasa de inasistencia cercana al 18 % por no contar con recordatorios automáticos. |
| 2 | Entrevista con un médico tratante: no puede ver el historial de un paciente atendido antes por otra especialidad porque cada especialidad guarda su propia historia clínica en papel/Excel; esto ya generó un error de medicación por desconocer un tratamiento previo. |
| 3 | Entrevista con personal de laboratorio: los resultados de análisis se entregan en papel y demoran hasta 48 horas en llegar al médico solicitante, y en varias ocasiones la orden física se ha extraviado antes de ser registrada. |
| 4 | Entrevista con el cajero/facturación: la reconciliación de comprobantes con las 5 EPS y aseguradoras se hace manualmente, lo que produce errores en el cálculo de tarifas por convenio y un incremento de glosas administrativas. |
| 5 | Entrevista con gerencia médica: no existe un reporte consolidado de ocupación de consultorios, tiempos de espera e inasistencia; las decisiones de gestión se toman con información parcial y desactualizada. |
 
**Paso 2 — Requerimientos funcionales (RF)**
 
Se redactan al menos 6 RF verificables, trazables a la visión del proyecto y distribuidos entre los módulos imprescindibles (M1, M2) y los módulos del Sprint 2 (M3, M4, M5).
 
| **ID** | **Descripción** | **Módulo** | **Prioridad** |
| --- | --- | --- | --- |
| RF01 | El sistema debe permitir registrar los datos personales y antecedentes de un paciente al momento de su primera atención. | M1 | Must |
| RF02 | El sistema debe mostrar la historia clínica de un paciente de forma unificada, sin importar la especialidad que la registró. | M1 | Must |
| RF03 | El sistema debe permitir registrar una consulta indicando diagnóstico codificado en CIE-10(que es la 10.ª edición de la Clasificación Internacional de Enfermedades), indicaciones y receta. | M1 | Must |
| RF04 | El sistema debe permitir anular una entrada de historia clínica indicando un motivo, sin eliminarla físicamente. | M1 | Must |
| RF05 | El sistema debe permitir registrar una cita indicando paciente, médico, especialidad, fecha/hora y motivo. | M2 | Must |
| RF06 | El sistema debe enviar un recordatorio automático al paciente antes de la fecha y hora de su cita. | M2 | Must |
| RF07 | El sistema debe permitir reprogramar una cita existente y actualizar la disponibilidad del médico. | M2 | Must |
| RF08 | El sistema debe permitir registrar una orden de laboratorio y asociarle un resultado digital consultable desde la historia clínica. | M3 | Should |
| RF09 | El sistema debe generar un comprobante aplicando la tarifa correspondiente al convenio del paciente (particular, EPS o SOAT). | M4 | Should |
| RF10 | El sistema debe generar un reporte de ocupación de consultorios, tiempos de espera e inasistencia por periodo. | M5 | Should |
 
**Paso 3 — Requerimientos no funcionales (RNF)**
 
Se cubren las cinco categorías sugeridas, alineadas con los RNF mínimos ya definidos para el caso en el Entregable 1.
 
| **ID** | **Descripción** | **Categoría** | **Verificación** |
| --- | --- | --- | --- |
| RNF01 | La confirmación de una cita médica (creación o reprogramación) debe completarse en menos de 3 segundos desde que el usuario envía la solicitud. | Rendimiento | Prueba de carga simulando 50 solicitudes concurrentes de agendamiento, midiendo el tiempo de respuesta promedio y máximo. |
| RNF02 | Toda contraseña de acceso al sistema debe almacenarse cifrada (hash + salt) y las sesiones inactivas deben cerrarse automáticamente tras 10 minutos sin actividad. | Seguridad | Revisión de la base de datos para confirmar que no existan contraseñas en texto plano, y prueba funcional de cierre de sesión por inactividad. |
| RNF03 | El sistema debe garantizar una disponibilidad mínima del 99 % mensual para los módulos de emergencia y agenda, excluyendo ventanas de mantenimiento programado y notificado con 24 horas de anticipación. | Disponibilidad | Monitoreo continuo de uptime durante un periodo de prueba y revisión del registro de incidencias/caídas. |
| RNF04 | Todo cambio realizado sobre una cita médica (creación, reprogramación, cancelación) debe quedar registrado con usuario responsable, fecha/hora y valor anterior, sin posibilidad de sobreescritura. | Trazabilidad | Prueba funcional de modificación de una cita y revisión del historial de cambios generado. |
| RNF05 | La interfaz debe permitir que personal con alfabetización digital básica complete el registro de una cita en un máximo de 3 pasos. | Usabilidad | Prueba de usabilidad con personal de admisión, midiendo el número de pasos y errores cometidos. |
 
**Paso 4 — Historia****s de usuario (INVEST)**
 
Cinco historias de usuario, una por cada módulo/perfil relevante, con criterios de aceptación en formato Dado/Cuando/Entonces y validación contra INVEST.
 
**HU01 ****(5 ****pts****)**
 
Como personal de admisión, quiero registrar una cita médica indicando paciente, médico, fecha/hora y motivo, para evitar la duplicidad de citas y centralizar la agenda de todos los consultorios.
 
- Dado que el médico seleccionado no tiene otra cita en el mismo horario, cuando registro la nueva cita con los datos del paciente y el motivo, entonces el sistema guarda la cita y bloquea ese horario para que no pueda asignarse a otro paciente.
 
Validación : Es independiente de otras historias, negociable en su interfaz, valiosa para admisión, estimable (tamaño similar a un CRUD con validación de disponibilidad) y testeable con el criterio anterior*.*
 
**HU02 (3 ****pts****)**
 
Como paciente, quiero recibir un recordatorio automático antes de mi cita, para no olvidarla y reducir las inasistencias.
 
- Dado que tengo una cita programada dentro de las próximas 24 horas, cuando se acerca la fecha y hora registradas, entonces el sistema envía un recordatorio por el canal de contacto registrado (SMS o correo).
 
Validación : Depende únicamente de que exista una cita registrada (HU01), lo cual es una dependencia funcional razonable, no una dependencia de implementación; es pequeña, valiosa y testeable verificando el envío del recordatorio.
 
**HU03 (8 ****pts****)**
 
Como médico, quiero ver la historia clínica unificada de un paciente, para conocer su historial antes de atenderlo, sin importar qué especialidad lo atendió antes.
 
- Dado un paciente con consultas de más de una especialidad, cuando consulto su historia clínica, entonces veo todas las entradas ordenadas por fecha.
 
Validación : Historia central del caso, valiosa para el médico y para la seguridad del paciente, testeable con el criterio anterior y estimable como un desarrollo de consulta consolidada.
 
**HU04 (5 ****pts****)**
 
Como personal de laboratorio, quiero registrar el resultado digital de una orden médica, para que el médico tratante pueda consultarlo sin esperar el papel físico.
 
- Dado que existe una orden de laboratorio pendiente para un paciente, cuando cargo el resultado digital asociado a esa orden, entonces el resultado queda disponible para el médico dentro de la historia clínica del paciente.
 
Validación : Reduce directamente la demora de 48 horas identificada en la educción de requerimientos; es negociable en el formato de carga del resultado y testeable verificando la disponibilidad del resultado en la HCE.
 
**HU05 (5 ****pts****)**
 
Como cajero, quiero generar un comprobante aplicando el tarifario correspondiente al convenio del paciente (particular, EPS o SOAT), para cobrar correctamente y reducir errores de facturación.
 
- Dado que el paciente tiene un convenio registrado, cuando genero el comprobante de la atención, entonces el sistema aplica automáticamente la tarifa y el copago correspondientes a ese convenio.
 
Validación: Ataca directamente el hallazgo de reconciliación manual y errores de tarifario; es pequeña, estimable y testeable comparando el monto calculado contra el tarifario vigente.
 
**Paso 5 — Backlog priorizado (****MoSCoW****)**
 
Las cinco historias del Paso 4 trasladadas al backlog inicial, priorizadas según su impacto en los objetivos SMART y el alcance por sprint ya definido para el caso (M1/M2 en Sprint 1; M3/M4/M5 en Sprint 2).
 
| **ID** | **Historia (resumen)** | **Módulo** | **MoSCoW** | **Sprint** | **Puntos** |
| --- | --- | --- | --- | --- | --- |
| HU01 | Registrar cita evitando duplicados | M2 | Must | Sprint 1 | 5 |
| HU02 | Recordatorio automático de cita | M2 | Should | Sprint 1 | 3 |
| HU03 | Historia clínica unificada | M1 | Must | Sprint 1 | 8 |
| HU04 | Registrar resultado digital de laboratorio | M3 | Must | Sprint 2 | 5 |
| HU05 | Comprobante según convenio (EPS/SOAT/particular) | M4 | Should | Sprint 2 | 5 |
