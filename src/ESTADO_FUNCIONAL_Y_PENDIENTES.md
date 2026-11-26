# SIGC — Estado funcional y pendientes por pantalla

Documento de referencia para el equipo. Resume qué está implementado en la interfaz y en la API, qué falta respecto al backlog (`entregables/`, semanas 3–7) y prioridades sugeridas para sustentación y examen final.

**Última actualización:** 26/11/2026  
**Rutas frontend actuales:** `src/frontend/app/(app)/*`  
**Menú y roles:** `src/frontend/app/lib/nav.ts`

---

## Credenciales demo (seed)

Contraseña común en desarrollo: `password1234`. Usar **username** (no el correo antiguo `@sanrafael.pe`).

| Usuario | Rol | Uso típico |
| --- | --- | --- |
| `dramos` | admisión | Agenda, pacientes |
| `lparedes` | médico | Historia, mis citas |
| `evargas` | cajero | Facturación (emitir) |
| `scampos` | administrador | Todos los módulos; auditoría en API |
| `rluna` | gerencia | Menú limitado; reportes aún sin pantalla |
| `jnavarro` | laboratorio | Laboratorio |

---

## Panorama rápido

| Área | UX | API | Backlog |
| --- | --- | --- | --- |
| Login + AppShell + menú por rol | Sólido | Sólido (sesión 10 min, guards) | Sprint 1 |
| Agenda (crear cita) | Bueno | Parcial (sin reprogramar/cancelar) | Must HU01/HU09 |
| Pacientes | Rico (a veces más UI que API) | Parcial | Must HU06 |
| Historia clínica | Muy rico | Mejorado en rama `feature/auditoria-hce-sprint2` | Sprint 2 HU03/07/08 |
| Laboratorio | Bueno | Adelantado | Should HU04 |
| Facturación | Diseño fuerte, mezcla demo | Parcial | Should HU05 |
| **Administración** | **Sin consola propia** | `GET /auditoria` (admin) | HU10/HU11 |
| **Reportes gerencia** | **Sin pantalla** | Solo vistas SQL en BD | Should HU12 |
| Recordatorios | Checkbox en wizard | Sin worker/outbox | Should HU02 |

---

## Por pantalla

### Login (`/`)

**Hecho:** autenticación por sesión, redirección a dashboard, rol en contexto.

**Pendiente:** cierre explícito por inactividad en UI (10 min alineado con cookie backend); gestión de usuarios (rol administrador, vía pantalla dedicada).

---

### Dashboard (`/dashboard`)

**Hecho:** saludo por rol, tarjetas según `navForRole`, atajos para admisión/administrador, bloque “Mis citas” para médico.

**Pendiente por rol:**

| Rol | Lo esperado (entregables) | Hoy |
| --- | --- | --- |
| admisión | Cola del día, KPIs operativos | Atajos + tarjetas; pocos KPIs reales |
| médico | Mis citas + HCE | Aceptable |
| enfermera | Triaje / pacientes en espera | Mensaje genérico “Tu módulo” |
| cajero | Cola de cobro | Solo enlace a facturación |
| laboratorio | Cola de órdenes | Solo enlace al módulo |
| **gerencia** | **KPIs y gráficos (RF10)** | **No hay** |
| **administrador** | **Auditoría, usuarios, configuración** | **Igual que admisión + todas las tarjetas** |

---

### Agenda (`/agenda`)

**Hecho:** wizard de 3 pasos (admisión/administrador); médico ve listado de “mis citas” y enlace a HCE.

**Pendiente (Must):**

- **HU09** — reprogramar (`PATCH /agenda/citas/:id/reprogramar`): sin endpoint ni UI.
- Cancelar cita y consultar **historial** (`agenda.cita_historial`) en pantalla.
- **HU02** — recordatorio 24 h: canal en paso 3; sin envío ni outbox consumido.
- Vista calendario / día (prototipo S6 es más operativo que listas actuales).

---

### Pacientes (`/pacientes`)

**Hecho:** directorio, búsqueda, panel lateral, alta (admisión/administrador), enlace ` /historia?pacienteId=... `.

**Pendiente:**

- **HU06 completo:** actualización de datos; **antecedentes** como flujo propio (no solo alergias al registrar).
- KPIs del listado (totales, “en espera”) mayormente decorativos, no desde API.
- Flujo enfermería (triaje) no definido en UI.

---

### Historia clínica (`/historia`)

**Hecho:** dossier (demo Mariana + datos reales), anulación con motivo ≥ 10 caracteres, nueva consulta con CIE-10 obligatorio (rama reciente), laboratorio lateral, impresión.

**Pendiente:**

- Vincular consulta a **cita** (HU07).
- Receta estructurada (`hce.receta` / ítems) vs. texto en `hce.indicacion` (parcial).
- Política de roles: quién puede anular/registrar consulta (revisar con PO).
- Manejo UI de paciente inexistente en deep-link `?pacienteId=`.
- Mezcla datos demo/BD para paciente principal (cuidado en demo).
- Sin pantalla de bitácora aunque el backend audita lecturas/escrituras/anulaciones.

---

### Laboratorio (`/laboratorio`)

**Hecho:** cola, captura y publicación en HCE (**HU04** en buen estado).

**Pendiente (menor):** notificación al médico vía eventos; rol administrador sin vista “supervisor”.

---

### Facturación (`/facturacion`)

**Hecho:** liquidación por convenio, tabs EPS/particular/SOAT, emisión de comprobante, modal de glosa (UI).

**Pendiente para cerrar HU05 / M4:**

- Búsqueda real paciente/cita; dependencia de `DEMO_LIQUIDACION` si falla la API.
- **Gerencia:** API solo permite `GET /liquidacion`; el front no oculta “Emitir” → posible 403 confuso.
- Sin listado de comprobantes, reimpresión, anulación, conciliación EPS (archivos planos).
- Persistencia de **glosas** en backend (verificar).
- Liquidación amarrada a cita atendida de forma automática.

---

### Administrador (sin ruta propia)

En negocio: usuarios, roles, configuración y **auditoría** (Ley N.° 29733).

**Hecho (backend, rama reciente):** `GET /auditoria?pacienteId=` solo `administrador`; bitácora en operaciones clínicas.

**Pendiente en producto:**

| Capacidad | Estado |
| --- | --- |
| Pantalla consulta bitácora (filtros, export) | No existe |
| CRUD usuarios y roles | No existe |
| Parámetros (tarifario, convenios, consultorios) | Solo en seed SQL |
| Dashboard admin (accesos, alertas) | No existe |
| Ítem de menú “Administración” / “Auditoría” | No existe |

Usuario de prueba: `scampos`.

---

### Gerencia — reportes (sin módulo UI)

**Hecho:** rol en BD; menú: Inicio + Facturación (lectura vía liquidación).

**Pendiente (HU12a / HU12b — Should, clave en acta):**

- Ruta `/reportes` o `/gerencia` con indicadores y **gráficos**.
- Backend: módulo `GET /reportes/*` sobre vistas ya creadas en PostgreSQL:
  - `reportes.v_ocupacion_consultorio`
  - `reportes.v_inasistencia_mensual`
  - `reportes.v_tiempo_espera`
  - `reportes.v_ingresos_mensual`
- Filtros por periodo y exportación.
- Dashboard gerencia orientado a KPIs, no a caja.

Usuario de prueba: `rluna`.

---

## Matriz rol × menú (hoy)

| Pantalla | En menú para… | ¿Alineado al rol? |
| --- | --- | --- |
| Dashboard | Todos | Parcial |
| Agenda | médico, admisión, administrador | Crear ✓; reprogramar ✗ |
| Pacientes | médico, enfermera, admisión, administrador | Directorio ✓ |
| Historia | médico, enfermera, administrador | Clínico ✓ |
| Laboratorio | laboratorio, administrador | ✓ |
| Facturación | cajero, administrador, gerencia | Cajero ✓; gerencia debe ser consulta/reportes |
| Reportes | — | **Gerencia sin entrada** |
| Admin / auditoría | — | **Administrador sin entrada** |

Definición oficial del menú: `src/frontend/app/lib/nav.ts`.

---

## Huecos transversales (afectan varias pantallas)

1. **HU09** reprogramar / cancelar citas.
2. **HU02** recordatorios (email/SMS).
3. **HU11** visible solo vía BD/API; falta UI para administrador.
4. **OpenAPI**, `dependency-cruiser`, despliegue VPS — DoD académica.
5. Pruebas **E2E en frontend** (Playwright): no hay suite.
6. `AVANCE_PROYECTO.md` en raíz puede sobreestimar cobertura; contrastar con este documento.

---

## Priorización sugerida (equipo)

Orden práctico para el examen final:

1. **Gerencia:** API `reportes` + pantalla con 2–4 KPIs/gráficos (HU12a mínimo).
2. **Administrador:** pantalla bitácora (`GET /auditoria`).
3. **Facturación:** búsqueda real, ocultar emitir para gerencia, reducir demo.
4. **Agenda:** reprogramar (HU09).
5. **Dashboard** diferenciado para `gerencia`, `administrador` y `cajero`.
6. Recordatorios, CRUD usuarios, glosas persistentes — según tiempo y rubrica.

---

## Referencias

| Documento | Contenido |
| --- | --- |
| [README principal](../README.md) | Arranque, módulos, planificación |
| [src/README.md](./README.md) | Módulos backend/frontend y dependencias |
| `entregables/semana-3/semana-3.md` | RF y historias HU01–HU12 |
| `entregables/semana-7/semana-7.md` | Sprint backlog y plan de release |
| `entregables/semana-6/pantallas-UX/*.html` | Prototipos de referencia visual |
| Rama `feature/auditoria-hce-sprint2` | Auditoría central, HCE (LECTURA/ANULACION/CIE-10), E2E ampliados |

---

## Cómo mantener este archivo

Al cerrar una historia o pantalla nueva:

1. Actualizar la tabla “Panorama rápido” y la sección de la pantalla.
2. Marcar la fila en “Priorización sugerida” si ya está hecha.
3. Cambiar la fecha al inicio del documento.

*Equipo C — SW705 · Clínica San Rafael*