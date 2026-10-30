# Arquitectura de Software — Clínica San Rafael S.A.C.

**SW705 · Taller de Ingeniería de Software I — Guía Práctica Semana 5**
**Equipo C** · Sistema de Información Clínico-Administrativo (SIGC)

> Este documento completa los Pasos 1 a 5 de la guía y es coherente con el Entregable 1 (objetivos SMART, RNF mínimos, exclusiones) y con el backlog de la Semana 3 (M1/M2 en Sprint 1; M3/M4/M5 en Sprint 2; M6 deseable).

---

## Paso 1 — Selección del estilo arquitectónico

### Alternativas evaluadas

| Alternativa evaluada | Ventajas | Desventajas / riesgos | ¿Se elige? |
| --- | --- | --- | --- |
| **A. Monolito en capas tradicional** (una sola aplicación, capas técnicas: controladores, servicios, repositorios) | Es lo más simple de construir y desplegar; una sola base de datos y transacciones ACID. | Sin fronteras de dominio, los módulos terminan acoplados (HCE, Agenda y Facturación se mezclan). Agregar M3/M4/M5 en el Sprint 2 obliga a tocar código del Sprint 1. Difícil de separar a futuro. | No |
| **B. Monolito modular** (un solo despliegue, un módulo por contexto de negocio con API pública y reglas de dependencia) | Mantiene las transacciones ACID y el despliegue único (integridad y bajo costo operativo), pero con fronteras claras por módulo. Permite agregar M3–M5 sin modificar M1/M2. Cada módulo puede extraerse como servicio si en el futuro hace falta escalar de forma independiente. | Exige disciplina para respetar las fronteras (se automatiza con pruebas de arquitectura). Un solo proceso: un fallo de la aplicación afecta a todos los módulos (se mitiga con health checks, reinicio automático y despliegue replicable). | **Sí** |
| **C. Microservicios** (un servicio por módulo: HCE, Agenda, Laboratorio, Facturación…) | Escalado y despliegue independientes; aislamiento de fallos. | Equipo de 3 personas y un semestre. Las operaciones que cruzan módulos (cita → consulta → orden → comprobante) dejan de ser transacciones ACID y exigen sagas y consistencia eventual: choca con la prioridad de integridad. Mucho costo operativo (red, observabilidad, despliegues) frente al presupuesto acotado. | No |

### Decisión final y justificación

Se elige el **monolito modular** (Alternativa B). La clínica maneja datos clínicos y de facturación donde la **integridad** es crítica (sin citas duplicadas, sin entradas de historia clínica borradas, tarifas consistentes), y esto se garantiza mejor con una **única base de datos transaccional** que con datos distribuidos entre servicios. El equipo es pequeño (3 integrantes), el plazo es un semestre y el presupuesto de infraestructura es acotado, por lo que un único artefacto desplegable cumple el requisito de **disponibilidad** con menos piezas que puedan fallar. A diferencia del monolito en capas, las fronteras por módulo permiten sumar M3, M4 y M5 en el Sprint 2 sin tocar M1 y M2, y dejan abierta la **escalabilidad a futuro**: la API es *stateless* (se puede replicar), los reportes pueden migrar a una réplica de lectura y cualquier módulo puede extraerse a un servicio cuando exista una necesidad real, no antes.

---

## Paso 2 — Atributos de calidad

Los cinco atributos priorizados responden a los RNF del Entregable 1 y a la opinión de diseño del equipo (integridad, disponibilidad y escalabilidad futura).

| Atributo de calidad | Métrica / criterio medible | Riesgo si no se cumple |
| --- | --- | --- |
| **Integridad de datos** | 0 citas solapadas para un mismo médico, verificado con una prueba de 50 solicitudes concurrentes sobre el mismo horario (solo 1 debe confirmarse). 0 entradas de HCE eliminadas físicamente (los permisos de la BD impiden `DELETE`; solo hay anulación con motivo). 100 % de las operaciones multi-tabla ejecutadas en una sola transacción ACID. | Citas duplicadas, errores de medicación por historia incompleta o alterada, incumplimiento de la trazabilidad exigida y de la Ley N.° 29733. |
| **Disponibilidad** | ≥ 99 % mensual para agenda y emergencia, excluyendo mantenimiento programado y avisado con 24 h (≈ 7 h de caída tolerada al mes). RPO ≤ 24 h (respaldo diario). RTO ≤ 4 h (restauración documentada y ensayada al menos una vez). | Sin agenda ni HCE la atención se detiene. Pérdida de datos por falla de infraestructura (riesgo ya identificado en el Acta). |
| **Rendimiento** | Apertura de la HCE en < 2 s (percentil 95) con 8 000 pacientes ficticios. Confirmación de cita (creación o reprogramación) en < 3 s con 50 solicitudes concurrentes. | Médicos y admisión vuelven al papel; la adopción cae. |
| **Seguridad y trazabilidad** | RBAC con al menos 4 perfiles (médico, enfermera, admisión, administrador). Bitácora de auditoría con el 100 % de lecturas y escrituras sobre la HCE. Contraseñas con hash + salt. Cierre de sesión a los 10 min de inactividad. TLS en todas las comunicaciones. | Acceso indebido a datos de salud (Ley N.° 29733), sanciones y pérdida de confianza. |
| **Modificabilidad y escalabilidad futura** | Agregar un módulo (p. ej. M3) sin modificar el código de M1 ni M2: 0 violaciones en las pruebas de arquitectura ejecutadas en CI. API *stateless* que permita ≥ 2 réplicas detrás del proxy sin cambios de código. | El Sprint 2 reabre el código del Sprint 1 y rompe lo ya aceptado; la clínica no puede crecer sin reescribir. |

---

## Paso 3 — Decisiones de arquitectura (ADR)

Se documentan 9 ADR (la guía exige mínimo 3). Los ADR-01 a ADR-03 son los de mayor impacto estructural; el resto cubre las decisiones que sostienen los atributos de calidad.

| ADR | Decisión | Atributo principal |
| --- | --- | --- |
| ADR-01 | Monolito modular como estilo arquitectónico | Modificabilidad, costo |
| ADR-02 | PostgreSQL único con un esquema por módulo | Integridad |
| ADR-03 | Prevención de doble reserva con restricción de exclusión en la BD | Integridad |
| ADR-04 | HCE de solo anexado: anulación lógica con motivo | Integridad, trazabilidad |
| ADR-05 | Comunicación entre módulos: API pública en proceso + eventos internos con *outbox* | Modificabilidad, disponibilidad |
| ADR-06 | Seguridad: RBAC + sesión en servidor + bitácora de auditoría | Seguridad |
| ADR-07 | Despliegue en contenedores sobre un servidor en la nube con respaldos externos | Disponibilidad, costo |
| ADR-08 | Integración con EPS/aseguradoras mediante archivos planos (adaptador) | Alcance, modificabilidad |
| ADR-09 | Next.js solo como capa de presentación; la lógica vive en NestJS | Integridad, modificabilidad |

### ADR-01 — Monolito modular como estilo arquitectónico

- **Estado:** Aceptado
- **Contexto:** Se debe elegir el estilo general del sistema. El equipo es de 3 personas, el plazo es de un semestre, el presupuesto de infraestructura es acotado y los datos clínicos y de facturación exigen consistencia fuerte.
- **Alternativas consideradas:** (A) monolito en capas tradicional; (B) monolito modular; (C) microservicios.
- **Decisión:** Monolito modular: un solo despliegue, un módulo por contexto de negocio (Pacientes, HCE, Agenda, Laboratorio, Facturación, Reportes, Seguridad, Auditoría, Notificaciones). Cada módulo expone una API pública y oculta su interior; las dependencias entre módulos están restringidas y se verifican automáticamente en CI. Se implementa con módulos de NestJS: cada módulo exporta (`exports`) solo sus servicios públicos, y `dependency-cruiser` / `eslint-plugin-boundaries` hacen fallar el build si un módulo importa el interior de otro o si se forma un ciclo.
- **Consecuencias:**
  - (+) Transacciones ACID entre módulos, despliegue simple, bajo costo operativo.
  - (+) M3, M4 y M5 se agregan en el Sprint 2 sin tocar M1 y M2.
  - (+) Camino abierto a extraer un módulo como servicio si surge la necesidad.
  - (−) Un solo proceso: un fallo grave de la aplicación afecta a todos los módulos.
  - (−) Requiere disciplina: sin pruebas de arquitectura las fronteras se erosionan.

### ADR-02 — PostgreSQL único con un esquema por módulo

- **Estado:** Aceptado
- **Contexto:** La integridad es la prioridad. Procesos como "atender una cita y registrar la consulta" tocan varios módulos y deben ser atómicos.
- **Alternativas consideradas:** (A) una base de datos por módulo; (B) una sola base de datos con tablas compartidas sin fronteras; (C) una sola base de datos con un esquema por módulo.
- **Decisión:** Una instancia de PostgreSQL con un esquema por módulo (`pacientes`, `hce`, `agenda`, `laboratorio`, `facturacion`, `reportes`, `seguridad`, `auditoria`). Cada módulo es dueño de sus tablas y no escribe en las de otro. Las referencias entre módulos se hacen por identificador (clave foránea hacia `pacientes.paciente`, que es el núcleo compartido). Las migraciones son versionadas (TypeORM, escritas en SQL). Los identificadores se generan en la BD con `uuidv7()` (nativo de PostgreSQL 18), que mantiene los índices ordenados por tiempo de creación.
- **Consecuencias:**
  - (+) Integridad referencial y transacciones ACID entre módulos.
  - (+) Los esquemas separados dejan listo el camino para extraer un módulo con su propia base de datos.
  - (+) Con 8 000 pacientes el volumen es pequeño para PostgreSQL; basta con índices adecuados (p. ej. `hce.entrada(paciente_id, fecha DESC)`).
  - (−) La base de datos es un punto único de fallo (se mitiga con respaldos y, a futuro, un standby).
  - (−) Hay que evitar consultas SQL que crucen esquemas fuera de los reportes.

### ADR-03 — Prevención de doble reserva con restricción de exclusión en la base de datos

- **Estado:** Aceptado
- **Contexto:** El problema central de M2 es la duplicidad de citas. Validar solo en la aplicación deja una condición de carrera cuando dos usuarios agendan el mismo horario a la vez.
- **Alternativas consideradas:** (A) validación solo en el código de la aplicación; (B) bloqueo explícito de filas o de la agenda del médico; (C) restricción de exclusión de PostgreSQL (`EXCLUDE USING gist`) sobre `(medico_id, rango_horario)`.
- **Decisión:** La garantía se aplica en la base de datos con la restricción de exclusión, en cuanto a las citas activas (excluyendo las canceladas). La aplicación valida primero para dar un mensaje claro, pero la restricción es la última línea de defensa. Una violación se traduce en un error de negocio ("horario no disponible"). La reprogramación se ejecuta en una sola transacción. La restricción se crea con SQL en la migración (TypeORM no la modela). PostgreSQL 18 ofrece también `WITHOUT OVERLAPS`, pero no admite condiciones parciales; por eso se usa `EXCLUDE`, que sí permite ignorar las citas canceladas.
- **Consecuencias:**
  - (+) Imposible tener dos citas activas solapadas para el mismo médico, incluso con concurrencia.
  - (+) Se verifica con la prueba concurrente definida en el Paso 2.
  - (−) Dependencia explícita de PostgreSQL (extensión `btree_gist`); cambiar de motor implicaría reimplementarla.

### ADR-04 — HCE de solo anexado: anulación lógica con motivo

- **Estado:** Aceptado
- **Contexto:** Ninguna entrada de la historia clínica puede eliminarse físicamente (RNF de trazabilidad y RF04). Una corrección no debe borrar lo que el médico vio.
- **Alternativas consideradas:** (A) borrado físico con copia en una tabla de auditoría; (B) borrado lógico con una marca booleana; (C) modelo de solo anexado: la entrada anulada conserva su contenido, y se registra la anulación (usuario, fecha/hora, motivo); las correcciones son entradas nuevas que referencian a la anterior.
- **Decisión:** Modelo de solo anexado (C). El usuario de BD de la aplicación no tiene permiso `DELETE` sobre `hce`, y un *trigger* rechaza `UPDATE` sobre el contenido clínico de una entrada ya guardada. Por defecto la historia muestra las entradas vigentes; las anuladas se consultan con su motivo.
- **Consecuencias:**
  - (+) Historia completa y auditable; cumple de forma estructural el RNF de trazabilidad.
  - (+) Protege contra errores y contra borrados malintencionados, incluso desde un fallo de la aplicación.
  - (−) Crece más la tabla (aceptable con 8 000 pacientes) y las consultas deben filtrar por estado.
  - (−) Las correcciones son más elaboradas que un simple `UPDATE`.

### ADR-05 — Comunicación entre módulos: API pública en proceso y eventos internos con *outbox*

- **Estado:** Aceptado
- **Contexto:** Los módulos deben colaborar (HCE necesita saber a qué cita corresponde una consulta; Agenda debe disparar recordatorios) sin acoplarse, y sin perder mensajes si el sistema se cae.
- **Alternativas consideradas:** (A) acceso directo a las tablas de otros módulos; (B) llamadas síncronas a la API pública del otro módulo, solo para consultas e instrucciones inmediatas; (C) eventos de dominio publicados con el patrón *transactional outbox*; (D) un *broker* externo (RabbitMQ/Kafka).
- **Decisión:** Se combinan (B) y (C). Las consultas inmediatas usan la API pública del módulo dueño (nunca sus tablas). Los efectos secundarios (recordatorios, auditoría derivada, indicadores) se publican como eventos de dominio y se guardan en una tabla *outbox* **en la misma transacción** que el cambio de negocio; un despachador interno (`@nestjs/schedule` consultando con `SELECT ... FOR UPDATE SKIP LOCKED`) los entrega de forma fiable a los consumidores (`@nestjs/event-emitter`). No se agrega un *broker* externo.
- **Consecuencias:**
  - (+) No hay mensajes perdidos ni eventos fantasma: el evento existe si y solo si el cambio se confirmó.
  - (+) El fallo del proveedor de correo/SMS no bloquea el agendamiento de la cita ni afecta la disponibilidad de la agenda.
  - (+) Sin infraestructura adicional que operar.
  - (−) Los efectos son asíncronos (el recordatorio no es instantáneo, lo cual es aceptable).
  - (−) Los consumidores deben ser idempotentes.

### ADR-06 — Seguridad: RBAC, sesión en servidor y bitácora de auditoría

- **Estado:** Aceptado
- **Contexto:** Ley N.° 29733 y objetivo SMART 3: control de acceso por roles (≥ 4 perfiles) y bitácora del 100 % de lecturas y escrituras sobre la HCE; sesión cerrada tras 10 min de inactividad; contraseñas cifradas.
- **Alternativas consideradas:** (A) JWT sin estado en el navegador; (B) sesión en el servidor con cookie `HttpOnly` y `SameSite`; (C) un proveedor de identidad externo (Keycloak u otro).
- **Decisión:** Sesión en servidor con Passport + `express-session`, almacenada en PostgreSQL (`connect-pg-simple`), cookie `HttpOnly` + `Secure` + `SameSite` con expiración deslizante de 10 min de inactividad, contraseñas con Argon2id (sal incluida) y autorización por rol verificada en el servidor con *guards* de NestJS en cada operación. Un *interceptor* de NestJS alimenta la auditoría. La bitácora de auditoría (quién, qué, cuándo, sobre qué paciente) se escribe en el esquema `auditoria` en la misma transacción que la operación, y es de solo anexado.
- **Consecuencias:**
  - (+) Cierre por inactividad y revocación inmediata de sesiones son triviales; sin tokens expuestos en el navegador.
  - (+) La bitácora es consistente con los datos: si la operación se confirma, queda registrada.
  - (+) La sesión en BD mantiene la API *stateless* en memoria, lo que permite réplicas a futuro.
  - (−) Cada petición consulta la sesión (mitigable con caché si hiciera falta).
  - (−) Una integración con un proveedor externo (SSO) quedaría como evolución.

### ADR-07 — Despliegue en contenedores sobre un servidor en la nube con respaldos externos

- **Estado:** Aceptado
- **Contexto:** Se requiere ≥ 99 % de disponibilidad con presupuesto de nube moderado, y el equipo incluye el rol DevOps.
- **Alternativas consideradas:** (A) PaaS gestionado (aplicación + BD administrada); (B) Kubernetes; (C) un servidor virtual con Docker Compose, proxy inverso con TLS automático y respaldos externos.
- **Decisión:** Un servidor virtual en la nube con Docker Compose: proxy inverso (Caddy, TLS automático), contenedor de la API (NestJS), contenedor del frontend (Next.js) y contenedor de PostgreSQL 18 con volumen persistente. Caddy enruta `/api` hacia NestJS y el resto hacia Next.js bajo un mismo dominio, de modo que la cookie de sesión funciona sin configuración CORS. Política de reinicio automático, *health checks*, monitoreo de disponibilidad externo, respaldo lógico diario cifrado hacia almacenamiento de objetos fuera del servidor y ensayo de restauración documentado. Entornos de desarrollo y pruebas con los mismos contenedores y datos ficticios. Despliegue desde CI/CD (GitHub Actions) y migraciones automáticas en cada versión.
- **Consecuencias:**
  - (+) Costo bajo, reproducible y sencillo de operar para un equipo de 3.
  - (+) Los respaldos externos protegen contra la pérdida del servidor (riesgo del Acta).
  - (−) Servidor único: 99 % mensual es alcanzable, pero un fallo de hardware implica restaurar (RTO ≤ 4 h).
  - (−) Camino de crecimiento: segundo nodo de aplicación, BD administrada o *standby* con replicación, y réplica de lectura para reportes, sin cambiar el diseño lógico.

### ADR-08 — Integración con EPS y aseguradoras mediante archivos planos (adaptador)

- **Estado:** Aceptado
- **Contexto:** La integración en tiempo real con los sistemas de las 5 EPS y aseguradoras está **excluida** del alcance (Acta, exclusión 1). Aun así, Facturación debe poder intercambiar información de forma estandarizada y reducir las glosas.
- **Alternativas consideradas:** (A) APIs en tiempo real con cada EPS; (B) digitar todo manualmente; (C) generar y cargar archivos planos (CSV/XML) a través de un puerto con un adaptador por aseguradora.
- **Decisión:** El módulo Facturación define un puerto de salida/entrada y un adaptador por aseguradora que exporta liquidaciones y valida archivos de respuesta. El tarifario por convenio (particular, EPS, SOAT) vive en Facturación.
- **Consecuencias:**
  - (+) Cumple el alcance y deja una costura limpia para integrar APIs reales más adelante sin tocar el dominio.
  - (−) El intercambio sigue siendo manual (descarga/carga) en esta fase.

### ADR-09 — Next.js solo como capa de presentación; la lógica vive en NestJS

- **Estado:** Aceptado
- **Contexto:** Next.js permite escribir lógica de servidor (*Route Handlers*, *Server Actions*), lo que podría dispersar las reglas de negocio en dos lugares y debilitar la integridad, la auditoría y las fronteras entre módulos definidas en el monolito modular.
- **Alternativas consideradas:** (A) Next.js full-stack con la lógica y el acceso a la BD en sus propios *Route Handlers*; (B) Next.js solo como presentación, con toda la lógica en la API NestJS; (C) SPA pura sin renderizado en servidor.
- **Decisión:** Opción B. Next.js (App Router) renderiza la interfaz y consume la API REST de NestJS; no accede a la base de datos ni implementa reglas de negocio. La cookie de sesión viaja al mismo dominio a través del proxy, y los *Server Components* la reenvían a la API cuando piden datos en el servidor. El contrato se publica con OpenAPI (`@nestjs/swagger`) y el frontend usa un cliente tipado generado a partir de él.
- **Consecuencias:**
  - (+) Una sola fuente de verdad para las reglas, la auditoría y la seguridad: ninguna ruta del frontend puede saltarse el RBAC ni la bitácora.
  - (+) El futuro portal del paciente (M6) u otros clientes reutilizan la misma API.
  - (−) Hay dos procesos Node que desplegar y monitorear.
  - (−) Hay que cuidar el reenvío de la cookie en el renderizado del servidor y mantener el cliente OpenAPI sincronizado en CI.

---

## Paso 4 — Vistas del Documento de Arquitectura (SAD)

Las vistas se modelan como código en **Structurizr DSL**: contexto, contenedores, componentes (**vista lógica**) y despliegue (**vista física**). Pegar el bloque completo en el editor de Structurizr (por ejemplo, https://structurizr.com/dsl).

**Cómo leer el modelo**

- **Vista lógica:** `Componentes` muestra los módulos del monolito y sus dependencias. Las flechas van del módulo que depende hacia el que expone la API pública. Las dependencias entre módulos siguen un solo sentido (sin ciclos): `hce` y `agenda` dependen de `pacientes`; `hce` depende de `agenda`; `laboratorio` depende de `hce`; `facturacion` depende de `agenda`; `reportes` solo lee.
- **Vista física:** `Despliegue` muestra el servidor, Docker Compose, el proxy, el frontend (Next.js), la API (NestJS), PostgreSQL 18 y el almacenamiento de respaldos.
- **Sprint 1:** `seguridad`, `auditoria`, `pacientes`, `hce`, `agenda` y `notificaciones`. **Sprint 2:** `laboratorio`, `facturacion`, `reportes`. **Deseable:** `portal` (M6, marcado como futuro).

```
workspace "SIGC - Clinica San Rafael S.A.C." "Arquitectura del Sistema de Informacion Clinico-Administrativo: monolito modular con PostgreSQL unico, orientado a integridad, disponibilidad y escalabilidad futura." {

    !identifiers hierarchical

    model {
        !impliedRelationships true

        # ---------- Personas ----------
        admision    = person "Admision / Recepcion" "Registra pacientes, agenda, confirma y reprograma citas."
        medico      = person "Medico tratante" "Consulta la historia clinica y registra consultas, diagnosticos CIE-10, indicaciones y recetas."
        enfermera   = person "Enfermera" "Consulta y registra informacion relacionada con la atencion."
        labtec      = person "Personal de laboratorio" "Registra ordenes y carga resultados digitales."
        cajero      = person "Cajero / Facturacion" "Genera comprobantes, aplica tarifas por convenio, registra copagos y glosas."
        gerencia    = person "Gerencia medica" "Consulta indicadores de ocupacion, tiempos de espera, ingresos e inasistencia."
        paciente    = person "Paciente" "Recibe recordatorios de cita. En el futuro gestionara sus citas en linea (M6)."
        admin       = person "Administrador del sistema" "Gestiona usuarios, roles y configuracion."

        # ---------- Sistemas externos ----------
        eps = softwareSystem "EPS y Aseguradoras (SOAT)" "Reciben liquidaciones y devuelven respuestas mediante archivos planos. Sin integracion en tiempo real." "Externo"
        mensajeria = softwareSystem "Proveedor de Correo / SMS" "Entrega los recordatorios de cita al paciente." "Externo"
        respaldos = softwareSystem "Almacenamiento de respaldos" "Almacenamiento de objetos externo al servidor; guarda los respaldos cifrados diarios de la base de datos." "Externo"

        # ---------- Sistema principal ----------
        sigc = softwareSystem "SIGC - Clinica San Rafael" "Sistema web para historia clinica electronica, agenda y citas, laboratorio, facturacion y reportes." {

            spa = container "Aplicacion Web (Next.js)" "Capa de presentacion: sin logica de negocio ni acceso directo a la BD. Interfaz simple por rol; registro de cita en maximo 3 pasos." "Next.js (App Router), TypeScript" "WebApp"

            api = container "API - Monolito Modular" "Una sola aplicacion desplegable. Un modulo por contexto de negocio con API publica; dependencias verificadas con pruebas de arquitectura en CI." "Node.js LTS, NestJS, TypeScript" {

                seguridad = component "Seguridad (IAM)" "Autenticacion, sesion en servidor con cierre a los 10 min, RBAC (medico, enfermera, admision, administrador, ...)." "Passport + Guards (NestJS)"
                auditoria = component "Auditoria" "Bitacora de solo anexado: registra el 100 % de lecturas y escrituras sobre la HCE (Ley 29733)." "Modulo"
                pacientes = component "Pacientes" "Datos personales y antecedentes (RF01). Nucleo compartido: identificador unico de paciente." "Modulo (M1)"
                hce       = component "Historia Clinica Electronica" "Historia unificada, consultas, diagnostico CIE-10, indicaciones, recetas; anulacion con motivo, sin borrado fisico (RF02-RF04)." "Modulo (M1)"
                agenda    = component "Agenda y Citas" "Programacion por especialidad y medico, reprogramacion, disponibilidad consolidada; sin doble reserva (RF05-RF07)." "Modulo (M2)"
                notificaciones = component "Notificaciones" "Recordatorios automaticos de cita por correo/SMS; consume eventos mediante outbox (RF06)." "Modulo (M2)"
                laboratorio = component "Laboratorio e Imagenes" "Ordenes medicas y resultados digitales ligados a la HCE (RF08)." "Modulo (M3, Sprint 2)"
                facturacion = component "Facturacion y Convenios" "Comprobantes, tarifario por convenio, copagos y glosas; adaptadores de archivos planos (RF09)." "Modulo (M4, Sprint 2)"
                reportes = component "Reportes Gerenciales" "Ocupacion de consultorios, tiempos de espera, ingresos e inasistencia; solo lectura (RF10)." "Modulo (M5, Sprint 2)"
                portal = component "Portal del Paciente" "Agendamiento en linea y consulta virtual basica. Deseable; se evaluara su inclusion." "Modulo (M6, deseable)" "Futuro"

                # Dependencias entre modulos (API publica, un solo sentido)
                hce -> pacientes "Valida y referencia al paciente"
                hce -> agenda "Vincula la consulta con su cita"
                agenda -> pacientes "Valida y referencia al paciente"
                laboratorio -> hce "Publica el resultado en la historia clinica"
                laboratorio -> pacientes "Referencia al paciente"
                facturacion -> agenda "Obtiene las atenciones facturables"
                facturacion -> pacientes "Referencia al paciente y su convenio"
                reportes -> agenda "Lee citas, esperas e inasistencias (solo lectura)"
                reportes -> facturacion "Lee ingresos (solo lectura)"
                portal -> agenda "Reserva y consulta citas del paciente" "" "Futuro"

                # Seguridad y auditoria transversales
                seguridad -> auditoria "Registra inicios de sesion y accesos denegados"
                hce -> auditoria "Registra lectura y escritura de la HCE"
                pacientes -> auditoria "Registra operaciones sobre datos del paciente"
                agenda -> auditoria "Registra cambios de cita (usuario, fecha/hora, valor anterior)"

                # Eventos internos (outbox)
                agenda -> notificaciones "Publica CitaProgramada / CitaReprogramada (evento + outbox)"
            }

            db = container "Base de datos" "Una instancia, un esquema por modulo: pacientes, hce, agenda, laboratorio, facturacion, reportes, seguridad, auditoria. Restriccion de exclusion para citas; HCE de solo anexado." "PostgreSQL 18" "Database"

            # Relaciones entre contenedores
            spa -> api "Consume la API REST" "HTTPS / JSON"
            api -> db "Lee y escribe (transacciones ACID)" "SQL sobre TLS (driver pg)"

            # Relaciones Next.js -> componentes (vista logica)
            spa -> api.seguridad "Inicia y cierra sesion" "HTTPS / JSON"
            spa -> api.pacientes "Registra y consulta pacientes" "HTTPS / JSON"
            spa -> api.hce "Consulta y registra la historia clinica" "HTTPS / JSON"
            spa -> api.agenda "Agenda y reprograma citas" "HTTPS / JSON"
            spa -> api.laboratorio "Ordenes y resultados" "HTTPS / JSON"
            spa -> api.facturacion "Comprobantes y convenios" "HTTPS / JSON"
            spa -> api.reportes "Consulta indicadores" "HTTPS / JSON"

            # Persistencia por modulo
            api.seguridad -> db "Esquema seguridad (usuarios, roles, sesiones)" "SQL"
            api.auditoria -> db "Esquema auditoria (solo anexado)" "SQL"
            api.pacientes -> db "Esquema pacientes" "SQL"
            api.hce -> db "Esquema hce (solo anexado)" "SQL"
            api.agenda -> db "Esquema agenda (restriccion de exclusion)" "SQL"
            api.notificaciones -> db "Lee la tabla outbox" "SQL"
            api.laboratorio -> db "Esquema laboratorio" "SQL"
            api.facturacion -> db "Esquema facturacion" "SQL"
            api.reportes -> db "Lectura de solo consulta" "SQL"
        }

        # ---------- Relaciones con personas y externos ----------
        admision -> sigc.spa "Registra pacientes y gestiona citas" "HTTPS"
        medico -> sigc.spa "Consulta la HCE y registra consultas" "HTTPS"
        enfermera -> sigc.spa "Consulta y registra informacion de atencion" "HTTPS"
        labtec -> sigc.spa "Carga resultados de laboratorio" "HTTPS"
        cajero -> sigc.spa "Genera comprobantes y gestiona glosas" "HTTPS"
        gerencia -> sigc.spa "Consulta reportes gerenciales" "HTTPS"
        admin -> sigc.spa "Administra usuarios y roles" "HTTPS"
        mensajeria -> paciente "Entrega recordatorios de cita" "Correo / SMS"

        sigc.api.notificaciones -> mensajeria "Envia recordatorios" "SMTP / HTTPS"
        sigc.api.facturacion -> eps "Genera liquidaciones y valida respuestas (carga/descarga manual)" "Archivos planos CSV/XML"
        sigc.db -> respaldos "Respaldo logico diario cifrado" "pg_dump + HTTPS"

        # ---------- Despliegue (vista fisica) ----------
        deploymentEnvironment "Produccion" {

            deploymentNode "Equipo del usuario" "PC de la clinica" "Windows" {
                infrastructureNode "Navegador web" "Muestra la interfaz entregada por Next.js" "Navegador moderno"
            }

            deploymentNode "Servidor virtual en la nube" "VPS de costo moderado (2 vCPU, 4 GB RAM sugeridos)" "Ubuntu Server 24.04 LTS" {

                deploymentNode "Docker Engine" "Orquestado con Docker Compose; politica de reinicio automatico y health checks" "Docker" {

                    deploymentNode "Contenedor proxy" "" "Docker" {
                        infrastructureNode "Caddy" "Proxy inverso con TLS automatico: enruta /api hacia la API (NestJS) y el resto hacia el frontend (Next.js) bajo un mismo dominio" "Caddy 2"
                    }

                    deploymentNode "Contenedor frontend" "" "Docker (Node.js)" {
                        containerInstance sigc.spa
                    }

                    deploymentNode "Contenedor API" "" "Docker (Node.js)" {
                        containerInstance sigc.api
                    }

                    deploymentNode "Contenedor base de datos" "Volumen persistente" "Docker (postgres:18)" {
                        containerInstance sigc.db
                    }
                }
            }

            deploymentNode "Almacenamiento de objetos" "Fuera del servidor de la aplicacion" "Compatible con S3" {
                softwareSystemInstance respaldos
            }
        }
    }

    views {

        systemContext sigc "Contexto" "Vista de contexto del SIGC: usuarios y sistemas externos." {
            include *
            autolayout lr
        }

        container sigc "Contenedores" "Contenedores del SIGC: Next.js, API monolitica modular (NestJS) y base de datos." {
            include *
            autolayout lr
        }

        component sigc.api "Componentes" "Vista logica: modulos del monolito y sus dependencias." {
            include *
            autolayout tb
        }

        deployment sigc "Produccion" "Despliegue" "Vista fisica: servidor, contenedores y respaldos." {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                shape Person
                background #1f4e79
                color #ffffff
            }
            element "Software System" {
                background #2e75b6
                color #ffffff
            }
            element "Externo" {
                background #7f7f7f
                color #ffffff
            }
            element "Container" {
                background #3b8ed0
                color #ffffff
            }
            element "WebApp" {
                shape WebBrowser
            }
            element "Database" {
                shape Cylinder
                background #2c6e49
                color #ffffff
            }
            element "Component" {
                background #85bb65
                color #000000
            }
            element "Futuro" {
                background #d9d9d9
                color #000000
                border dashed
            }
            relationship "Relationship" {
                routing Orthogonal
            }
        }
    }
}
```

**Nota sobre el DSL:** si al pegarlo Structurizr marca un error en la línea `portal -> agenda ... "Futuro"`, quite el tercer argumento (`"" "Futuro"`) de esa relación; algunas versiones del editor aceptan menos argumentos en las relaciones.

---

## Paso 5 — Stack tecnológico

| Componente | Tecnología elegida | Justificación |
| --- | --- | --- |
| **Backend (monolito modular)** | Node.js LTS + **NestJS** + TypeScript | Los módulos de NestJS (con `exports`) se corresponden 1:1 con los módulos de dominio (ADR-01). Inyección de dependencias, *guards*, *interceptors*, validación y OpenAPI vienen integrados. TypeScript en todo el stack reduce el cambio de contexto en un equipo de 3. |
| **Verificación de fronteras** | `dependency-cruiser` + `eslint-plugin-boundaries` en CI | Falla el build si un módulo importa el interior de otro o se crea un ciclo: es la métrica de "0 violaciones" del atributo de modificabilidad. |
| **Persistencia** | TypeORM + migraciones SQL versionadas | Integración nativa con NestJS, esquema por entidad (esquema por módulo) y SQL crudo en las migraciones para `EXCLUDE`, *triggers* y `REVOKE` (ADR-02, 03, 04). Una transacción por caso de uso. |
| **Base de datos** | **PostgreSQL 18** (extensión `btree_gist`) | ACID, esquemas por módulo, restricción de exclusión para citas, permisos finos para la HCE de solo anexado y `uuidv7()` nativo para identificadores. |
| **Seguridad** | Passport + `express-session` + `connect-pg-simple` + `argon2` | RBAC con *guards*, sesión en servidor con expiración deslizante de 10 min y hash Argon2id (ADR-06, RNF02). |
| **Eventos y recordatorios** | `@nestjs/event-emitter` + `@nestjs/schedule` + tabla *outbox* | Eventos internos sin broker externo y entrega confiable (ADR-05, RF06). |
| **Frontend** | **Next.js** (App Router) + TypeScript | Capa de presentación únicamente (ADR-09). Interfaz simple por rol; la prueba de usabilidad mide el registro de una cita en ≤ 3 pasos. El detalle UX/UI se define en el prototipo de la Semana 6. |
| **Contrato de API** | OpenAPI (`@nestjs/swagger`) + cliente TypeScript generado | El frontend consume tipos generados del contrato, así que un cambio en la API que lo rompa se detecta en CI. |
| **Notificaciones** | `nodemailer` (SMTP) en el MVP; SMS mediante un adaptador de proveedor | El puerto de salida permite cambiar de proveedor sin tocar el dominio (RF06). |
| **Repositorio** | Monorepo (pnpm workspaces): `apps/api`, `apps/web` | Un solo repositorio y un solo flujo de CI para ambos procesos; facilita compartir el contrato. |
| **Contenedores y proxy** | Docker + Docker Compose + Caddy (TLS automático) | Despliegue reproducible y simple para un equipo de 3 (ADR-07). Con la imagen oficial `postgres:18` el volumen de datos se monta en `/var/lib/postgresql` (cambió respecto a versiones anteriores). |
| **Hosting** | VPS en la nube de costo moderado + almacenamiento de objetos compatible con S3 para respaldos | Cumple la restricción de presupuesto; respaldos fuera del servidor (RPO ≤ 24 h). |
| **CI/CD** | GitHub + GitHub Actions | Pruebas, verificación de fronteras, cliente OpenAPI y despliegue automatizado. |
| **Pruebas** | Jest + Supertest, Testcontainers (`postgres:18`), k6 (carga), Playwright (extremo a extremo) | Testcontainers prueba la restricción de exclusión contra una base real; k6 valida los objetivos de rendimiento (HCE < 2 s con 8 000 pacientes, cita < 3 s con 50 concurrentes); Playwright cubre los 3 escenarios de aceptación M1–M2 del objetivo SMART 4. |
| **Monitoreo** | `@nestjs/terminus` (health checks) + monitor externo de disponibilidad (p. ej. Uptime Kuma) | Medición del ≥ 99 % mensual y alertas de caída. |
| **Documentación** | Structurizr (arquitectura como código) + OpenAPI | El modelo versionado en el repositorio mantiene sincronizados el diseño y el código. |

> **Nota sobre las fronteras en NestJS:** a diferencia de otros ecosistemas, NestJS no impide por sí solo que un módulo importe archivos internos de otro. Por eso la verificación con `dependency-cruiser` en CI es obligatoria, no opcional: es lo que sostiene la promesa de modularidad del ADR-01.

---

## Coherencia con el Entregable 1 y la Semana 4

- **Objetivos SMART 1 y 2 (M1, M2):** módulos `pacientes`, `hce`, `agenda` y `notificaciones`.
- **Objetivo SMART 3 (seguridad):** módulos `seguridad` y `auditoria` (ADR-06).
- **Objetivo SMART 4 (flujo M1–M2):** `hce -> agenda` vincula la consulta con la cita; se valida con 3 escenarios extremo a extremo.
- **Exclusiones:** integración con EPS por archivos planos (ADR-08); sin Hospitalización ni Cirugía; sin migración masiva.
- **Riesgos del Acta:** pérdida de datos → ADR-07 (respaldo externo y restauración ensayada); incumplimiento de la Ley N.° 29733 → ADR-06; retrasos en Sprint 1 → alcance reducido a 6 módulos y despliegue simple.
- **Sprint 2:** `laboratorio`, `facturacion` y `reportes` se agregan como módulos nuevos sin modificar M1 ni M2 (atributo de modificabilidad).
