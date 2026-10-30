#Código fuente del SIGC

Contiene las dos aplicaciones del sistema. Para el contexto general del proyecto, ver el [README principal](../README.md).

```
src/
├── backend/    # API REST – NestJS (monolito modular)
└── frontend/   # Interfaz web – Next.js (solo presentación)
```

## backend/

API en Node.js + NestJS + TypeScript. Un módulo de NestJS por contexto de negocio, cada uno dueño de su esquema en PostgreSQL.

| Módulo | Esquema BD | Responsabilidad |
| --- | --- | --- |
| `seguridad` | `seguridad` | Autenticación, sesión (10 min) y RBAC |
| `auditoria` | `auditoria` | Bitácora de solo anexado |
| `pacientes` | `pacientes` | Datos personales y antecedentes |
| `hce` | `hce` | Consultas, CIE-10, recetas y anulación |
| `agenda` | `agenda` | Citas sin doble reserva y reprogramación |
| `notificaciones` | `notificaciones` | Recordatorios por correo/SMS (outbox) |
| `laboratorio` | `laboratorio` | Órdenes y resultados (Sprint 2) |
| `facturacion` | `facturacion` | Tarifario, comprobantes y glosas (Sprint 2) |
| `reportes` | `reportes` | Vistas de solo lectura (Sprint 2) |

**Reglas de dependencia (un solo sentido, sin ciclos):**
`hce → pacientes, agenda` · `agenda → pacientes` · `laboratorio → hce, pacientes` · `facturacion → agenda, pacientes` · `reportes → agenda, facturacion` (lectura) · todos → `auditoria`.

Cada módulo expone solo sus servicios públicos (`exports`). Nunca se leen ni escriben tablas de otro módulo.

**Convenciones**
- Una transacción por caso de uso.
- Migraciones versionadas en SQL (restricciones `EXCLUDE`, *triggers* y `REVOKE` incluidos).
- Contrato publicado con OpenAPI (`@nestjs/swagger`).
- Las reprogramaciones y cancelaciones deben fijar `app.usuario_id` en la transacción para el historial de citas.

**Comandos habituales**

```bash
pnpm install
pnpm start:dev          # desarrollo
pnpm test               # pruebas unitarias e integración
pnpm lint:boundaries    # verificación de fronteras (dependency-cruiser)
pnpm migration:run      # aplicar migraciones
```

## frontend/

Aplicación Next.js (App Router) + TypeScript. Interfaz simple por rol, pensada para personal con distintos niveles de alfabetización digital (registrar una cita en ≤ 3 pasos).

| Pantalla | Historia de usuario |
| --- | --- |
| P1 · Inicio de sesión | HU10 |
| P2 · Agenda: reservar cita en 3 pasos | HU01 / HU02 |
| P3 · Historia clínica unificada | HU03 / HU08 |
| P4 · Laboratorio: cargar resultado | HU04 |
| P5 · Facturación: emitir comprobante | HU05 |

**Convenciones**
- Cliente TypeScript generado a partir del contrato OpenAPI del backend.
- Los *Server Components* reenvían la cookie de sesión a la API.
- Sin lógica de negocio ni acceso directo a la BD.

**Comandos habituales**

```bash
pnpm install
pnpm dev        # desarrollo
pnpm build      # build de producción
pnpm test       # pruebas
```

## Variables de entorno

Cada aplicación incluye un `.env.example`. Copia a `.env` y completa los valores. **Nunca subas `.env` al repositorio.**

> Los nombres de scripts son referenciales; ajústalos a los definidos en cada `package.json`.
