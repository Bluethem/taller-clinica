**TALLER DE INGENIERÍA DE SOFTWARE I (SW705)**
 
**PROYECTO INTEGRADOR — CASO CLÍNICA SAN RAFAEL S.A.C.**
 
**PLANTILLA — ENTREGABLE 1: DOCUMENTACIÓN DE INGENIERÍA (SEMANAS 2 A 8)**
 
*Esta plantilla guía la construcción del Entregable 1 del proyecto integrador, semana a semana, sobre el caso empresarial “Clínica San Rafael S.A.C.”. El contexto del caso (situación problemática, alcance funcional y requerimientos no funcionales mínimos) ya está definido: complete únicamente las secciones marcadas con recuadros de instrucción y espacios en blanco. Use las rúbricas de avance y de sustentación del Entregable 1 como referencia de lo que se espera en cada sección.*
 
**Equipo:  **C
 
**Integrantes y roles:**
 
1.       David Luza Ccorimanya - Project Manager
 
2.       Romel Rodrigo Chumpitaz Flores - Dev Ops 
 
3.       Henry Javier Medina Malpartida - Full Stack
 
 
 
| **CONTEXTO DEL CASO — INFORMACIÓN DADA (no se completa)** |
| --- |
 
# **0. Caso empresarial: Clínica San Rafael S.A.C.**
 
Clínica privada de salud en San Borja, Lima, que ofrece consulta ambulatoria multiespecialidad, laboratorio, imágenes, farmacia, hospitalización, emergencia y cirugía ambulatoria. Gestiona historias clínicas en papel/Excel por especialidad, agenda telefónica saturada (18 % de inasistencia), resultados de laboratorio en papel (hasta 48 h de demora) y reconciliación manual con 5 EPS y aseguradoras.
 
## **0.1. Alcance funcional por módulos (dado)**
 
| **Módulo** | **Alcance funcional** | **Prioridad** |
| --- | --- | --- |
| M1. Historia clínica electrónica (HCE) | Registro unificado del paciente: antecedentes, consultas, diagnósticos (CIE-10), indicaciones y recetas | Sprint 1 (imprescindible) |
| M2. Agenda y citas médicas | Programación por especialidad y médico, confirmación/recordatorio, reprogramación, disponibilidad consolidada | Sprint 1 (imprescindible) |
| M3. Laboratorio e imágenes | Registro de órdenes médicas y resultados digitales | Sprint 2 (imprescindible) |
| M4. Facturación y convenios | Comprobantes, tarifario por convenio (particular/EPS/SOAT), copagos y glosas | Sprint 2 (imprescindible) |
| M5. Reportes gerenciales | Ocupación de consultorios, tiempos de espera, ingresos, inasistencia | Sprint 2 (imprescindible) |
| M6. Portal del paciente / telemedicina | Agendamiento en línea y consulta virtual básica | Sprint 2 (deseable) |
 
## **0.2. Requerimientos no funcionales mínimos (dados)**
 
| **RNF** | **Descripción** |
| --- | --- |
| Seguridad | Acceso a la HCE restringido por rol y registrado en bitácora de auditoría (Ley N.° 29733) |
| Disponibilidad | Módulos de emergencia y agenda disponibles en horario de atención de la clínica |
| Rendimiento | Apertura de la historia clínica en menos de 2 segundos, con hasta 8 000 pacientes |
| Trazabilidad | Ninguna entrada de historia clínica se elimina físicamente; solo se anula con motivo |
| Usabilidad | Interfaz simple para personal con distintos niveles de alfabetización digital |
 
## **0.3. Restricciones (dadas)**
 
•  	Presupuesto de infraestructura acotado: hosting o nube de costo moderado.
 
•  	Toda prueba o demostración usa datos ficticios o anonimizados; nunca datos reales de pacientes.
 
•  	El equipo define y justifica el stack tecnológico en el documento de arquitectura.
 
 
 
| **SEMANA 2 · AVANCE 1 — ACTA DE CONSTITUCIÓN Y DOCUMENTO DE VISIÓN** |
| --- |
 
# **1. Acta de constitución del proyecto**
 
## **1.1. Datos generales**
 
| **Campo** | **Detalle** |
| --- | --- |
| Nombre del proyecto | Sistema de Información Clínico-Administrativo – Clínica San Rafael S.A.C. |
| Patrocinador | Gerencia General, Clínica San Rafael S.A.C. |
| Equipo | Equipo C  (3 integrantes, roles rotativos) |
| Fecha del acta | Semana 2 – 10/09/2026 |
| Product Owner de referencia | Jose Carlos Garcia La Riva |
 
## **1.2. Justificación del proyecto**
 
## Actualmente, la Clínica San Rafael opera con procesos manuales, historias clínicas en papel/Excel y una agenda telefónica saturada que genera un 18% de inasistencias y demoras en la atención. Se justifica el desarrollo del SIGC para centralizar la información, garantizar la trazabilidad y seguridad, optimizar los tiempos de consulta y reducir las inasistencias mediante la digitalización de la agenda en línea, lo que impactará directamente en la rentabilidad y calidad del servicio.
 
## **1.3. Objetivos SMART**
 
| **N.°** | **Objetivo** |
| --- | --- |
| 1 | Entregar el módulo de Historia Clínica Electrónica (M1) con el 100 % de sus requerimientos funcionales aprobados en pruebas de aceptación —registro, consulta y anulación con motivo de atenciones ambulatorias, codificación CIE-10, indicaciones y recetas— y con tiempo de apertura menor a 2 segundos demostrado en prueba de carga con base de datos de 8 000 registros ficticios, al cierre del Sprint 1 |
| 2 | Entregar el módulo de Agenda y Citas Médicas (M2) con el 100 % de sus requerimientos funcionales aprobados —programación por especialidad, reprogramación en línea y envío automatizado de recordatorios para al menos el 90 % de las citas registradas en el entorno de prueba— validado mediante pruebas funcionales con datos ficticios, al cierre del Sprint 1. |
| 3 | Implementar los controles de seguridad exigidos por la Ley N.° 29733 sobre el módulo M1, incluyendo control de acceso basado en roles (RBAC) con al menos 4 perfiles diferenciados (médico, enfermera, admisión y administrador) y bitácora de auditoría que registre el 100 % de las operaciones de lectura y escritura sobre la HCE, verificado mediante pruebas de seguridad con datos ficticios al cierre del Sprint 1. |
| 4 | Validar el flujo clínico completo integrado entre M1 y M2 —desde el agendamiento de una cita hasta el registro de la consulta en la HCE del paciente— mediante al menos 3 escenarios de prueba de aceptación extremo a extremo con datos ficticios, al cierre del Sprint 1. |
 
## **1.4. Alcance resumido**
 
## El proyecto abordará los módulos M1 (Historia clínica electrónica) y M2 (Agenda y citas médicas) en el Sprint 1, por ser imprescindibles. En el Sprint 2 se incorporarán M3 (Laboratorio e imágenes), M4 (Facturación y convenios) y M5 (Reportes gerenciales). El módulo M6 (Portal del paciente / telemedicina) se considerará deseable y se evaluará su inclusión según el avance y la disponibilidad del equipo.
 
## **1.5. Exclusiones**
 
| **N.°** | **Exclusión** |
| --- | --- |
| 1 | Integración en tiempo real (API) con los sistemas legacy de las 5 EPS y aseguradoras (se maneja mediante carga manual o exportación de archivos planos). |
| 2 | Desarrollo de los módulos de Hospitalización y Cirugía Ambulatoria (se dejan para una fase posterior del proyecto real). |
| 3 | Migración automática y masiva de historias clínicas en papel históricas (solo se digitalizará la data activa y resumida de los últimos 2 años), la data resumida de operaciones, hospitalizaciones. |
 
## **1.6. Supuestos y restricciones adicionales**
 
| **N.°** | **Supuesto / restricción** |
| --- | --- |
| 1 | Se asume que la clínica proporcionará un servidor o cuenta en nube con recursos mínimos para el despliegue. |
| 2 | El personal de la clínica recibirá capacitación básica antes de la puesta en marcha. |
| 3 | Restricción: todo dato usado en pruebas será ficticio o anonimizado, nunca datos reales de pacientes. |
 
## **1.7. Riesgos iniciales**
 
| **Riesgo** | **Impacto** | **Mitigación** |
| --- | --- | --- |
| Baja adopción del personal por resistencia al cambio | Alto | Involucrar a usuarios clave desde el diseño, capacitación temprana y interfaz simple. |
| Pérdida de datos por fallo en infraestructura | Alto | Respaldos automáticos diarios y plan de recuperación documentado. |
| Incumplimiento de la Ley N.º 29733 por manejo inadecuado de datos | Alto | Acceso por roles, bitácora de auditoría y anonimización en pruebas. |
| Retrasos en el desarrollo de los módulos críticos del Sprint 1. | Alto | Priorizar M1 y M2, realizar seguimiento semanal del avance y mantener un MVP(producto mínimo viable) funcional antes de agregar funcionalidades secundarias. |
| Retraso en la definición de requerimientos por parte de la clínica | Medio | Sesiones semanales de validación con el Product Owner y prototipos tempranos. |
 
## **1.8. Hitos principales (dado por el cronograma del curso)**
 
| **Semana** | **Hito** |
| --- | --- |
| 2 | Acta de constitución y documento de visión |
| 4 | Especificación de requerimientos, backlog y modelos UML |
| 6 | Arquitectura, modelo de base de datos y prototipo UX/UI |
| 7 | Plan de release y sprint backlog 1 |
| 8 | Examen Parcial — sustentación del Entregable 1 |
| 16 | Examen Final — sustentación del Entregable 2 (producto funcionando) |
 
# **2. Documento de visión**
 
## **2.1. Declaración de visión**
 
Para el personal administrativo, médico y pacientes de la Clínica San Rafael S.A.C. que necesitan gestionar de manera rápida, segura y centralizada la información clínica y las citas médicas, el Sistema de Información Clínico-Administrativo – Clínica San Rafael S.A.C. es un sistema web de gestión clínica que permite centralizar las historias clínicas, optimizar la programación de citas y facilitar el acceso oportuno a la información, mejorando la eficiencia y calidad de atención; a diferencia de la gestión actual mediante historias clínicas en papel/Excel y agenda telefónica, que genera duplicidad de información, demoras, dificultad de acceso, errores administrativos y una alta tasa de inasistencia.* *
 
## **2.2. Perfiles de usuario (stakeholders)**
 
| **Perfil** | **Necesidad principal** | **Módulo relacionado** |
| --- | --- | --- |
| Admisión / Recepción | Registrar y actualizar datos de pacientes, gestionar citas, confirmar y reprogramar atenciones y consultar la disponibilidad de médicos. | M1. Historia clínica electrónica y M2. Agenda y citas médicas |
| Médico tratante | Consultar la historia clínica del paciente, registrar consultas, diagnósticos, indicaciones y recetas de forma segura. | M1. Historia clínica electrónica |
| Enfermera | Consultar información clínica necesaria para la atención y registrar información relacionada con la atención del paciente. | M1. Historia clínica electrónica |
| Personal de laboratorio | Registrar órdenes médicas y cargar los resultados de análisis e imágenes para que estén disponibles de forma digital. | M3. Laboratorio e imágenes |
| Cajero / Facturación | Generar comprobantes, aplicar tarifas según convenio, registrar copagos y gestionar glosas. | M4. Facturación y convenios |
| Gerencia médica | Consultar indicadores para evaluar la ocupación de consultorios, tiempos de espera, ingresos e inasistencias y apoyar la toma de decisiones. | M5. Reportes gerenciales |
| Paciente | Gestionar sus citas, consultar información disponible y acceder a servicios de atención virtual básica. | M2. Agenda y citas médicas y M6. Portal del paciente / telemedicina |
|  |  |  |
| Aseguradoras EPS/SOAT | Recibir información digital y estandarizada de los servicios prestados a sus afiliados para validar cobros, procesar pagos y reducir las glosas administrativas derivadas de la reconciliación manual. | M4. Facturación y convenios |
 
## **2.3. Factibilidad**
 
•  	**Técnica: **El proyecto es técnicamente factible, ya que puede desarrollarse como un sistema web utilizando tecnologías disponibles y de costo accesible. La solución podrá implementarse con una arquitectura cliente-servidor, una base de datos centralizada y mecanismos de autenticación, control de acceso por roles y auditoría. Además, la infraestructura podrá desplegarse en hosting o nube de costo moderado.** **
 
•  	**Operativa: **El proyecto es operativamente factible porque responde directamente a los problemas actuales de la clínica, como el uso de historias clínicas en papel/Excel, la gestión telefónica de citas y el registro manual de resultados. La interfaz será diseñada para ser sencilla y facilitar la adopción por parte de médicos, personal administrativo, laboratorio y demás usuarios, acompañándose de capacitación y pruebas de usabilidad.
 
•  	**Económica: **El proyecto es económicamente factible debido a que se priorizará el uso de tecnologías de código abierto y servicios de infraestructura de costo moderado. El desarrollo por etapas permitirá implementar primero los módulos imprescindibles (M1 y M2) y posteriormente los módulos del Sprint 2, evitando inversiones innecesarias y aprovechando los recursos disponibles.** **
