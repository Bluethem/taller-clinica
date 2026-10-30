# Guía Práctica Semana 6 — Diseño de datos y prototipo UX/UI

**SW705 · Taller de Ingeniería de Software I · Equipo C**
**Caso:** Clínica San Rafael S.A.C. — Sistema de Información Clínico-Administrativo (SIGC)
**Integrantes:** David Luza Ccorimanya (PM) · Romel Rodrigo Chumpitaz Flores (DevOps) · Henry Javier Medina Malpartida (Full Stack)

> **Coherencia con el resto del proyecto.** Este documento sigue el SAD de la Semana 5 (monolito modular, un esquema PostgreSQL por módulo, HCE y auditoría de solo anexado, restricción de exclusión para citas, patrón *outbox*) y el backlog de la Semana 3 (HU01–HU05, RF01–RF10, RNF01–RNF05).
> **Nota sobre el diagrama de clases (Semana 4):** no estaba entre los archivos del proyecto, así que el modelo se derivó de los RF, las HU y el SAD. Si su diagrama de clases tiene clases o atributos distintos, ajusten la tabla "Clases a tablas" del Paso 2 antes de entregar.

**Contenido:** [Paso 1 · Componentes](#paso-1--diseño-de-componentes) · [Paso 2 · Modelo de datos](#paso-2--modelo-de-base-de-datos) · [Paso 3 · Script SQL](#paso-3--script-sql-y-datos-de-prueba) · [Paso 4 · Prototipo UX/UI](#paso-4--prototipo-uxui) · [Paso 5 · Trazabilidad](#paso-5--matriz-de-trazabilidad)

---

## Paso 1 — Diseño de componentes

**Criterio aplicado:** un módulo por contexto de negocio (alta cohesión). Los módulos se comunican solo por su API pública (endpoint REST o servicio exportado de NestJS) o por eventos *outbox*; ninguno lee ni escribe las tablas de otro (bajo acoplamiento). La única excepción documentada es `reportes`, que solo lee.

| Módulo (esquema BD) | Responsabilidad única | Interfaz que expone | Historias de usuario que cubre |
| --- | --- | --- | --- |
| **Seguridad / IAM** (`seguridad`) | Autenticar usuarios, mantener la sesión (cierre a los 10 min) y autorizar por rol (RBAC) | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `GET/POST /usuarios` · guards de rol para el resto de módulos | Transversal: RNF02, objetivo SMART 3 (sin HU propia en el backlog) |
| **Auditoría** (`auditoria`) | Registrar en una bitácora de solo anexado el 100 % de lecturas y escrituras sobre la HCE | Servicio `AuditoriaService.registrar(...)` (lo invoca un *interceptor*) · `GET /auditoria?paciente_id=&desde=` (solo administrador) | Transversal: Ley N.° 29733, objetivo SMART 3 |
| **M1 · Pacientes** (`pacientes`) | Datos personales y antecedentes del paciente; identificador único compartido | `POST /pacientes` · `GET /pacientes?documento=` · `GET /pacientes/{id}` · `PUT /pacientes/{id}` · `POST /pacientes/{id}/antecedentes` | Apoya HU01, HU02, HU03 (RF01) |
| **M1 · Historia Clínica Electrónica** (`hce`) | Registrar, consultar y anular consultas médicas sin borrado físico | `GET /pacientes/{id}/historia` · `POST /consultas` · `POST /consultas/{id}/anular` · `GET /cie10?q=` | **HU03** (RF02, RF03, RF04) |
| **M2 · Agenda y citas** (`agenda`) | Programar, reprogramar y cancelar citas; consultar disponibilidad; impedir doble reserva | `POST /citas` · `POST /citas/{id}/reprogramar` · `POST /citas/{id}/cancelar` · `GET /citas/disponibilidad/{medico_id}?fecha=` · `GET /especialidades` · `GET /medicos?especialidad_id=` | **HU01** (RF05, RF07), apoya HU02 |
| **M2 · Notificaciones** (`notificaciones`) | Programar y enviar recordatorios por correo/SMS a partir de eventos de cita | Consume `CitaProgramada`, `CitaReprogramada`, `CitaCancelada` (sin endpoint público); `GET /notificaciones?estado=fallido` (administrador) | **HU02** (RF06) |
| **M3 · Laboratorio e imágenes** (`laboratorio`) | Órdenes médicas y resultados digitales | `POST /ordenes-laboratorio` · `GET /ordenes-laboratorio?estado=pendiente` · `POST /ordenes-laboratorio/items/{id}/resultado` · `GET /pacientes/{id}/resultados` | **HU04** (RF08) |
| **M4 · Facturación y convenios** (`facturacion`) | Tarifario por convenio, comprobantes, copagos y glosas | `GET /convenios` · `GET /tarifario?convenio_id=` · `POST /comprobantes` · `GET /comprobantes/{id}` · `POST /comprobantes/{id}/glosas` | **HU05** (RF09) |
| **M5 · Reportes** (`reportes`, solo vistas) | Indicadores de ocupación, tiempos de espera, inasistencia e ingresos | `GET /reportes/ocupacion` · `/tiempos-espera` · `/inasistencia` · `/ingresos?desde=&hasta=` | RF10 (**sin HU en el backlog actual**, ver Paso 5) |
| **M6 · Portal del paciente** | Deseable; no se diseña en esta semana | — | — |

**Dependencias permitidas** (un solo sentido, sin ciclos, como en el SAD): `hce → pacientes, agenda` · `agenda → pacientes` · `laboratorio → hce, pacientes` · `facturacion → agenda, pacientes` · `reportes → agenda, facturacion` (lectura) · `agenda → notificaciones` (evento) · todos → `auditoria`.

**Ajuste respecto al ADR-02:** el SAD listaba 8 esquemas; aquí se agrega `notificaciones`, que el ADR-02 omitía aunque el módulo existe en el diagrama de componentes.

---

## Paso 2 — Modelo de base de datos

### 2.1 Clases a tablas

| Clase del modelo | Tabla | Llave primaria / foráneas | Restricciones principales |
| --- | --- | --- | --- |
| Rol | `seguridad.rol` | PK `id` | `nombre` único |
| Usuario | `seguridad.usuario` | PK `id` (uuid) · FK `rol_id` | `username` y `email` únicos; `password_hash` debe ser Argon2id; formato de email |
| Sesión | `seguridad.sesion` | PK `sid` | Tabla técnica de `connect-pg-simple`; índice por `expire` |
| Paciente | `pacientes.paciente` | PK `id` · FK `creado_por` | (`tipo_documento`, `numero_documento`) único; DNI = 8 dígitos; sexo F/M; nacimiento ≤ hoy; el canal de recordatorio exige tener correo o teléfono |
| Antecedente | `pacientes.antecedente` | PK `id` · FK `paciente_id`, `registrado_por` | `tipo` en lista cerrada |
| Especialidad | `agenda.especialidad` | PK `id` | `nombre` único; duración 10–120 min |
| Consultorio | `agenda.consultorio` | PK `id` | `codigo` único |
| Médico | `agenda.medico` | PK `id` · FK `usuario_id` (1:1), `especialidad_id` | `cmp` único; nombre y correo viven en `usuario` (no se duplican) |
| Horario del médico | `agenda.horario_medico` | PK `id` · FK `medico_id` | (`medico_id`, `dia_semana`, `hora_inicio`) único; `hora_fin > hora_inicio` |
| Cita | `agenda.cita` | PK `id` · FK `paciente_id`, `medico_id`, `consultorio_id`, `creado_por` | **`EXCLUDE` sin solape por médico y por consultorio (citas no canceladas)**; `fin > inicio`; estado en lista cerrada |
| Historial de cita | `agenda.cita_historial` | PK `id` · FK `cita_id`, `usuario_id` | Solo anexado (trigger); `usuario_id` obligatorio (RNF04) |
| Evento *outbox* | `agenda.outbox_evento` | PK `id` | `tipo` en lista cerrada; índice parcial de pendientes |
| Recordatorio | `notificaciones.recordatorio` | PK `id` · FK `cita_id` | (`cita_id`, `canal`, `programado_para`) único; `enviado` ⇔ `enviado_en` no nulo |
| CIE-10 | `hce.cie10` | PK `codigo` | Formato de código CIE-10 |
| Entrada de HCE (consulta) | `hce.entrada` | PK `id` · FK `paciente_id`, `cita_id`, `medico_id`, `corrige_a_id` | **Solo anexado** (sin UPDATE/DELETE/TRUNCATE); índice (`paciente_id`, `fecha` DESC) |
| Diagnóstico | `hce.diagnostico` | PK (`entrada_id`, `cie10_codigo`) · FK ambas | Un solo diagnóstico `principal` por entrada |
| Indicación | `hce.indicacion` | PK `id` · FK `entrada_id` | Solo anexado |
| Ítem de receta | `hce.receta_item` | PK `id` · FK `entrada_id` | Duración 1–365 días; solo anexado |
| Anulación | `hce.anulacion` | PK `id` · FK `entrada_id` (único), `anulado_por` | **Motivo ≥ 10 caracteres**; una anulación por entrada; solo anexado |
| Bitácora de auditoría | `auditoria.bitacora` | PK `id` · FK `usuario_id`, `paciente_id` | Solo anexado; `accion` en lista cerrada |
| Examen | `laboratorio.examen` | PK `id` | `codigo` único; tipo laboratorio/imagen |
| Orden | `laboratorio.orden` | PK `id` · FK `paciente_id`, `entrada_id`, `medico_id` | — |
| Ítem de orden | `laboratorio.orden_item` | PK `id` · FK `orden_id`, `examen_id` | (`orden_id`, `examen_id`) único |
| Resultado | `laboratorio.resultado` | PK `id` · FK `orden_item_id` (único), `registrado_por` | Un resultado por ítem; debe tener valor o archivo |
| Convenio | `facturacion.convenio` | PK `id` | `nombre` único; tipo particular/eps/soat |
| Concepto facturable | `facturacion.concepto` | PK `id` | `codigo` único |
| Tarifa | `facturacion.tarifa` | PK `id` · FK `convenio_id`, `concepto_id` | **`EXCLUDE` sin vigencias solapadas** por convenio y concepto; precio ≥ 0; copago 0–100 % |
| Convenio del paciente | `facturacion.paciente_convenio` | PK `id` · FK `paciente_id`, `convenio_id` | **`EXCLUDE`: un solo convenio vigente a la vez** |
| Comprobante | `facturacion.comprobante` | PK `id` · FK `paciente_id`, `convenio_id`, `cita_id`, `emitido_por` | (`serie`, `numero`) único; serie B… para boleta y F… para factura |
| Ítem de comprobante | `facturacion.comprobante_item` | PK `id` · FK `comprobante_id`, `concepto_id` | Copago ≤ precio × cantidad; (`comprobante_id`, `concepto_id`) único |
| Glosa | `facturacion.glosa` | PK `id` · FK `comprobante_id` | Monto > 0; `abierta` ⇔ sin fecha de resolución |

### 2.2 Normalización (1FN, 2FN, 3FN)

- **1FN:** todos los atributos son atómicos. Los datos repetibles están en tablas hijas (`antecedente`, `diagnostico`, `indicacion`, `receta_item`, `orden_item`, `comprobante_item`) y no en listas dentro de una columna. Las dos columnas `jsonb` (`valor_anterior`, `payload`) son instantáneas de auditoría o eventos, que nunca se consultan por partes en el negocio.
- **2FN:** las tablas con llave compuesta (`hce.diagnostico`) no tienen atributos que dependan de solo una parte de la llave; el resto usa llave simple.
- **3FN:** no hay dependencias entre atributos que no son llave. Decisiones principales:

| # | Decisión de normalización o de negocio | Justificación |
| --- | --- | --- |
| 1 | `especialidad` en su propia tabla y el médico solo guarda `especialidad_id` | Evita repetir el nombre y la duración de cita en cada médico (dependencia transitiva `medico → especialidad → duración`). |
| 2 | `medico` no repite nombre ni correo: los toma de `usuario` | Una sola fuente de verdad para los datos personales del personal. |
| 3 | El **estado** de una entrada de HCE (vigente/anulada) **no se guarda**: se deriva de la existencia de `hce.anulacion` | Evita una columna redundante y permite que `hce.entrada` sea de solo anexado (RF04, ADR-04). Una corrección es otra entrada que apunta a la anterior (`corrige_a_id`). |
| 4 | El estado de un ítem de laboratorio (pendiente/con resultado) **se deriva** de la existencia de `laboratorio.resultado` | Misma lógica: no se duplica un hecho que ya está en otra tabla (HU04). |
| 5 | El convenio del paciente vive en `facturacion.paciente_convenio` con vigencia, no como columna de `paciente` | El convenio es de facturación, cambia en el tiempo y un paciente puede tener historial de convenios. Mantiene a `pacientes` libre de datos de otro módulo. |
| 6 | `tarifa` separada de `comprobante_item` | El tarifario cambia por vigencia; los comprobantes referencian el concepto. |
| 7 | **Desnormalización consciente:** `comprobante_item.precio_unitario` y `copago_monto` copian la tarifa al emitir | Un comprobante emitido es un documento fiscal: no debe cambiar si mañana se actualiza el tarifario. El total no se almacena: se calcula. |
| 8 | Reglas críticas dentro de la BD (`EXCLUDE`, `CHECK`, triggers) y no solo en el código | La integridad no depende de que cada módulo recuerde validar (ADR-03, ADR-04). |

### 2.3 Diagrama entidad-relación — código para dbdiagram.io

**Cómo usarlo:** entren a <https://dbdiagram.io/d>, borren el contenido del editor, peguen el bloque completo y el diagrama se genera solo (31 tablas, 44 relaciones; el código fue validado con el parser oficial de DBML). Después, *Export → PNG/PDF* para pegarlo en el entregable.

- Las restricciones `EXCLUDE` y los triggers no existen en DBML; por eso aparecen como **Note** en las tablas `cita`, `tarifa`, `paciente_convenio`, `entrada` y `bitacora`. Están implementadas en el script SQL del Paso 3.
- Si su plan de dbdiagram limitara el número de tablas por diagrama, usen solo el bloque **Sprint 1** (20 tablas): borren desde `// ====== SPRINT 2 ======` hasta antes de los `TableGroup`, y borren también los grupos `Laboratorio` y `Facturacion`.

```dbml
// SIGC - Clinica San Rafael S.A.C. · Equipo C · SW705 Semana 6
// Un esquema por modulo (ADR-02). Pegar en https://dbdiagram.io/d
// Los bloques estan en orden de dependencia: si recorta desde "Sprint 2" hacia abajo, el resto sigue siendo valido.

Project sigc_clinica_san_rafael {
  database_type: 'PostgreSQL'
  Note: 'PostgreSQL 18 · esquema por modulo · HCE y auditoria de solo anexado'
}

// ======================= SPRINT 1 =======================

// ---------- Seguridad ----------
Table seguridad.rol {
  id smallint [pk, increment]
  nombre varchar(30) [not null, unique]
  descripcion varchar(200)
}

Table seguridad.usuario {
  id uuid [pk, default: `uuidv7()`]
  username varchar(40) [not null, unique]
  nombres varchar(80) [not null]
  apellidos varchar(80) [not null]
  email varchar(120) [not null, unique]
  password_hash varchar(255) [not null, note: 'Argon2id']
  rol_id smallint [not null]
  activo boolean [not null, default: true]
  creado_en timestamptz [not null, default: `now()`]
}

Table seguridad.sesion {
  sid varchar [pk]
  sess json [not null]
  expire timestamp [not null]
  indexes { expire }
}

Ref: seguridad.usuario.rol_id > seguridad.rol.id

// ---------- Pacientes ----------
Table pacientes.paciente {
  id uuid [pk, default: `uuidv7()`]
  tipo_documento varchar(10) [not null, default: 'DNI', note: 'DNI | CE | PASAPORTE']
  numero_documento varchar(15) [not null]
  nombres varchar(80) [not null]
  apellido_paterno varchar(60) [not null]
  apellido_materno varchar(60) [not null]
  fecha_nacimiento date [not null]
  sexo char(1) [not null, note: 'F | M']
  telefono varchar(20)
  email varchar(120)
  direccion varchar(200)
  canal_recordatorio varchar(5) [not null, default: 'email', note: 'email | sms (HU02)']
  creado_en timestamptz [not null, default: `now()`]
  creado_por uuid [not null]
  indexes { (tipo_documento, numero_documento) [unique] }
}

Table pacientes.antecedente {
  id uuid [pk, default: `uuidv7()`]
  paciente_id uuid [not null]
  tipo varchar(15) [not null, note: 'alergia | personal | familiar | quirurgico | habito']
  descripcion varchar(300) [not null]
  registrado_en timestamptz [not null, default: `now()`]
  registrado_por uuid [not null]
  indexes { paciente_id }
}

Ref: pacientes.paciente.creado_por > seguridad.usuario.id
Ref: pacientes.antecedente.paciente_id > pacientes.paciente.id
Ref: pacientes.antecedente.registrado_por > seguridad.usuario.id

// ---------- Agenda y citas ----------
Table agenda.especialidad {
  id smallint [pk, increment]
  nombre varchar(60) [not null, unique]
  duracion_cita_min smallint [not null, default: 30]
}

Table agenda.consultorio {
  id smallint [pk, increment]
  codigo varchar(10) [not null, unique]
  piso smallint [not null]
}

Table agenda.medico {
  id uuid [pk, default: `uuidv7()`]
  usuario_id uuid [not null, unique]
  cmp varchar(10) [not null, unique, note: 'N. de colegiatura']
  especialidad_id smallint [not null]
  activo boolean [not null, default: true]
}

Table agenda.horario_medico {
  id smallint [pk, increment]
  medico_id uuid [not null]
  dia_semana smallint [not null, note: '1=lunes ... 7=domingo']
  hora_inicio time [not null]
  hora_fin time [not null]
  indexes { (medico_id, dia_semana, hora_inicio) [unique] }
}

Table agenda.cita {
  id uuid [pk, default: `uuidv7()`]
  paciente_id uuid [not null]
  medico_id uuid [not null]
  consultorio_id smallint [not null]
  inicio timestamptz [not null]
  fin timestamptz [not null]
  motivo varchar(300) [not null]
  estado varchar(15) [not null, default: 'programada', note: 'programada | confirmada | atendida | cancelada | inasistencia']
  llegada_en timestamptz
  atencion_inicio_en timestamptz
  creado_en timestamptz [not null, default: `now()`]
  creado_por uuid [not null]
  Note: 'ADR-03: EXCLUDE USING gist (medico_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE estado <> cancelada. Igual para consultorio_id.'
  indexes {
    (paciente_id, inicio)
    (medico_id, inicio)
  }
}

Table agenda.cita_historial {
  id bigint [pk, increment]
  cita_id uuid [not null]
  accion varchar(20) [not null, note: 'creacion | reprogramacion | cancelacion | cambio_estado']
  usuario_id uuid [not null]
  ocurrio_en timestamptz [not null, default: `now()`]
  valor_anterior jsonb
  Note: 'RNF04. Solo anexado (trigger).'
  indexes { (cita_id, ocurrio_en) }
}

Table agenda.outbox_evento {
  id uuid [pk, default: `uuidv7()`]
  tipo varchar(40) [not null, note: 'CitaProgramada | CitaReprogramada | CitaCancelada']
  agregado_id uuid [not null]
  payload jsonb [not null]
  creado_en timestamptz [not null, default: `now()`]
  procesado_en timestamptz
  Note: 'ADR-05: patron outbox transaccional'
}

Ref: agenda.medico.usuario_id - seguridad.usuario.id
Ref: agenda.medico.especialidad_id > agenda.especialidad.id
Ref: agenda.horario_medico.medico_id > agenda.medico.id
Ref: agenda.cita.paciente_id > pacientes.paciente.id
Ref: agenda.cita.medico_id > agenda.medico.id
Ref: agenda.cita.consultorio_id > agenda.consultorio.id
Ref: agenda.cita.creado_por > seguridad.usuario.id
Ref: agenda.cita_historial.cita_id > agenda.cita.id
Ref: agenda.cita_historial.usuario_id > seguridad.usuario.id

// ---------- Notificaciones ----------
Table notificaciones.recordatorio {
  id uuid [pk, default: `uuidv7()`]
  cita_id uuid [not null]
  canal varchar(5) [not null, note: 'email | sms']
  programado_para timestamptz [not null]
  estado varchar(10) [not null, default: 'pendiente', note: 'pendiente | enviado | fallido']
  intentos smallint [not null, default: 0]
  enviado_en timestamptz
  error varchar(300)
  indexes { (cita_id, canal, programado_para) [unique] }
}

Ref: notificaciones.recordatorio.cita_id > agenda.cita.id

// ---------- Historia clinica electronica (solo anexado) ----------
Table hce.cie10 {
  codigo varchar(8) [pk]
  descripcion varchar(250) [not null]
}

Table hce.entrada {
  id uuid [pk, default: `uuidv7()`]
  paciente_id uuid [not null]
  cita_id uuid
  medico_id uuid [not null]
  fecha timestamptz [not null, default: `now()`]
  motivo_consulta varchar(300) [not null]
  enfermedad_actual text [not null]
  examen_fisico text
  corrige_a_id uuid [note: 'una correccion es una entrada nueva']
  Note: 'ADR-04: sin UPDATE ni DELETE. El estado (vigente/anulada) se deriva de hce.anulacion.'
  indexes { (paciente_id, fecha) }
}

Table hce.diagnostico {
  entrada_id uuid [not null]
  cie10_codigo varchar(8) [not null]
  tipo varchar(10) [not null, default: 'principal', note: 'principal | secundario']
  indexes { (entrada_id, cie10_codigo) [pk] }
}

Table hce.indicacion {
  id uuid [pk, default: `uuidv7()`]
  entrada_id uuid [not null]
  descripcion varchar(500) [not null]
}

Table hce.receta_item {
  id uuid [pk, default: `uuidv7()`]
  entrada_id uuid [not null]
  medicamento varchar(120) [not null]
  dosis varchar(60) [not null]
  frecuencia varchar(60) [not null]
  duracion_dias smallint [not null]
}

Table hce.anulacion {
  id uuid [pk, default: `uuidv7()`]
  entrada_id uuid [not null, unique]
  anulado_por uuid [not null]
  anulado_en timestamptz [not null, default: `now()`]
  motivo varchar(300) [not null, note: 'minimo 10 caracteres (RF04)']
}

Ref: hce.entrada.paciente_id > pacientes.paciente.id
Ref: hce.entrada.cita_id > agenda.cita.id
Ref: hce.entrada.medico_id > agenda.medico.id
Ref: hce.entrada.corrige_a_id > hce.entrada.id
Ref: hce.diagnostico.entrada_id > hce.entrada.id
Ref: hce.diagnostico.cie10_codigo > hce.cie10.codigo
Ref: hce.indicacion.entrada_id > hce.entrada.id
Ref: hce.receta_item.entrada_id > hce.entrada.id
Ref: hce.anulacion.entrada_id - hce.entrada.id
Ref: hce.anulacion.anulado_por > seguridad.usuario.id

// ---------- Auditoria (solo anexado) ----------
Table auditoria.bitacora {
  id bigint [pk, increment]
  ocurrio_en timestamptz [not null, default: `now()`]
  usuario_id uuid [note: 'NULL en LOGIN_FALLIDO']
  accion varchar(20) [not null, note: 'LECTURA | ESCRITURA | ANULACION | LOGIN | LOGIN_FALLIDO | ACCESO_DENEGADO']
  recurso varchar(60) [not null]
  recurso_id uuid
  paciente_id uuid
  ip inet
  detalle jsonb
  indexes {
    (paciente_id, ocurrio_en)
    (usuario_id, ocurrio_en)
  }
}

Ref: auditoria.bitacora.usuario_id > seguridad.usuario.id
Ref: auditoria.bitacora.paciente_id > pacientes.paciente.id

// ======================= SPRINT 2 =======================

// ---------- Laboratorio e imagenes ----------
Table laboratorio.examen {
  id smallint [pk, increment]
  codigo varchar(20) [not null, unique]
  nombre varchar(120) [not null]
  tipo varchar(12) [not null, note: 'laboratorio | imagen']
}

Table laboratorio.orden {
  id uuid [pk, default: `uuidv7()`]
  paciente_id uuid [not null]
  entrada_id uuid
  medico_id uuid [not null]
  creada_en timestamptz [not null, default: `now()`]
  indicacion_clinica varchar(300)
}

Table laboratorio.orden_item {
  id uuid [pk, default: `uuidv7()`]
  orden_id uuid [not null]
  examen_id smallint [not null]
  indexes { (orden_id, examen_id) [unique] }
}

Table laboratorio.resultado {
  id uuid [pk, default: `uuidv7()`]
  orden_item_id uuid [not null, unique, note: 'sin fila = pendiente (HU04)']
  valor varchar(200)
  unidad varchar(20)
  rango_referencia varchar(60)
  archivo_url varchar(300)
  observaciones varchar(300)
  registrado_por uuid [not null]
  registrado_en timestamptz [not null, default: `now()`]
}

Ref: laboratorio.orden.paciente_id > pacientes.paciente.id
Ref: laboratorio.orden.entrada_id > hce.entrada.id
Ref: laboratorio.orden.medico_id > agenda.medico.id
Ref: laboratorio.orden_item.orden_id > laboratorio.orden.id
Ref: laboratorio.orden_item.examen_id > laboratorio.examen.id
Ref: laboratorio.resultado.orden_item_id - laboratorio.orden_item.id
Ref: laboratorio.resultado.registrado_por > seguridad.usuario.id

// ---------- Facturacion y convenios ----------
Table facturacion.convenio {
  id smallint [pk, increment]
  nombre varchar(80) [not null, unique]
  tipo varchar(12) [not null, note: 'particular | eps | soat']
}

Table facturacion.concepto {
  id smallint [pk, increment]
  codigo varchar(25) [not null, unique]
  descripcion varchar(150) [not null]
}

Table facturacion.tarifa {
  id bigint [pk, increment]
  convenio_id smallint [not null]
  concepto_id smallint [not null]
  precio numeric(10,2) [not null]
  copago_pct numeric(5,2) [not null, note: '% del precio que paga el paciente']
  vigente_desde date [not null]
  vigente_hasta date
  Note: 'EXCLUDE: sin vigencias solapadas por (convenio, concepto)'
}

Table facturacion.paciente_convenio {
  id uuid [pk, default: `uuidv7()`]
  paciente_id uuid [not null]
  convenio_id smallint [not null]
  nro_poliza varchar(30)
  vigente_desde date [not null]
  vigente_hasta date
  Note: 'EXCLUDE: un solo convenio vigente por paciente'
}

Table facturacion.comprobante {
  id uuid [pk, default: `uuidv7()`]
  tipo varchar(10) [not null, note: 'boleta | factura']
  serie varchar(4) [not null]
  numero integer [not null]
  paciente_id uuid [not null]
  convenio_id smallint [not null]
  cita_id uuid
  emitido_en timestamptz [not null, default: `now()`]
  emitido_por uuid [not null]
  estado varchar(10) [not null, default: 'emitido', note: 'emitido | anulado']
  indexes { (serie, numero) [unique] }
}

Table facturacion.comprobante_item {
  id uuid [pk, default: `uuidv7()`]
  comprobante_id uuid [not null]
  concepto_id smallint [not null]
  cantidad smallint [not null, default: 1]
  precio_unitario numeric(10,2) [not null, note: 'foto de la tarifa al emitir']
  copago_monto numeric(10,2) [not null]
  indexes { (comprobante_id, concepto_id) [unique] }
}

Table facturacion.glosa {
  id uuid [pk, default: `uuidv7()`]
  comprobante_id uuid [not null]
  motivo varchar(300) [not null]
  monto numeric(10,2) [not null]
  estado varchar(10) [not null, default: 'abierta', note: 'abierta | subsanada | aceptada']
  registrada_en timestamptz [not null, default: `now()`]
  resuelta_en timestamptz
}

Ref: facturacion.tarifa.convenio_id > facturacion.convenio.id
Ref: facturacion.tarifa.concepto_id > facturacion.concepto.id
Ref: facturacion.paciente_convenio.paciente_id > pacientes.paciente.id
Ref: facturacion.paciente_convenio.convenio_id > facturacion.convenio.id
Ref: facturacion.comprobante.paciente_id > pacientes.paciente.id
Ref: facturacion.comprobante.convenio_id > facturacion.convenio.id
Ref: facturacion.comprobante.cita_id > agenda.cita.id
Ref: facturacion.comprobante.emitido_por > seguridad.usuario.id
Ref: facturacion.comprobante_item.comprobante_id > facturacion.comprobante.id
Ref: facturacion.comprobante_item.concepto_id > facturacion.concepto.id
Ref: facturacion.glosa.comprobante_id > facturacion.comprobante.id

// ---------- Agrupaciones (opcional, para ordenar el lienzo) ----------
TableGroup Seguridad {
  seguridad.rol
  seguridad.usuario
  seguridad.sesion
}
TableGroup Pacientes {
  pacientes.paciente
  pacientes.antecedente
}
TableGroup Agenda {
  agenda.especialidad
  agenda.consultorio
  agenda.medico
  agenda.horario_medico
  agenda.cita
  agenda.cita_historial
  agenda.outbox_evento
  notificaciones.recordatorio
}
TableGroup HCE {
  hce.cie10
  hce.entrada
  hce.diagnostico
  hce.indicacion
  hce.receta_item
  hce.anulacion
}
TableGroup Auditoria {
  auditoria.bitacora
}
TableGroup Laboratorio {
  laboratorio.examen
  laboratorio.orden
  laboratorio.orden_item
  laboratorio.resultado
}
TableGroup Facturacion {
  facturacion.convenio
  facturacion.concepto
  facturacion.tarifa
  facturacion.paciente_convenio
  facturacion.comprobante
  facturacion.comprobante_item
  facturacion.glosa
}
```

---

## Paso 3 — Script SQL y datos de prueba

**Motor:** PostgreSQL 18 (por `uuidv7()` nativo y la extensión `btree_gist`). Ejecuten los dos scripts, en orden, sobre una base **vacía**:

```bash
createdb sigc
psql -d sigc -v ON_ERROR_STOP=1 -f 01_schema.sql
psql -d sigc -v ON_ERROR_STOP=1 -f 02_data.sql
```

**Qué se verificó:** ambos scripts se ejecutaron completos, sin errores, en un PostgreSQL 16 temporal usando un reemplazo de `uuidv7()` (`gen_random_uuid()`); no pude probarlos en PostgreSQL 18, donde `uuidv7()` es nativo. Si algún compañero usa una versión anterior a la 18, descomente la línea del *shim* al inicio de `01_schema.sql`. También se comprobó que: una doble reserva es rechazada por la BD, `DELETE`/`UPDATE`/`TRUNCATE` sobre la HCE y la bitácora fallan, una anulación con motivo corto es rechazada, una reprogramación queda en `cita_historial` con el valor anterior y las vistas de `reportes` devuelven datos.

**Datos de prueba (todos ficticios):** 11 usuarios (los 7 roles), 8 pacientes, 5 médicos con 25 franjas de horario, 12 citas, 7 entradas de HCE (una anulada y corregida), 5 órdenes de laboratorio (2 pendientes), 5 convenios con 30 tarifas, 5 comprobantes y 3 glosas. Los convenios y aseguradoras llevan "(ficticia)" y los hashes de contraseña son de ejemplo.

### 3.1 `01_schema.sql` — creación del modelo

```sql
-- =====================================================================
-- SIGC - Clínica San Rafael S.A.C. · Equipo C · SW705 Semana 6
-- Script 1/2: creación del modelo (PostgreSQL 18)
-- Diseñado para una base de datos VACÍA. Todos los datos son ficticios.
-- =====================================================================

-- uuidv7() es nativo desde PostgreSQL 18. En versiones anteriores,
-- descomentar este shim (solo para pruebas locales):
-- CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid LANGUAGE sql AS 'SELECT gen_random_uuid()';

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- necesaria para EXCLUDE con uuid/smallint

-- Un esquema por módulo (ADR-02). Se agrega "notificaciones", que el ADR-02 omitía.
CREATE SCHEMA seguridad;
CREATE SCHEMA pacientes;
CREATE SCHEMA agenda;
CREATE SCHEMA notificaciones;
CREATE SCHEMA hce;
CREATE SCHEMA auditoria;
CREATE SCHEMA laboratorio;
CREATE SCHEMA facturacion;
CREATE SCHEMA reportes;

-- Función compartida: tablas de solo anexado (ADR-04, RNF de trazabilidad)
CREATE FUNCTION public.fn_solo_anexar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La tabla %.% es de solo anexado: % no permitido',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP USING ERRCODE = 'integrity_constraint_violation';
END $$;

-- =====================================================================
-- M0 · SEGURIDAD (IAM)
-- =====================================================================
CREATE TABLE seguridad.rol (
  id          smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nombre      varchar(30)  NOT NULL UNIQUE,
  descripcion varchar(200)
);

CREATE TABLE seguridad.usuario (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  username      varchar(40)  NOT NULL UNIQUE,
  nombres       varchar(80)  NOT NULL,
  apellidos     varchar(80)  NOT NULL,
  email         varchar(120) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,                 -- Argon2id (RNF02)
  rol_id        smallint     NOT NULL REFERENCES seguridad.rol(id),
  activo        boolean      NOT NULL DEFAULT true,
  creado_en     timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT usuario_email_formato CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT usuario_hash_no_plano CHECK (password_hash LIKE '$argon2id$%')
);

-- Almacén de sesiones de connect-pg-simple (cierre a los 10 min, RNF02)
CREATE TABLE seguridad.sesion (
  sid    varchar      PRIMARY KEY,
  sess   json         NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX ix_sesion_expire ON seguridad.sesion (expire);

-- =====================================================================
-- M1 · PACIENTES (núcleo compartido)
-- =====================================================================
CREATE TABLE pacientes.paciente (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  tipo_documento     varchar(10)  NOT NULL DEFAULT 'DNI',
  numero_documento   varchar(15)  NOT NULL,
  nombres            varchar(80)  NOT NULL,
  apellido_paterno   varchar(60)  NOT NULL,
  apellido_materno   varchar(60)  NOT NULL,
  fecha_nacimiento   date         NOT NULL,
  sexo               char(1)      NOT NULL,
  telefono           varchar(20),
  email              varchar(120),
  direccion          varchar(200),
  canal_recordatorio varchar(5)   NOT NULL DEFAULT 'email',   -- HU02
  creado_en          timestamptz  NOT NULL DEFAULT now(),
  creado_por         uuid         NOT NULL REFERENCES seguridad.usuario(id),
  CONSTRAINT paciente_documento_unico UNIQUE (tipo_documento, numero_documento),
  CONSTRAINT paciente_tipo_doc   CHECK (tipo_documento IN ('DNI','CE','PASAPORTE')),
  CONSTRAINT paciente_dni_formato CHECK (tipo_documento <> 'DNI' OR numero_documento ~ '^[0-9]{8}$'),
  CONSTRAINT paciente_sexo       CHECK (sexo IN ('F','M')),
  CONSTRAINT paciente_nacimiento CHECK (fecha_nacimiento <= CURRENT_DATE),
  CONSTRAINT paciente_canal      CHECK (canal_recordatorio IN ('email','sms')),
  CONSTRAINT paciente_canal_tiene_destino CHECK (
    (canal_recordatorio = 'email' AND email IS NOT NULL) OR
    (canal_recordatorio = 'sms'   AND telefono IS NOT NULL))
);

CREATE TABLE pacientes.antecedente (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  paciente_id   uuid         NOT NULL REFERENCES pacientes.paciente(id),
  tipo          varchar(15)  NOT NULL,
  descripcion   varchar(300) NOT NULL,
  registrado_en timestamptz  NOT NULL DEFAULT now(),
  registrado_por uuid        NOT NULL REFERENCES seguridad.usuario(id),
  CONSTRAINT antecedente_tipo CHECK (tipo IN ('alergia','personal','familiar','quirurgico','habito'))
);
CREATE INDEX ix_antecedente_paciente ON pacientes.antecedente (paciente_id);

-- =====================================================================
-- M2 · AGENDA Y CITAS
-- =====================================================================
CREATE TABLE agenda.especialidad (
  id               smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nombre           varchar(60) NOT NULL UNIQUE,
  duracion_cita_min smallint   NOT NULL DEFAULT 30,
  CONSTRAINT especialidad_duracion CHECK (duracion_cita_min BETWEEN 10 AND 120)
);

CREATE TABLE agenda.consultorio (
  id     smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  codigo varchar(10) NOT NULL UNIQUE,
  piso   smallint    NOT NULL
);

CREATE TABLE agenda.medico (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  usuario_id      uuid        NOT NULL UNIQUE REFERENCES seguridad.usuario(id),
  cmp             varchar(10) NOT NULL UNIQUE,            -- N.° de colegiatura
  especialidad_id smallint    NOT NULL REFERENCES agenda.especialidad(id),
  activo          boolean     NOT NULL DEFAULT true
);
CREATE INDEX ix_medico_especialidad ON agenda.medico (especialidad_id);

CREATE TABLE agenda.horario_medico (
  id          smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  medico_id   uuid     NOT NULL REFERENCES agenda.medico(id),
  dia_semana  smallint NOT NULL,                          -- 1 = lunes ... 7 = domingo
  hora_inicio time     NOT NULL,
  hora_fin    time     NOT NULL,
  CONSTRAINT horario_dia  CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT horario_rango CHECK (hora_fin > hora_inicio),
  CONSTRAINT horario_unico UNIQUE (medico_id, dia_semana, hora_inicio)
);

CREATE TABLE agenda.cita (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  paciente_id        uuid         NOT NULL REFERENCES pacientes.paciente(id),
  medico_id          uuid         NOT NULL REFERENCES agenda.medico(id),
  consultorio_id     smallint     NOT NULL REFERENCES agenda.consultorio(id),
  inicio             timestamptz  NOT NULL,
  fin                timestamptz  NOT NULL,
  motivo             varchar(300) NOT NULL,
  estado             varchar(15)  NOT NULL DEFAULT 'programada',
  llegada_en         timestamptz,                         -- para tiempos de espera (RF10)
  atencion_inicio_en timestamptz,
  creado_en          timestamptz  NOT NULL DEFAULT now(),
  creado_por         uuid         NOT NULL REFERENCES seguridad.usuario(id),
  CONSTRAINT cita_rango  CHECK (fin > inicio),
  CONSTRAINT cita_estado CHECK (estado IN ('programada','confirmada','atendida','cancelada','inasistencia')),
  CONSTRAINT cita_espera CHECK (atencion_inicio_en IS NULL OR atencion_inicio_en >= llegada_en),
  -- ADR-03 / HU01: ningún médico con dos citas activas solapadas
  CONSTRAINT cita_sin_solape_medico EXCLUDE USING gist
    (medico_id WITH =, tstzrange(inicio, fin, '[)') WITH &&) WHERE (estado <> 'cancelada'),
  -- un consultorio tampoco puede tener dos citas activas a la vez
  CONSTRAINT cita_sin_solape_consultorio EXCLUDE USING gist
    (consultorio_id WITH =, tstzrange(inicio, fin, '[)') WITH &&) WHERE (estado <> 'cancelada')
);
CREATE INDEX ix_cita_paciente ON agenda.cita (paciente_id, inicio DESC);
CREATE INDEX ix_cita_medico_inicio ON agenda.cita (medico_id, inicio);

-- RNF04: historial de cambios de citas (solo anexado)
CREATE TABLE agenda.cita_historial (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cita_id        uuid         NOT NULL REFERENCES agenda.cita(id),
  accion         varchar(20)  NOT NULL,
  usuario_id     uuid         NOT NULL REFERENCES seguridad.usuario(id),
  ocurrio_en     timestamptz  NOT NULL DEFAULT now(),
  valor_anterior jsonb,                                    -- NULL en la creación
  CONSTRAINT historial_accion CHECK (accion IN ('creacion','reprogramacion','cancelacion','cambio_estado'))
);
CREATE INDEX ix_historial_cita ON agenda.cita_historial (cita_id, ocurrio_en);

CREATE FUNCTION agenda.fn_cita_historial() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_usuario uuid := NULLIF(current_setting('app.usuario_id', true), '')::uuid;  -- lo fija la API por transacción
  v_accion  varchar(20);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO agenda.cita_historial (cita_id, accion, usuario_id, valor_anterior)
    VALUES (NEW.id, 'creacion', COALESCE(v_usuario, NEW.creado_por), NULL);
  ELSE
    IF NEW.estado = 'cancelada' AND OLD.estado <> 'cancelada' THEN v_accion := 'cancelacion';
    ELSIF NEW.inicio <> OLD.inicio OR NEW.fin <> OLD.fin OR NEW.medico_id <> OLD.medico_id THEN v_accion := 'reprogramacion';
    ELSE v_accion := 'cambio_estado';
    END IF;
    INSERT INTO agenda.cita_historial (cita_id, accion, usuario_id, valor_anterior)
    VALUES (NEW.id, v_accion, v_usuario, to_jsonb(OLD));   -- NOT NULL: la API debe fijar app.usuario_id
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_cita_historial AFTER INSERT OR UPDATE ON agenda.cita
  FOR EACH ROW EXECUTE FUNCTION agenda.fn_cita_historial();
CREATE TRIGGER tg_historial_solo_anexar BEFORE UPDATE OR DELETE ON agenda.cita_historial
  FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();

-- Outbox transaccional (ADR-05): lo escribe agenda en la misma transacción que la cita
CREATE TABLE agenda.outbox_evento (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  tipo         varchar(40) NOT NULL,                       -- CitaProgramada, CitaReprogramada, CitaCancelada
  agregado_id  uuid        NOT NULL,
  payload      jsonb       NOT NULL,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  procesado_en timestamptz,
  CONSTRAINT outbox_tipo CHECK (tipo IN ('CitaProgramada','CitaReprogramada','CitaCancelada'))
);
CREATE INDEX ix_outbox_pendientes ON agenda.outbox_evento (creado_en) WHERE procesado_en IS NULL;

-- =====================================================================
-- M2 · NOTIFICACIONES (HU02)
-- =====================================================================
CREATE TABLE notificaciones.recordatorio (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  cita_id         uuid         NOT NULL REFERENCES agenda.cita(id),
  canal           varchar(5)   NOT NULL,
  programado_para timestamptz  NOT NULL,
  estado          varchar(10)  NOT NULL DEFAULT 'pendiente',
  intentos        smallint     NOT NULL DEFAULT 0,
  enviado_en      timestamptz,
  error           varchar(300),
  CONSTRAINT recordatorio_canal  CHECK (canal IN ('email','sms')),
  CONSTRAINT recordatorio_estado CHECK (estado IN ('pendiente','enviado','fallido')),
  CONSTRAINT recordatorio_intentos CHECK (intentos >= 0),
  CONSTRAINT recordatorio_enviado_coherente CHECK ((estado = 'enviado') = (enviado_en IS NOT NULL)),
  CONSTRAINT recordatorio_unico UNIQUE (cita_id, canal, programado_para)
);
CREATE INDEX ix_recordatorio_pendientes ON notificaciones.recordatorio (programado_para) WHERE estado = 'pendiente';

-- =====================================================================
-- M1 · HISTORIA CLÍNICA ELECTRÓNICA (solo anexado, ADR-04)
-- =====================================================================
CREATE TABLE hce.cie10 (
  codigo      varchar(8)   PRIMARY KEY,
  descripcion varchar(250) NOT NULL,
  CONSTRAINT cie10_formato CHECK (codigo ~ '^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$')
);

CREATE TABLE hce.entrada (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  paciente_id     uuid         NOT NULL REFERENCES pacientes.paciente(id),
  cita_id         uuid         REFERENCES agenda.cita(id),         -- puede ser NULL (p. ej. emergencia)
  medico_id       uuid         NOT NULL REFERENCES agenda.medico(id),
  fecha           timestamptz  NOT NULL DEFAULT now(),
  motivo_consulta varchar(300) NOT NULL,
  enfermedad_actual text       NOT NULL,
  examen_fisico   text,
  corrige_a_id    uuid         REFERENCES hce.entrada(id),          -- correcciones = entrada nueva
  CONSTRAINT entrada_no_se_corrige_a_si_misma CHECK (corrige_a_id IS NULL OR corrige_a_id <> id)
);
CREATE INDEX ix_entrada_paciente_fecha ON hce.entrada (paciente_id, fecha DESC);   -- RNF: HCE < 2 s

CREATE TABLE hce.diagnostico (
  entrada_id    uuid        NOT NULL REFERENCES hce.entrada(id),
  cie10_codigo  varchar(8)  NOT NULL REFERENCES hce.cie10(codigo),
  tipo          varchar(10) NOT NULL DEFAULT 'principal',
  PRIMARY KEY (entrada_id, cie10_codigo),
  CONSTRAINT diagnostico_tipo CHECK (tipo IN ('principal','secundario'))
);
CREATE UNIQUE INDEX ux_un_diagnostico_principal ON hce.diagnostico (entrada_id) WHERE tipo = 'principal';

CREATE TABLE hce.indicacion (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  entrada_id  uuid         NOT NULL REFERENCES hce.entrada(id),
  descripcion varchar(500) NOT NULL
);
CREATE INDEX ix_indicacion_entrada ON hce.indicacion (entrada_id);

CREATE TABLE hce.receta_item (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  entrada_id    uuid        NOT NULL REFERENCES hce.entrada(id),
  medicamento   varchar(120) NOT NULL,
  dosis         varchar(60)  NOT NULL,
  frecuencia    varchar(60)  NOT NULL,
  duracion_dias smallint     NOT NULL,
  CONSTRAINT receta_duracion CHECK (duracion_dias BETWEEN 1 AND 365)
);
CREATE INDEX ix_receta_entrada ON hce.receta_item (entrada_id);

-- RF04: la anulación es un registro aparte; el estado de la entrada se DERIVA de su existencia (3FN)
CREATE TABLE hce.anulacion (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  entrada_id  uuid         NOT NULL UNIQUE REFERENCES hce.entrada(id),
  anulado_por uuid         NOT NULL REFERENCES seguridad.usuario(id),
  anulado_en  timestamptz  NOT NULL DEFAULT now(),
  motivo      varchar(300) NOT NULL,
  CONSTRAINT anulacion_motivo_minimo CHECK (char_length(btrim(motivo)) >= 10)
);

-- Solo anexado: ni UPDATE ni DELETE ni TRUNCATE sobre el contenido clínico
CREATE TRIGGER tg_entrada_solo_anexar      BEFORE UPDATE OR DELETE ON hce.entrada      FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_diagnostico_solo_anexar  BEFORE UPDATE OR DELETE ON hce.diagnostico  FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_indicacion_solo_anexar   BEFORE UPDATE OR DELETE ON hce.indicacion   FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_receta_solo_anexar       BEFORE UPDATE OR DELETE ON hce.receta_item  FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_anulacion_solo_anexar    BEFORE UPDATE OR DELETE ON hce.anulacion    FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_entrada_no_truncate      BEFORE TRUNCATE ON hce.entrada      FOR EACH STATEMENT EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_anulacion_no_truncate    BEFORE TRUNCATE ON hce.anulacion    FOR EACH STATEMENT EXECUTE FUNCTION public.fn_solo_anexar();

-- =====================================================================
-- AUDITORÍA (solo anexado, Ley N.° 29733)
-- =====================================================================
CREATE TABLE auditoria.bitacora (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ocurrio_en  timestamptz NOT NULL DEFAULT now(),
  usuario_id  uuid        REFERENCES seguridad.usuario(id),     -- NULL en un LOGIN_FALLIDO
  accion      varchar(20) NOT NULL,
  recurso     varchar(60) NOT NULL,
  recurso_id  uuid,
  paciente_id uuid        REFERENCES pacientes.paciente(id),
  ip          inet,
  detalle     jsonb,
  CONSTRAINT bitacora_accion CHECK (accion IN ('LECTURA','ESCRITURA','ANULACION','LOGIN','LOGIN_FALLIDO','ACCESO_DENEGADO'))
);
CREATE INDEX ix_bitacora_paciente ON auditoria.bitacora (paciente_id, ocurrio_en DESC);
CREATE INDEX ix_bitacora_usuario  ON auditoria.bitacora (usuario_id, ocurrio_en DESC);
CREATE TRIGGER tg_bitacora_solo_anexar BEFORE UPDATE OR DELETE ON auditoria.bitacora FOR EACH ROW EXECUTE FUNCTION public.fn_solo_anexar();
CREATE TRIGGER tg_bitacora_no_truncate BEFORE TRUNCATE ON auditoria.bitacora FOR EACH STATEMENT EXECUTE FUNCTION public.fn_solo_anexar();

-- =====================================================================
-- M3 · LABORATORIO E IMÁGENES (HU04)
-- =====================================================================
CREATE TABLE laboratorio.examen (
  id     smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  codigo varchar(20)  NOT NULL UNIQUE,
  nombre varchar(120) NOT NULL,
  tipo   varchar(12)  NOT NULL,
  CONSTRAINT examen_tipo CHECK (tipo IN ('laboratorio','imagen'))
);

CREATE TABLE laboratorio.orden (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  paciente_id         uuid         NOT NULL REFERENCES pacientes.paciente(id),
  entrada_id          uuid         REFERENCES hce.entrada(id),
  medico_id           uuid         NOT NULL REFERENCES agenda.medico(id),
  creada_en           timestamptz  NOT NULL DEFAULT now(),
  indicacion_clinica  varchar(300)
);
CREATE INDEX ix_orden_paciente ON laboratorio.orden (paciente_id, creada_en DESC);

CREATE TABLE laboratorio.orden_item (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  orden_id   uuid     NOT NULL REFERENCES laboratorio.orden(id),
  examen_id  smallint NOT NULL REFERENCES laboratorio.examen(id),
  CONSTRAINT orden_item_unico UNIQUE (orden_id, examen_id)
);

-- Un ítem sin fila en "resultado" está PENDIENTE (estado derivado, no almacenado)
CREATE TABLE laboratorio.resultado (
  id               uuid PRIMARY KEY DEFAULT uuidv7(),
  orden_item_id    uuid         NOT NULL UNIQUE REFERENCES laboratorio.orden_item(id),
  valor            varchar(200),
  unidad           varchar(20),
  rango_referencia varchar(60),
  archivo_url      varchar(300),
  observaciones    varchar(300),
  registrado_por   uuid         NOT NULL REFERENCES seguridad.usuario(id),
  registrado_en    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT resultado_tiene_contenido CHECK (valor IS NOT NULL OR archivo_url IS NOT NULL)
);

-- =====================================================================
-- M4 · FACTURACIÓN Y CONVENIOS (HU05)
-- =====================================================================
CREATE TABLE facturacion.convenio (
  id     smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nombre varchar(80) NOT NULL UNIQUE,
  tipo   varchar(12) NOT NULL,
  CONSTRAINT convenio_tipo CHECK (tipo IN ('particular','eps','soat'))
);

CREATE TABLE facturacion.concepto (
  id          smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  codigo      varchar(25)  NOT NULL UNIQUE,
  descripcion varchar(150) NOT NULL
);

-- copago_pct = porcentaje del precio que paga el paciente (100 = particular, 0 = cubierto)
CREATE TABLE facturacion.tarifa (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  convenio_id   smallint      NOT NULL REFERENCES facturacion.convenio(id),
  concepto_id   smallint      NOT NULL REFERENCES facturacion.concepto(id),
  precio        numeric(10,2) NOT NULL,
  copago_pct    numeric(5,2)  NOT NULL,
  vigente_desde date          NOT NULL,
  vigente_hasta date,
  CONSTRAINT tarifa_precio  CHECK (precio >= 0),
  CONSTRAINT tarifa_copago  CHECK (copago_pct BETWEEN 0 AND 100),
  CONSTRAINT tarifa_vigencia CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde),
  CONSTRAINT tarifa_sin_solape EXCLUDE USING gist
    (convenio_id WITH =, concepto_id WITH =, daterange(vigente_desde, vigente_hasta, '[)') WITH &&)
);

CREATE TABLE facturacion.paciente_convenio (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  paciente_id   uuid        NOT NULL REFERENCES pacientes.paciente(id),
  convenio_id   smallint    NOT NULL REFERENCES facturacion.convenio(id),
  nro_poliza    varchar(30),
  vigente_desde date        NOT NULL,
  vigente_hasta date,
  CONSTRAINT pc_vigencia CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde),
  CONSTRAINT pc_un_convenio_a_la_vez EXCLUDE USING gist
    (paciente_id WITH =, daterange(vigente_desde, vigente_hasta, '[)') WITH &&)
);

CREATE TABLE facturacion.comprobante (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  tipo        varchar(10) NOT NULL,
  serie       varchar(4)  NOT NULL,
  numero      integer     NOT NULL,
  paciente_id uuid        NOT NULL REFERENCES pacientes.paciente(id),
  convenio_id smallint    NOT NULL REFERENCES facturacion.convenio(id),
  cita_id     uuid        REFERENCES agenda.cita(id),
  emitido_en  timestamptz NOT NULL DEFAULT now(),
  emitido_por uuid        NOT NULL REFERENCES seguridad.usuario(id),
  estado      varchar(10) NOT NULL DEFAULT 'emitido',
  CONSTRAINT comprobante_numeracion UNIQUE (serie, numero),
  CONSTRAINT comprobante_tipo   CHECK (tipo IN ('boleta','factura')),
  CONSTRAINT comprobante_estado CHECK (estado IN ('emitido','anulado')),
  CONSTRAINT comprobante_numero CHECK (numero > 0),
  CONSTRAINT comprobante_serie  CHECK ((tipo = 'boleta' AND serie ~ '^B[A-Z0-9]{3}$') OR (tipo = 'factura' AND serie ~ '^F[A-Z0-9]{3}$'))
);
CREATE INDEX ix_comprobante_paciente ON facturacion.comprobante (paciente_id, emitido_en DESC);

-- Decisión consciente: precio_unitario y copago_monto son una FOTO de la tarifa al emitir.
-- Un comprobante emitido no debe cambiar si la tarifa se actualiza después.
CREATE TABLE facturacion.comprobante_item (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  comprobante_id  uuid          NOT NULL REFERENCES facturacion.comprobante(id),
  concepto_id     smallint      NOT NULL REFERENCES facturacion.concepto(id),
  cantidad        smallint      NOT NULL DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL,
  copago_monto    numeric(10,2) NOT NULL,
  CONSTRAINT item_cantidad CHECK (cantidad > 0),
  CONSTRAINT item_precio   CHECK (precio_unitario >= 0),
  CONSTRAINT item_copago   CHECK (copago_monto >= 0 AND copago_monto <= precio_unitario * cantidad),
  CONSTRAINT item_unico    UNIQUE (comprobante_id, concepto_id)
);

CREATE TABLE facturacion.glosa (
  id             uuid PRIMARY KEY DEFAULT uuidv7(),
  comprobante_id uuid          NOT NULL REFERENCES facturacion.comprobante(id),
  motivo         varchar(300)  NOT NULL,
  monto          numeric(10,2) NOT NULL,
  estado         varchar(10)   NOT NULL DEFAULT 'abierta',
  registrada_en  timestamptz   NOT NULL DEFAULT now(),
  resuelta_en    timestamptz,
  CONSTRAINT glosa_monto  CHECK (monto > 0),
  CONSTRAINT glosa_estado CHECK (estado IN ('abierta','subsanada','aceptada')),
  CONSTRAINT glosa_resuelta_coherente CHECK ((estado = 'abierta') = (resuelta_en IS NULL))
);

-- =====================================================================
-- M5 · REPORTES (solo lectura: vistas sobre otros esquemas, único módulo autorizado)
-- =====================================================================
CREATE VIEW reportes.v_inasistencia_mensual AS
SELECT date_trunc('month', c.inicio)::date AS mes,
       count(*)                                         AS citas_programadas,
       count(*) FILTER (WHERE c.estado = 'inasistencia') AS inasistencias,
       round(100.0 * count(*) FILTER (WHERE c.estado = 'inasistencia') / count(*), 1) AS pct_inasistencia
FROM agenda.cita c
WHERE c.estado <> 'cancelada'
GROUP BY 1;

CREATE VIEW reportes.v_tiempo_espera AS
SELECT date_trunc('month', c.inicio)::date AS mes,
       e.nombre AS especialidad,
       count(*) AS atenciones,
       round(avg(extract(epoch FROM (c.atencion_inicio_en - c.llegada_en)) / 60)::numeric, 1) AS espera_prom_min
FROM agenda.cita c
JOIN agenda.medico m      ON m.id = c.medico_id
JOIN agenda.especialidad e ON e.id = m.especialidad_id
WHERE c.llegada_en IS NOT NULL AND c.atencion_inicio_en IS NOT NULL
GROUP BY 1, 2;

CREATE VIEW reportes.v_ocupacion_consultorio AS
SELECT k.codigo AS consultorio,
       c.inicio::date AS dia,
       count(*) AS citas,
       sum(extract(epoch FROM (c.fin - c.inicio)) / 60)::int AS minutos_reservados
FROM agenda.cita c
JOIN agenda.consultorio k ON k.id = c.consultorio_id
WHERE c.estado <> 'cancelada'
GROUP BY 1, 2;

CREATE VIEW reportes.v_ingresos_mensual AS
SELECT date_trunc('month', f.emitido_en)::date AS mes,
       cv.nombre AS convenio,
       sum(i.precio_unitario * i.cantidad) AS facturado,
       sum(i.copago_monto)                 AS copagos
FROM facturacion.comprobante f
JOIN facturacion.comprobante_item i ON i.comprobante_id = f.id
JOIN facturacion.convenio cv        ON cv.id = f.convenio_id
WHERE f.estado = 'emitido'
GROUP BY 1, 2;

-- =====================================================================
-- PERMISOS (ADR-04): la API no puede borrar contenido clínico ni auditoría
-- =====================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sigc_app') THEN
    CREATE ROLE sigc_app NOLOGIN;   -- en producción: ALTER ROLE sigc_app LOGIN PASSWORD '...' (desde un secreto)
  END IF;
END $$;

GRANT USAGE ON SCHEMA seguridad, pacientes, agenda, notificaciones, hce, auditoria, laboratorio, facturacion, reportes TO sigc_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA seguridad, pacientes, agenda, notificaciones, laboratorio, facturacion TO sigc_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA hce, auditoria TO sigc_app;
GRANT SELECT ON ALL TABLES IN SCHEMA reportes TO sigc_app;
REVOKE UPDATE ON agenda.cita_historial FROM sigc_app;
GRANT DELETE ON seguridad.sesion, agenda.outbox_evento TO sigc_app;       -- limpieza operativa
GRANT USAGE ON ALL SEQUENCES IN SCHEMA agenda, auditoria, laboratorio, facturacion, seguridad TO sigc_app;
```

### 3.2 `02_data.sql` — datos de prueba

```sql
-- =====================================================================
-- Script 2/2: datos de prueba (TODOS FICTICIOS: nombres, documentos,
-- teléfonos, correos, pólizas y aseguradoras no corresponden a personas
-- ni empresas reales). Ejecutar después de 01_schema.sql.
-- Zona horaria de las citas: Lima (UTC-05).
-- =====================================================================
BEGIN;

-- ---------- Seguridad ----------
INSERT INTO seguridad.rol (nombre, descripcion) VALUES
 ('medico','Consulta y registra la HCE'),
 ('enfermera','Consulta la HCE y registra información de atención'),
 ('admision','Registra pacientes y gestiona citas'),
 ('administrador','Gestiona usuarios, roles y configuración'),
 ('laboratorio','Registra órdenes y resultados'),
 ('cajero','Emite comprobantes y gestiona glosas'),
 ('gerencia','Consulta reportes gerenciales');

-- Hashes de ejemplo (NO son contraseñas reales)
INSERT INTO seguridad.usuario (id, username, nombres, apellidos, email, password_hash, rol_id) VALUES
 ('10000000-0000-7000-8000-000000000001','lparedes','Lucía','Paredes Vega','lparedes@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwMQ$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDE',1),
 ('10000000-0000-7000-8000-000000000002','msalazar','Marco','Salazar Rojas','msalazar@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwMg$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDI',1),
 ('10000000-0000-7000-8000-000000000003','cquispe','Carla','Quispe Mendoza','cquispe@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwMw$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM',1),
 ('10000000-0000-7000-8000-000000000004','ahuaman','Andrés','Huamán Torres','ahuaman@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwNA$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDQ',1),
 ('10000000-0000-7000-8000-000000000005','vcardenas','Valeria','Cárdenas Ríos','vcardenas@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwNQ$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDU',1),
 ('10000000-0000-7000-8000-000000000006','rmedina','Rosa','Medina Flores','rmedina@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwNg$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDY',2),
 ('10000000-0000-7000-8000-000000000007','dramos','Diego','Ramos León','dramos@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwNw$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDc',3),
 ('10000000-0000-7000-8000-000000000008','scampos','Sofía','Campos Aguirre','scampos@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwOA$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDg',4),
 ('10000000-0000-7000-8000-000000000009','jnavarro','Julio','Navarro Peña','jnavarro@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQwOQ$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDk',5),
 ('10000000-0000-7000-8000-000000000010','evargas','Elena','Vargas Soto','evargas@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQxMA$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTA',6),
 ('10000000-0000-7000-8000-000000000011','rluna','Ricardo','Luna Herrera','rluna@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$ZmFrZXNhbHQxMQ$ZmFrZWhhc2gwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTE',7);

-- ---------- Pacientes (registrados por admisión: Diego Ramos) ----------
INSERT INTO pacientes.paciente (id, tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, email, direccion, canal_recordatorio, creado_por) VALUES
 ('20000000-0000-7000-8000-000000000001','DNI','70000001','Mariana','Torres','Quispe','1988-03-14','F','900000001','mariana.torres@example.pe','Av. Ficticia 101, San Borja','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000002','DNI','70000002','Luis Alberto','Gutiérrez','Ñahui','1975-11-02','M','900000002','luis.gutierrez@example.pe','Jr. Imaginario 202, Surquillo','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000003','DNI','70000003','Carmen Rosa','Díaz','Alva','1992-07-21','F','900000003',NULL,'Calle Demo 303, San Borja','sms','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000004','DNI','70000004','José Miguel','Palomino','Cruz','1969-01-30','M','900000004','jose.palomino@example.pe','Av. Prueba 404, La Victoria','sms','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000005','DNI','70000005','Ana Lucía','Salas','Bedoya','1995-09-09','F','900000005','ana.salas@example.pe','Psje. Test 505, Miraflores','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000006','DNI','70000006','Pedro Pablo','Cáceres','Núñez','1981-05-17','M','900000006','pedro.caceres@example.pe','Av. Modelo 606, San Isidro','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000007','DNI','70000007','Mateo','Rojas','Vilca','2019-12-05','M','900000007','familia.rojas@example.pe','Calle Muestra 707, San Borja','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000008','CE','000123456','Fiorella','Ramírez','Arce','1990-02-28','F','900000008','fiorella.ramirez@example.pe','Av. Simulada 808, Lince','sms','10000000-0000-7000-8000-000000000007');

INSERT INTO pacientes.antecedente (paciente_id, tipo, descripcion, registrado_por) VALUES
 ('20000000-0000-7000-8000-000000000001','personal','Hipertensión arterial en seguimiento','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000001','alergia','Alergia a penicilina','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000002','quirurgico','Apendicectomía en 2005','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000003','familiar','Madre con diabetes mellitus tipo 2','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000004','habito','Fumador, 10 cigarrillos al día','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000005','alergia','Alergia a mariscos','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000007','personal','Esquema de vacunación completo para su edad','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000008','familiar','Padre con hipertensión arterial','10000000-0000-7000-8000-000000000007');

-- ---------- Agenda: catálogos ----------
INSERT INTO agenda.especialidad (nombre, duracion_cita_min) VALUES
 ('Medicina General',30),('Ginecología',30),('Pediatría',30),('Cardiología',40),('Traumatología',30);   -- ids 1..5

INSERT INTO agenda.consultorio (codigo, piso) VALUES
 ('C-101',1),('C-102',1),('C-103',1),('C-201',2),('C-202',2);                                           -- ids 1..5

INSERT INTO agenda.medico (id, usuario_id, cmp, especialidad_id) VALUES
 ('30000000-0000-7000-8000-000000000001','10000000-0000-7000-8000-000000000001','CMP90001',1),
 ('30000000-0000-7000-8000-000000000002','10000000-0000-7000-8000-000000000002','CMP90002',2),
 ('30000000-0000-7000-8000-000000000003','10000000-0000-7000-8000-000000000003','CMP90003',3),
 ('30000000-0000-7000-8000-000000000004','10000000-0000-7000-8000-000000000004','CMP90004',4),
 ('30000000-0000-7000-8000-000000000005','10000000-0000-7000-8000-000000000005','CMP90005',5);

-- Lunes a viernes: médicos 1-3 de mañana, médicos 4-5 de tarde
INSERT INTO agenda.horario_medico (medico_id, dia_semana, hora_inicio, hora_fin)
SELECT m.id, d, CASE WHEN m.cmp IN ('CMP90001','CMP90002','CMP90003') THEN time '08:00' ELSE time '14:00' END,
              CASE WHEN m.cmp IN ('CMP90001','CMP90002','CMP90003') THEN time '13:00' ELSE time '19:00' END
FROM agenda.medico m CROSS JOIN generate_series(1,5) AS d;

-- ---------- Citas (admisión: Diego Ramos) ----------
-- Los 'atendida' e 'inasistencia' son pasados; los demás, próximos a hoy (09/10/2026).
INSERT INTO agenda.cita (id, paciente_id, medico_id, consultorio_id, inicio, fin, motivo, estado, llegada_en, atencion_inicio_en, creado_por) VALUES
 ('40000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001',1,'2026-09-14 08:00-05','2026-09-14 08:30-05','Tos persistente y fiebre leve','atendida','2026-09-14 07:55-05','2026-09-14 08:12-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000004',4,'2026-09-21 14:00-05','2026-09-21 14:40-05','Control de presión arterial','atendida','2026-09-21 13:50-05','2026-09-21 14:05-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000001',1,'2026-09-14 08:30-05','2026-09-14 09:00-05','Dolor lumbar','atendida','2026-09-14 08:20-05','2026-09-14 08:35-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000002',2,'2026-09-28 09:00-05','2026-09-28 09:30-05','Control ginecológico anual','atendida','2026-09-28 08:50-05','2026-09-28 09:10-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000005',5,'2026-10-05 14:00-05','2026-10-05 14:30-05','Dolor de rodilla tras accidente de tránsito','atendida','2026-10-05 13:55-05','2026-10-05 14:08-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000006','20000000-0000-7000-8000-000000000007','30000000-0000-7000-8000-000000000003',3,'2026-10-05 08:00-05','2026-10-05 08:30-05','Control de niño sano y vacunas','atendida','2026-10-05 07:50-05','2026-10-05 08:10-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000007','20000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000001',1,'2026-10-05 09:00-05','2026-10-05 09:30-05','Dolor de cabeza recurrente','inasistencia',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000008','20000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004',4,'2026-10-12 14:00-05','2026-10-12 14:40-05','Evaluación cardiológica preventiva','confirmada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000009','20000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000001',1,'2026-10-13 08:00-05','2026-10-13 08:30-05','Chequeo general','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000010','20000000-0000-7000-8000-000000000008','30000000-0000-7000-8000-000000000005',5,'2026-10-15 15:00-05','2026-10-15 15:30-05','Dolor de hombro izquierdo','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 -- cita cancelada: libera el horario 13/10 09:00 (la restricción excluye las canceladas)...
 ('40000000-0000-7000-8000-000000000011','20000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000001',1,'2026-10-13 09:00-05','2026-10-13 09:30-05','Control de resfrío','cancelada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 -- ...y otra paciente lo toma
 ('40000000-0000-7000-8000-000000000012','20000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000001',1,'2026-10-13 09:00-05','2026-10-13 09:30-05','Reprogramación de dolor de cabeza','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007');

-- Reprogramación de la cita 09: queda en cita_historial con el valor anterior (RNF04)
SELECT set_config('app.usuario_id','10000000-0000-7000-8000-000000000007', true);
UPDATE agenda.cita SET inicio = '2026-10-14 08:30-05', fin = '2026-10-14 09:00-05'
 WHERE id = '40000000-0000-7000-8000-000000000009';
-- Cancelación de la cita 11 ya nace cancelada en el seed; para ver la acción 'cancelacion' en vivo:
--   UPDATE agenda.cita SET estado = 'cancelada' WHERE id = '...';

INSERT INTO agenda.outbox_evento (tipo, agregado_id, payload, procesado_en) VALUES
 ('CitaProgramada','40000000-0000-7000-8000-000000000008','{"paciente_id":"20000000-0000-7000-8000-000000000002","inicio":"2026-10-12T14:00:00-05:00"}', now()),
 ('CitaProgramada','40000000-0000-7000-8000-000000000010','{"paciente_id":"20000000-0000-7000-8000-000000000008","inicio":"2026-10-15T15:00:00-05:00"}', NULL),
 ('CitaReprogramada','40000000-0000-7000-8000-000000000009','{"paciente_id":"20000000-0000-7000-8000-000000000006","inicio":"2026-10-14T08:30:00-05:00"}', NULL),
 ('CitaProgramada','40000000-0000-7000-8000-000000000012','{"paciente_id":"20000000-0000-7000-8000-000000000005","inicio":"2026-10-13T09:00:00-05:00"}', NULL),
 ('CitaCancelada','40000000-0000-7000-8000-000000000011','{"paciente_id":"20000000-0000-7000-8000-000000000004"}', now());

-- ---------- Notificaciones (recordatorios 24 h antes, HU02) ----------
INSERT INTO notificaciones.recordatorio (cita_id, canal, programado_para, estado, intentos, enviado_en, error) VALUES
 ('40000000-0000-7000-8000-000000000005','sms',  '2026-10-04 14:00-05','enviado',1,'2026-10-04 14:00:21-05',NULL),
 ('40000000-0000-7000-8000-000000000006','email','2026-10-04 08:00-05','enviado',1,'2026-10-04 08:00:09-05',NULL),
 ('40000000-0000-7000-8000-000000000007','email','2026-10-04 09:00-05','enviado',1,'2026-10-04 09:00:12-05',NULL),
 ('40000000-0000-7000-8000-000000000008','email','2026-10-11 14:00-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000009','email','2026-10-13 08:30-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000010','sms',  '2026-10-14 15:00-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000012','email','2026-10-12 09:00-05','fallido',3,NULL,'SMTP: buzón no disponible (simulado)');

-- ---------- HCE ----------
INSERT INTO hce.cie10 (codigo, descripcion) VALUES
 ('J06.9','Infección aguda de las vías respiratorias superiores, no especificada'),
 ('J02.9','Faringitis aguda, no especificada'),
 ('I10','Hipertensión esencial (primaria)'),
 ('M54.5','Lumbago (dolor lumbar bajo)'),
 ('Z01.4','Examen ginecológico (general) (de rutina)'),
 ('M25.5','Dolor articular'),
 ('Z00.1','Control de salud de rutina del niño'),
 ('E11.9','Diabetes mellitus tipo 2 sin mención de complicación'),
 ('K29.7','Gastritis, no especificada'),
 ('R51','Cefalea');

INSERT INTO hce.entrada (id, paciente_id, cita_id, medico_id, fecha, motivo_consulta, enfermedad_actual, examen_fisico, corrige_a_id) VALUES
 ('50000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','40000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001','2026-09-14 08:12-05','Tos persistente y fiebre leve','Cuadro de 3 días con tos seca, malestar y fiebre de 37.8 °C.','Faringe congestiva; murmullo vesicular normal.',NULL),
 ('50000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','40000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004','2026-09-21 14:05-05','Control de presión arterial','Paciente con HTA en seguimiento; refiere cefalea ocasional.','PA 148/92 mmHg; FC 78 lpm.',NULL),
 ('50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','40000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000001','2026-09-14 08:35-05','Dolor lumbar','Dolor lumbar de 1 semana tras esfuerzo.','Contractura paravertebral.',NULL),
 ('50000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000002','40000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000001','2026-09-14 08:50-05','Dolor lumbar','Dolor lumbar de 1 semana tras esfuerzo (entrada corregida: el diagnóstico estaba mal codificado).','Contractura paravertebral; sin déficit neurológico.','50000000-0000-7000-8000-000000000003'),
 ('50000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000003','40000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000002','2026-09-28 09:10-05','Control ginecológico anual','Sin molestias; control de rutina.','Examen sin hallazgos.',NULL),
 ('50000000-0000-7000-8000-000000000006','20000000-0000-7000-8000-000000000004','40000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000005','2026-10-05 14:08-05','Dolor de rodilla derecha','Dolor y edema tras accidente de tránsito hace 2 días.','Edema leve; flexión limitada por dolor.',NULL),
 ('50000000-0000-7000-8000-000000000007','20000000-0000-7000-8000-000000000007','40000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000003','2026-10-05 08:10-05','Control de niño sano','Desarrollo acorde a la edad; completa esquema de vacunación.','Peso y talla en percentiles normales.',NULL);

INSERT INTO hce.diagnostico (entrada_id, cie10_codigo, tipo) VALUES
 ('50000000-0000-7000-8000-000000000001','J06.9','principal'),
 ('50000000-0000-7000-8000-000000000002','I10','principal'),
 ('50000000-0000-7000-8000-000000000003','J02.9','principal'),   -- error de codificación, luego anulada
 ('50000000-0000-7000-8000-000000000004','M54.5','principal'),
 ('50000000-0000-7000-8000-000000000005','Z01.4','principal'),
 ('50000000-0000-7000-8000-000000000006','M25.5','principal'),
 ('50000000-0000-7000-8000-000000000007','Z00.1','principal'),
 ('50000000-0000-7000-8000-000000000002','R51','secundario');

INSERT INTO hce.indicacion (entrada_id, descripcion) VALUES
 ('50000000-0000-7000-8000-000000000001','Reposo relativo por 3 días e hidratación abundante.'),
 ('50000000-0000-7000-8000-000000000002','Dieta baja en sodio; control de presión en casa y regreso en 4 semanas.'),
 ('50000000-0000-7000-8000-000000000004','Calor local y evitar cargar peso por 2 semanas.'),
 ('50000000-0000-7000-8000-000000000005','Control anual; consultar antes si hay molestias.'),
 ('50000000-0000-7000-8000-000000000006','Reposo de la articulación y hielo local 15 min cada 6 horas.'),
 ('50000000-0000-7000-8000-000000000007','Próximo control de crecimiento en 6 meses.');

INSERT INTO hce.receta_item (entrada_id, medicamento, dosis, frecuencia, duracion_dias) VALUES
 ('50000000-0000-7000-8000-000000000001','Paracetamol 500 mg','1 tableta','cada 8 horas si hay fiebre',3),
 ('50000000-0000-7000-8000-000000000002','Losartán 50 mg','1 tableta','cada 24 horas',30),
 ('50000000-0000-7000-8000-000000000004','Naproxeno 550 mg','1 tableta','cada 12 horas con alimentos',5),
 ('50000000-0000-7000-8000-000000000006','Ibuprofeno 400 mg','1 tableta','cada 8 horas con alimentos',5),
 ('50000000-0000-7000-8000-000000000001','Suero oral','1 sobre en 1 litro de agua','a sorbos durante el día',3);

INSERT INTO hce.anulacion (entrada_id, anulado_por, anulado_en, motivo) VALUES
 ('50000000-0000-7000-8000-000000000003','10000000-0000-7000-8000-000000000001','2026-09-14 08:48-05','Diagnóstico mal codificado (J02.9); se registra una entrada corregida.');

-- ---------- Laboratorio e imágenes ----------
INSERT INTO laboratorio.examen (codigo, nombre, tipo) VALUES
 ('HEMOGRAMA','Hemograma completo','laboratorio'),
 ('GLUCOSA','Glucosa en ayunas','laboratorio'),
 ('PERFIL_LIP','Perfil lipídico','laboratorio'),
 ('PAPANICOLAOU','Papanicolaou','laboratorio'),
 ('RX_RODILLA','Radiografía de rodilla','imagen'),
 ('ECO_ABD','Ecografía abdominal','imagen');                                                              -- ids 1..6

INSERT INTO laboratorio.orden (id, paciente_id, entrada_id, medico_id, creada_en, indicacion_clinica) VALUES
 ('60000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','50000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004','2026-09-21 14:30-05','Control metabólico en paciente hipertensa'),
 ('60000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','50000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001','2026-09-14 08:25-05','Descartar proceso infeccioso'),
 ('60000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000004','50000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000005','2026-10-05 14:20-05','Descartar lesión ósea tras trauma'),
 ('60000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000003','50000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000002','2026-09-28 09:25-05','Tamizaje anual'),
 ('60000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000007','50000000-0000-7000-8000-000000000007','30000000-0000-7000-8000-000000000003','2026-10-05 08:25-05','Tamizaje de anemia');

INSERT INTO laboratorio.orden_item (id, orden_id, examen_id) VALUES
 ('61000000-0000-7000-8000-000000000001','60000000-0000-7000-8000-000000000001',3),
 ('61000000-0000-7000-8000-000000000002','60000000-0000-7000-8000-000000000001',2),
 ('61000000-0000-7000-8000-000000000003','60000000-0000-7000-8000-000000000002',1),
 ('61000000-0000-7000-8000-000000000004','60000000-0000-7000-8000-000000000003',5),
 ('61000000-0000-7000-8000-000000000005','60000000-0000-7000-8000-000000000004',4),   -- PENDIENTE
 ('61000000-0000-7000-8000-000000000006','60000000-0000-7000-8000-000000000005',1);   -- PENDIENTE

-- Técnico de laboratorio: Julio Navarro. Los ítems 05 y 06 quedan pendientes (sin resultado).
INSERT INTO laboratorio.resultado (orden_item_id, valor, unidad, rango_referencia, archivo_url, observaciones, registrado_por, registrado_en) VALUES
 ('61000000-0000-7000-8000-000000000001','Colesterol total 212; LDL 138; HDL 46','mg/dL','CT < 200; LDL < 130',NULL,'Ligera elevación','10000000-0000-7000-8000-000000000009','2026-09-22 10:00-05'),
 ('61000000-0000-7000-8000-000000000002','92','mg/dL','70 - 100',NULL,NULL,'10000000-0000-7000-8000-000000000009','2026-09-22 10:05-05'),
 ('61000000-0000-7000-8000-000000000003','Leucocitos 11.2; Hb 13.5','miles/µL; g/dL','Leu 4.5-11; Hb 12-16',NULL,'Leucocitosis leve','10000000-0000-7000-8000-000000000009','2026-09-14 16:00-05'),
 ('61000000-0000-7000-8000-000000000004',NULL,NULL,NULL,'https://archivos.sanrafael.example.pe/imagenes/rx-rodilla-0001.pdf','Sin fractura evidente','10000000-0000-7000-8000-000000000009','2026-10-05 15:10-05');

-- ---------- Facturación ----------
INSERT INTO facturacion.convenio (nombre, tipo) VALUES
 ('Particular','particular'),
 ('EPS Andina Salud (ficticia)','eps'),
 ('EPS Vida Plena (ficticia)','eps'),
 ('Seguros Costa Azul (ficticia)','eps'),
 ('SOAT Central Seguros (ficticia)','soat');                                                               -- ids 1..5

INSERT INTO facturacion.concepto (codigo, descripcion) VALUES
 ('CONS_MG','Consulta de medicina general'),
 ('CONS_ESP','Consulta de especialidad'),
 ('LAB_HEMOGRAMA','Hemograma completo'),
 ('LAB_GLUCOSA','Glucosa en ayunas'),
 ('LAB_PERFIL_LIP','Perfil lipídico'),
 ('IMG_RX_RODILLA','Radiografía de rodilla');                                                              -- ids 1..6

-- Tarifario: precio base por concepto x factor del convenio; copago = % que paga el paciente
INSERT INTO facturacion.tarifa (convenio_id, concepto_id, precio, copago_pct, vigente_desde, vigente_hasta)
SELECT cv.id, c.id, round(b.precio * f.factor, 2), f.copago, DATE '2026-01-01', NULL
FROM facturacion.convenio cv
JOIN (VALUES ('Particular',1.00,100.00),('EPS Andina Salud (ficticia)',0.85,20.00),('EPS Vida Plena (ficticia)',0.80,30.00),
             ('Seguros Costa Azul (ficticia)',0.90,20.00),('SOAT Central Seguros (ficticia)',0.70,0.00)) AS f(nombre,factor,copago) ON f.nombre = cv.nombre
CROSS JOIN facturacion.concepto c
JOIN (VALUES ('CONS_MG',120.00),('CONS_ESP',180.00),('LAB_HEMOGRAMA',45.00),('LAB_GLUCOSA',20.00),('LAB_PERFIL_LIP',90.00),('IMG_RX_RODILLA',110.00)) AS b(codigo,precio) ON b.codigo = c.codigo;

INSERT INTO facturacion.paciente_convenio (paciente_id, convenio_id, nro_poliza, vigente_desde, vigente_hasta) VALUES
 ('20000000-0000-7000-8000-000000000001',2,'AND-000101','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000002',1,NULL,'2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000003',3,'VPL-000303','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000004',5,'SOAT-2026-0404','2026-10-03',NULL),
 ('20000000-0000-7000-8000-000000000005',4,'CAZ-000505','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000006',1,NULL,'2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000007',2,'AND-000101-D1','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000008',3,'VPL-000808','2026-01-01',NULL);

-- Cajera: Elena Vargas
INSERT INTO facturacion.comprobante (id, tipo, serie, numero, paciente_id, convenio_id, cita_id, emitido_en, emitido_por) VALUES
 ('70000000-0000-7000-8000-000000000001','boleta','B001',1,'20000000-0000-7000-8000-000000000001',2,'40000000-0000-7000-8000-000000000001','2026-09-14 08:45-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000002','boleta','B001',2,'20000000-0000-7000-8000-000000000001',2,'40000000-0000-7000-8000-000000000002','2026-09-21 14:50-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000003','boleta','B001',3,'20000000-0000-7000-8000-000000000002',1,'40000000-0000-7000-8000-000000000003','2026-09-14 09:10-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000004','boleta','B001',4,'20000000-0000-7000-8000-000000000004',5,'40000000-0000-7000-8000-000000000005','2026-10-05 15:20-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000005','factura','F001',1,'20000000-0000-7000-8000-000000000003',3,'40000000-0000-7000-8000-000000000004','2026-09-28 09:50-05','10000000-0000-7000-8000-000000000010');

-- HU05: el precio y el copago salen del tarifario vigente del convenio
INSERT INTO facturacion.comprobante_item (comprobante_id, concepto_id, cantidad, precio_unitario, copago_monto)
SELECT v.comprobante_id::uuid, c.id, 1, t.precio, round(t.precio * t.copago_pct / 100, 2)
FROM (VALUES
  ('70000000-0000-7000-8000-000000000001','EPS Andina Salud (ficticia)','CONS_MG'),
  ('70000000-0000-7000-8000-000000000002','EPS Andina Salud (ficticia)','CONS_ESP'),
  ('70000000-0000-7000-8000-000000000003','Particular','CONS_MG'),
  ('70000000-0000-7000-8000-000000000004','SOAT Central Seguros (ficticia)','CONS_ESP'),
  ('70000000-0000-7000-8000-000000000004','SOAT Central Seguros (ficticia)','IMG_RX_RODILLA'),
  ('70000000-0000-7000-8000-000000000005','EPS Vida Plena (ficticia)','CONS_ESP')
) AS v(comprobante_id, convenio, concepto)
JOIN facturacion.convenio cv ON cv.nombre = v.convenio
JOIN facturacion.concepto c  ON c.codigo = v.concepto
JOIN facturacion.tarifa t    ON t.convenio_id = cv.id AND t.concepto_id = c.id AND t.vigente_hasta IS NULL;

INSERT INTO facturacion.glosa (comprobante_id, motivo, monto, estado, registrada_en, resuelta_en) VALUES
 ('70000000-0000-7000-8000-000000000002','Código de diagnóstico no coincide con el convenio',122.40,'abierta','2026-10-01 10:00-05',NULL),
 ('70000000-0000-7000-8000-000000000001','Falta autorización previa de la EPS',81.60,'subsanada','2026-09-20 11:00-05','2026-09-25 09:30-05'),
 ('70000000-0000-7000-8000-000000000005','Tarifa distinta a la del convenio vigente',100.80,'aceptada','2026-10-02 12:00-05','2026-10-06 16:00-05');

-- ---------- Auditoría ----------
INSERT INTO auditoria.bitacora (ocurrio_en, usuario_id, accion, recurso, recurso_id, paciente_id, ip, detalle) VALUES
 ('2026-09-14 08:00-05','10000000-0000-7000-8000-000000000001','LOGIN','sesion',NULL,NULL,'10.0.0.21','{"resultado":"ok"}'),
 ('2026-09-14 08:11-05','10000000-0000-7000-8000-000000000001','LECTURA','hce.historia',NULL,'20000000-0000-7000-8000-000000000001','10.0.0.21','{"origen":"HU03"}'),
 ('2026-09-14 08:35-05','10000000-0000-7000-8000-000000000001','ESCRITURA','hce.entrada','50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','10.0.0.21',NULL),
 ('2026-09-14 08:48-05','10000000-0000-7000-8000-000000000001','ANULACION','hce.entrada','50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','10.0.0.21','{"motivo":"Diagnóstico mal codificado"}'),
 ('2026-09-14 08:50-05','10000000-0000-7000-8000-000000000001','ESCRITURA','hce.entrada','50000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000002','10.0.0.21',NULL),
 ('2026-09-30 17:02-05',NULL,'LOGIN_FALLIDO','sesion',NULL,NULL,'10.0.0.77','{"username_intentado":"admin"}'),
 ('2026-10-01 09:15-05','10000000-0000-7000-8000-000000000007','ACCESO_DENEGADO','hce.historia',NULL,'20000000-0000-7000-8000-000000000001','10.0.0.15','{"motivo":"rol admision sin permiso sobre HCE"}'),
 ('2026-10-05 14:09-05','10000000-0000-7000-8000-000000000005','LECTURA','hce.historia',NULL,'20000000-0000-7000-8000-000000000004','10.0.0.30','{"origen":"HU03"}');

COMMIT;
```

### 3.3 Consultas de verificación (opcionales)

```sql
-- HU01 / ADR-03: intentar reservar un horario ocupado -> la BD lo rechaza
INSERT INTO agenda.cita (paciente_id, medico_id, consultorio_id, inicio, fin, motivo, creado_por)
VALUES ('20000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000001',2,
        '2026-10-13 09:15-05','2026-10-13 09:45-05','Prueba','10000000-0000-7000-8000-000000000007');
-- ERROR: conflicting key value violates exclusion constraint "cita_sin_solape_medico"

-- HU03: historia unificada de un paciente (solo para QA: cruza esquemas; la API usa las APIs públicas)
SELECT e.fecha, esp.nombre AS especialidad, u.apellidos AS medico, e.motivo_consulta,
       string_agg(d.cie10_codigo, ', ') AS cie10,
       CASE WHEN a.id IS NULL THEN 'vigente' ELSE 'anulada' END AS estado, a.motivo AS motivo_anulacion
FROM hce.entrada e
JOIN agenda.medico m ON m.id = e.medico_id
JOIN agenda.especialidad esp ON esp.id = m.especialidad_id
JOIN seguridad.usuario u ON u.id = m.usuario_id
LEFT JOIN hce.diagnostico d ON d.entrada_id = e.id
LEFT JOIN hce.anulacion a ON a.entrada_id = e.id
WHERE e.paciente_id = '20000000-0000-7000-8000-000000000002'
GROUP BY e.id, e.fecha, esp.nombre, u.apellidos, e.motivo_consulta, a.id, a.motivo
ORDER BY e.fecha DESC;

-- HU04: ítems de laboratorio pendientes (sin resultado)
SELECT o.id AS orden, ex.nombre AS examen
FROM laboratorio.orden_item i
JOIN laboratorio.orden o ON o.id = i.orden_id
JOIN laboratorio.examen ex ON ex.id = i.examen_id
LEFT JOIN laboratorio.resultado r ON r.orden_item_id = i.id
WHERE r.id IS NULL;

-- HU02: recordatorios pendientes de enviar
SELECT * FROM notificaciones.recordatorio WHERE estado = 'pendiente' ORDER BY programado_para;

-- RNF04: historial de cambios de la cita reprogramada
SELECT accion, ocurrio_en, valor_anterior->>'inicio' AS inicio_anterior
FROM agenda.cita_historial WHERE cita_id = '40000000-0000-7000-8000-000000000009' ORDER BY id;

-- RF10: reportes
SELECT * FROM reportes.v_inasistencia_mensual;
SELECT * FROM reportes.v_tiempo_espera;
```

> **Importante para la API:** la reprogramación y la cancelación de una cita deben fijar el usuario responsable en la misma transacción con `SELECT set_config('app.usuario_id', '<uuid>', true);`. Si no se fija, el trigger falla a propósito (RNF04: no puede haber un cambio sin responsable).

---

## Paso 4 — Prototipo UX/UI

### 4.1 Pantallas del prototipo

| Pantalla | Historia de usuario que atiende | Tarea principal y tiempo medido |
| --- | --- | --- |
| P1 · Inicio de sesión | Transversal (RNF02) | Ingresar al sistema · meta < 15 s · **medido: ____ s** |
| P2 · Agenda de citas: reservar cita en 3 pasos | **HU01** (y HU02 en el paso de confirmación) | Reservar una cita · meta **< 60 s** y **≤ 3 pasos** (RNF05) · **medido: ____ s** |
| P3 · Historia clínica unificada | **HU03** (con RF04: anular entrada) | Encontrar la última consulta de otra especialidad · meta < 30 s · **medido: ____ s** |
| P4 · Laboratorio: cargar resultado | **HU04** | Cargar un resultado de una orden pendiente · meta < 90 s · **medido: ____ s** |
| P5 · Facturación: emitir comprobante | **HU05** | Emitir un comprobante con tarifa de convenio · meta < 60 s · **medido: ____ s** |

> Los tiempos **medidos** los deben completar ustedes tras la prueba con un compañero (no los inventé: la guía pide medirlos de verdad). Protocolo sugerido: 3 compañeros sin capacitación previa, una tarea por pantalla, cronómetro desde que lee la consigna hasta que ve el mensaje de éxito; registren tiempo, cantidad de pasos y errores cometidos, y calculen el promedio.

### 4.2 Prompt para Google Stitch

**Cómo usarlo:** abran Stitch, elijan modo **Web / escritorio**, peguen el prompt completo y generen. Si Stitch entrega solo una pantalla por vez, usen después los mensajes de la lista "Para iterar pantalla por pantalla". Luego conecten las pantallas en el modo prototipo siguiendo la sección "Flujo navegable" del propio prompt.

```text
Diseña un prototipo navegable de aplicación web de escritorio (1440 px de ancho, adaptable a tablet) para el "SIGC – Clínica San Rafael", el sistema clínico-administrativo de una clínica privada en San Borja, Lima. Idioma de toda la interfaz: español (Perú). Todos los nombres, documentos y datos de ejemplo son ficticios.

OBJETIVO DE USABILIDAD
El personal tiene niveles muy distintos de alfabetización digital. La interfaz debe ser simple, predecible y tolerante a errores. La tarea principal (reservar una cita) debe poder completarse en 3 pasos y en menos de 60 segundos sin capacitación previa.

ESTILO VISUAL
- Tono profesional, sereno y confiable. Mucho espacio en blanco.
- Paleta: azul clínico #1F4E79 (primario), #3B8ED0 (secundario), verde #2C6E49 (éxito), ámbar #B7791F (advertencia), rojo #B42318 (error y "anulado"), fondo #F5F7FA, tarjetas blancas con borde fino y esquinas de 8 px.
- Tipografía Inter. Texto base de 16 px. Botones de al menos 44 px de alto. Contraste AA.
- Las etiquetas de los botones y campos siempre en texto visible (no solo íconos). Los estados se muestran con chip de color Y texto (nunca solo color).

LAYOUT COMÚN A TODAS LAS PANTALLAS (excepto el inicio de sesión)
- Barra lateral izquierda: logo "San Rafael" y navegación: Agenda, Pacientes, Historia clínica, Laboratorio, Facturación. El ítem activo resaltado.
- Cabecera: migas de pan a la izquierda; a la derecha, el usuario y su rol ("Diego Ramos · Admisión"), un aviso discreto "La sesión se cierra tras 10 min de inactividad" y el botón "Cerrar sesión".
- Mensaje de confirmación (toast verde) después de cada acción exitosa y mensajes de error en rojo, claros y con la forma de corregirlo.

PANTALLAS

1) INICIO DE SESIÓN
Tarjeta centrada con logo, campos "Usuario" y "Contraseña" (con botón mostrar/ocultar), botón "Ingresar". Mensaje de error de ejemplo: "Usuario o contraseña incorrectos. Quedan 2 intentos." Pie con la nota: "Todo acceso a historias clínicas queda registrado (Ley N.° 29733)."

2) AGENDA DE CITAS – RESERVAR CITA EN 3 PASOS (pantalla principal)
Indicador de pasos arriba: "1 Paciente — 2 Médico y horario — 3 Confirmar". Siempre visible el paso actual y el botón "Atrás".
- Paso 1, Paciente: buscador "DNI o apellidos" con resultado en tarjeta (Mariana Torres Quispe · DNI 70000001 · 38 años · Convenio EPS Andina Salud). Botón secundario "Registrar paciente nuevo". Botón "Continuar".
- Paso 2, Médico y horario: selector de Especialidad (Medicina General, Ginecología, Pediatría, Cardiología, Traumatología); tarjetas de médicos de esa especialidad; calendario semanal (lunes a viernes) con franjas de 30 min. Las franjas ocupadas se ven en gris, deshabilitadas, con la etiqueta "Ocupado"; la franja elegida se resalta en azul. Panel lateral "Disponibilidad del médico" con las próximas franjas libres.
- Paso 3, Confirmar: resumen (paciente, médico, especialidad, consultorio, fecha y hora), campo obligatorio "Motivo de la consulta", casilla marcada "Enviar recordatorio 24 horas antes por correo" (el canal cambia a SMS según el paciente), botón grande "Confirmar cita". Al confirmar: pantalla de éxito "Cita registrada: lunes 12/10/2026, 14:00 · Dr. Andrés Huamán (Cardiología) · Consultorio C-201", con los botones "Reservar otra cita" y "Ver historia clínica del paciente".
- Mostrar también un estado de error: "Ese horario acaba de ser tomado por otra persona. Elija otro horario." con las franjas libres resaltadas.

3) HISTORIA CLÍNICA UNIFICADA
Cabecera del paciente: nombre, DNI, edad, convenio y chips rojos de alergias ("Alergia a penicilina"). Banner discreto: "Su acceso a esta historia queda registrado en la bitácora de auditoría."
Línea de tiempo vertical con TODAS las consultas del paciente ordenadas de la más reciente a la más antigua, sin importar la especialidad. Cada entrada es una tarjeta con: fecha y hora, chip de especialidad (Medicina General, Cardiología), médico, motivo de consulta, diagnóstico con código CIE-10 (ej. "I10 · Hipertensión esencial (primaria)"), indicaciones y receta (medicamento, dosis, frecuencia, días).
Filtros: por especialidad y el interruptor "Mostrar entradas anuladas".
Una entrada anulada se ve atenuada, con la etiqueta roja "ANULADA", el motivo, quién la anuló y cuándo; nunca desaparece.
Botón "Anular entrada" (solo para médicos) que abre un cuadro de diálogo: título "¿Anular esta entrada?", texto "La entrada no se elimina: quedará registrada como anulada.", campo obligatorio "Motivo (mínimo 10 caracteres)", botones "Cancelar" y "Anular entrada" (rojo, deshabilitado hasta escribir el motivo).
Botón principal "Nueva consulta". Panel lateral derecho "Resultados de laboratorio" con ítems "Perfil lipídico · Listo" y "Papanicolaou · Pendiente".

4) LABORATORIO – CARGAR RESULTADO
Dos columnas. Izquierda: lista "Órdenes pendientes" (paciente, examen, médico solicitante, hace cuánto se pidió) con un campo de búsqueda. Derecha: al elegir una orden, formulario con el resumen de la orden y los campos "Valor del resultado", "Unidad", "Rango de referencia", "Adjuntar archivo (PDF o imagen)" y "Observaciones". Botón "Guardar y publicar en la historia clínica". Al guardar: toast "Resultado publicado: ya está disponible para el médico en la historia clínica" y la orden desaparece de pendientes.

5) FACTURACIÓN – EMITIR COMPROBANTE
Paso único: buscador de "Atenciones por facturar" (citas atendidas sin comprobante). Al elegir una, mostrar paciente y el convenio detectado automáticamente (chip "EPS Andina Salud · póliza AND-000101"). Tabla de conceptos: concepto, precio según el tarifario del convenio, porcentaje de copago, monto de copago. Resumen a la derecha: "Total que paga el paciente (copago)" y "Total a facturar a la EPS". Selector "Tipo de comprobante": Boleta o Factura. Nota: "Tarifa vigente desde 01/01/2026". Botón "Emitir comprobante" y enlace secundario "Registrar glosa". Mostrar también el caso "Particular" (copago 100 %) y "SOAT" (copago S/ 0.00).

FLUJO NAVEGABLE (conectar así en el prototipo)
Inicio de sesión → Agenda de citas (paso 1 → 2 → 3 → éxito) → "Ver historia clínica del paciente" → Historia clínica unificada → panel de resultados → Laboratorio → Facturación. Todas las pantallas deben poder abrirse desde la barra lateral.

HEURÍSTICAS DE NIELSEN A REFLEJAR
Visibilidad del estado (indicador de pasos, toasts, chips de estado); prevención de errores (franjas ocupadas deshabilitadas, motivo obligatorio, confirmación antes de anular); consistencia (mismo layout, colores y posición de botones primarios en todas las pantallas); reconocimiento antes que recuerdo (búsqueda con resultados, convenio detectado automáticamente); control del usuario (botón Atrás y Cancelar siempre disponibles); ayuda para recuperarse de errores (mensajes claros con la acción siguiente).
```

**Para iterar pantalla por pantalla** (si Stitch no genera todo de una vez):

1. `Genera solo la pantalla 2 (Agenda de citas, paso 2: Médico y horario) con el estilo definido arriba.`
2. `Ahora la misma pantalla en el paso 3 (Confirmar) y la pantalla de éxito.`
3. `Genera la pantalla 3 (Historia clínica unificada) con el diálogo de anulación abierto.`
4. `Genera la pantalla 4 (Laboratorio, cargar resultado) y la pantalla 5 (Facturación) manteniendo la misma barra lateral y cabecera.`
5. `Genera la pantalla 1 (Inicio de sesión).`

### 4.3 Heurísticas de Nielsen aplicadas

| Heurística | Dónde se aplica |
| --- | --- |
| Visibilidad del estado del sistema | Indicador de pasos en P2; toasts de éxito; chips de estado (programada, confirmada, anulada, pendiente) con color y texto; aviso de cierre de sesión por inactividad |
| Prevención de errores | Franjas ocupadas deshabilitadas (y, por detrás, la restricción de la BD); motivo obligatorio y confirmación para anular; convenio y tarifa detectados automáticamente en P5 |
| Consistencia y estándares | Mismo layout, paleta y posición del botón primario en las 5 pantallas |
| Reconocimiento antes que recuerdo | Búsqueda por DNI/apellidos con tarjeta de resultado; la historia muestra el resumen del paciente y alergias en cada consulta |
| Control y libertad del usuario | Botones "Atrás" y "Cancelar" siempre visibles; las entradas nunca se borran, se anulan |
| Ayuda para reconocer y recuperarse de errores | Mensaje "Ese horario acaba de ser tomado… Elija otro" con las franjas libres resaltadas |

### 4.4 Wireframes y enlace navegable

> Pegar aquí las capturas de las pantallas generadas en Stitch y el enlace al prototipo: ______________________

---

## Paso 5 — Matriz de trazabilidad

### 5.1 Historia de usuario → pantalla → componente → tablas

| Historia de usuario | Pantalla | Componente | Tablas | Observaciones |
| --- | --- | --- | --- | --- |
| **HU01** · Registrar cita evitando duplicados (RF05, RF07) | P2 · Agenda de citas (3 pasos) | **M2 Agenda** — `POST /citas`, `GET /citas/disponibilidad/{medico_id}`, `POST /citas/{id}/reprogramar` (consulta a **M1 Pacientes** `GET /pacientes?documento=`) | `agenda.cita`, `agenda.medico`, `agenda.especialidad`, `agenda.consultorio`, `agenda.horario_medico`, `agenda.cita_historial`, `pacientes.paciente` | La no duplicidad la garantiza la restricción `EXCLUDE` (ADR-03), no solo la interfaz. Cada cambio queda en `cita_historial` (RNF04). |
| **HU02** · Recordatorio automático de cita (RF06) | P2 · paso 3 (casilla de recordatorio); estado visible para el administrador | **M2 Agenda** publica el evento → **M2 Notificaciones** lo consume (*outbox*, ADR-05) | `agenda.outbox_evento`, `notificaciones.recordatorio`, `agenda.cita`, `pacientes.paciente` (`canal_recordatorio`, `email`, `telefono`) | Depende de HU01. El envío es asíncrono; una falla del proveedor no bloquea la cita (estado `fallido` con reintentos). |
| **HU03** · Historia clínica unificada (RF02) | P3 · Historia clínica unificada | **M1 HCE** — `GET /pacientes/{id}/historia` (usa **Pacientes**, **Agenda** y **Auditoría**) | `hce.entrada`, `hce.diagnostico`, `hce.cie10`, `hce.indicacion`, `hce.receta_item`, `hce.anulacion`, `agenda.medico`, `agenda.especialidad`, `pacientes.paciente`, `pacientes.antecedente`, `auditoria.bitacora` | Muestra consultas de todas las especialidades ordenadas por fecha (índice `paciente_id, fecha DESC` para RNF < 2 s). Cada lectura se audita. |
| **HU04** · Resultado digital de laboratorio (RF08) | P4 · Laboratorio: cargar resultado (y panel de resultados en P3) | **M3 Laboratorio** — `GET /ordenes-laboratorio?estado=pendiente`, `POST /ordenes-laboratorio/items/{id}/resultado`, `GET /pacientes/{id}/resultados` | `laboratorio.orden`, `laboratorio.orden_item`, `laboratorio.examen`, `laboratorio.resultado`, `hce.entrada`, `pacientes.paciente` | "Pendiente" se deriva de la ausencia de resultado. Sprint 2. |
| **HU05** · Comprobante según convenio (RF09) | P5 · Facturación: emitir comprobante | **M4 Facturación** — `GET /tarifario`, `POST /comprobantes` (usa **Agenda** para las atenciones facturables) | `facturacion.comprobante`, `facturacion.comprobante_item`, `facturacion.tarifa`, `facturacion.concepto`, `facturacion.convenio`, `facturacion.paciente_convenio`, `agenda.cita`, `pacientes.paciente`, `facturacion.glosa` | El precio y el copago se copian de la tarifa vigente al emitir. Sprint 2. |
| **RF04** · Anular entrada de HCE (**sin HU en el backlog**) | P3 · botón "Anular entrada" + diálogo | **M1 HCE** — `POST /consultas/{id}/anular` | `hce.anulacion`, `hce.entrada` | Cubierto por diseño y pantalla, pero falta su historia de usuario (ver 5.3). |

### 5.2 Verificación inversa: toda tabla responde a una historia, RF o RNF

| Esquema | Tablas | Se justifican por |
| --- | --- | --- |
| `seguridad` | `rol`, `usuario`, `sesion` | RNF02, objetivo SMART 3 (RBAC y cierre por inactividad) |
| `pacientes` | `paciente`, `antecedente` | RF01; apoyan HU01, HU02, HU03, HU05 |
| `agenda` | `especialidad`, `consultorio`, `medico`, `horario_medico`, `cita` | HU01, RF05, RF07 |
| `agenda` | `cita_historial` | RNF04 (trazabilidad de cambios de cita) |
| `agenda` | `outbox_evento` | HU02, ADR-05 |
| `notificaciones` | `recordatorio` | HU02 |
| `hce` | `entrada`, `diagnostico`, `cie10`, `indicacion`, `receta_item` | HU03, RF02, RF03 |
| `hce` | `anulacion` | RF04, RNF de trazabilidad |
| `auditoria` | `bitacora` | Ley N.° 29733, objetivo SMART 3 |
| `laboratorio` | `examen`, `orden`, `orden_item`, `resultado` | HU04, RF08 |
| `facturacion` | `convenio`, `concepto`, `tarifa`, `paciente_convenio`, `comprobante`, `comprobante_item` | HU05, RF09 |
| `facturacion` | `glosa` | RF09 (glosas, objetivo del módulo M4) |
| `reportes` | 4 vistas (sin tablas) | RF10 |

**Resultado:** ninguna tabla queda huérfana y ninguna de las 5 historias queda sin pantalla, componente o tabla.

### 5.3 Huecos detectados y ajustes al diseño

| # | Hallazgo | Ajuste hecho |
| --- | --- | --- |
| 1 | HU02 pide enviar el recordatorio "por el canal registrado (SMS o correo)", pero el paciente no tenía canal preferido. | Se agregó `pacientes.paciente.canal_recordatorio` (con `CHECK` que exige correo o teléfono) y la tabla `notificaciones.recordatorio` con estado e intentos. |
| 2 | HU03 exige mostrar la especialidad de cada consulta y ordenarlas por fecha. | La especialidad se obtiene vía `medico → especialidad` (sin duplicarla en la entrada) y se creó el índice (`paciente_id`, `fecha DESC`). |
| 3 | HU04 necesita saber qué órdenes están pendientes. | El estado se deriva de la ausencia de `resultado` en lugar de guardarse (evita redundancia, 3FN). |
| 4 | HU05 necesita saber el convenio vigente del paciente y su tarifa. | Se agregó `facturacion.paciente_convenio` con vigencia y la restricción de un solo convenio a la vez; la tarifa tiene vigencias sin solape. |
| 5 | RF10 (tiempos de espera y ocupación) no era calculable con los datos de la cita. | Se agregaron `llegada_en`, `atencion_inicio_en` y la tabla `consultorio`; se crearon 4 vistas en `reportes`. |
| 6 | El ADR-02 no listaba el esquema `notificaciones`. | Se agregó en el script; conviene actualizar el ADR-02 del SAD. |
| 7 | **Backlog:** no hay HU para RF01 (registrar paciente), RF03 (registrar consulta), RF04 (anular entrada) ni RF10 (reportes), aunque el diseño ya las cubre. | **Pendiente para el equipo:** redactar HU06–HU09 (con criterios Dado/Cuando/Entonces) y agregarlas al backlog; la matriz ya indica a qué pantalla y tablas corresponderían. |

---

## Autoevaluación contra la rúbrica del Avance 3

| Criterio | Peso | Evidencia en este documento |
| --- | --- | --- |
| Modelo de base de datos | 30 % | Paso 2: 31 tablas, 3FN, 8 decisiones justificadas, DBML para el diagrama |
| Prototipo UX/UI | 30 % | Paso 4: 5 pantallas, heurísticas, prompt de Stitch. **Faltan:** el prototipo generado, el enlace y los tiempos medidos |
| Script SQL y datos de prueba | 15 % | Paso 3: script ejecutable con restricciones y ≥ 5 registros por tabla principal |
| Diseño de componentes y trazabilidad | 25 % | Pasos 1 y 5: 9 módulos con interfaz, matriz de 5 historias + RF04 sin huecos |
