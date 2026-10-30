# SIGC – Clínica San Rafael S.A.C.

Sistema de Información Clínico-Administrativo para la Clínica San Rafael (San Borja, Lima). Centraliza historias clínicas, agenda y citas, laboratorio, facturación por convenio y reportes gerenciales, reemplazando el manejo actual en papel/Excel y la agenda telefónica.

> **Curso:** SW705 · Taller de Ingeniería de Software I · Universidad Nacional de Ingeniería (FIIS-UNI)
> **Equipo C:** David Luza Ccorimanya · Romel Rodrigo Chumpitaz Flores · Henry Javier Medina Malpartida
> **Docente:** Mg. Ing. José Carlos García La Riva

---

## Problema que resuelve

- Historias clínicas en papel/Excel separadas por especialidad (riesgo de errores de medicación).
- Agenda telefónica saturada con ~18 % de inasistencia y citas duplicadas.
- Resultados de laboratorio en papel, con hasta 48 h de demora.
- Reconciliación manual con 5 EPS/aseguradoras y glosas por errores de tarifa.
- Sin reportes consolidados de ocupación, tiempos de espera e inasistencia.

## Módulos

| Módulo | Descripción | Sprint |
| --- | --- | --- |
| Seguridad y Auditoría | Login, sesión (cierre a los 10 min), RBAC y bitácora de solo anexado (Ley N.° 29733) | 1 |
| M1 · Historia clínica electrónica | Pacientes, antecedentes, consultas con CIE-10, indicaciones, recetas y anulación con motivo | 1–2 |
| M2 · Agenda y citas | Citas sin doble reserva, reprogramación, recordatorios por correo/SMS | 1 |
| M3 · Laboratorio e imágenes | Órdenes y resultados digitales | 2 |
| M4 · Facturación y convenios | Tarifario por convenio, comprobantes, copagos y glosas | 2 |
| M5 · Reportes gerenciales | Ocupación, tiempos de espera, inasistencia e ingresos | 2 |
| M6 · Portal del paciente | Deseable, sujeto a avance | – |

## Arquitectura

**Monolito modular**: un solo despliegue, un módulo por contexto de negocio y un esquema de PostgreSQL por módulo.

- **Integridad:** restricción `EXCLUDE` en la BD para evitar citas solapadas; HCE y bitácora de solo anexado (sin `DELETE`/`UPDATE`).
- **Comunicación entre módulos:** API pública en proceso + eventos con patrón *transactional outbox*.
- **Frontend:** Next.js solo como capa de presentación; toda la lógica vive en la API.

| Capa | Tecnología |
| --- | --- |
| Backend | Node.js LTS, NestJS, TypeScript, TypeORM |
| Frontend | Next.js (App Router), TypeScript |
| Base de datos | PostgreSQL 18 (`btree_gist`) |
| Seguridad | Passport, `express-session`, `connect-pg-simple`, Argon2id |
| Despliegue | Docker Compose, Caddy (TLS), VPS + respaldos externos |
| CI/CD | GitHub Actions |
| Pruebas | Jest, Supertest, Testcontainers, k6, Playwright |

## Estructura del repositorio

```
.
├── README.md          # Este archivo
└── src/
    ├── README.md      # Guía del código fuente
    ├── backend/       # API NestJS (monolito modular)
    └── frontend/      # Aplicación web Next.js
```

Ver [`src/README.md`](src/README.md) para el detalle del código.

## Requisitos previos

- Node.js LTS y pnpm
- Docker y Docker Compose
- PostgreSQL 18 (o el contenedor `postgres:18` del entorno de desarrollo)

## Puesta en marcha (desarrollo)

```bash
# 1. Clonar
git clone <url-del-repositorio>
cd <carpeta-del-repositorio>

# 2. Variables de entorno
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env

# 3. Levantar base de datos y servicios
docker compose up -d

# 4. Instalar dependencias
pnpm --dir src/backend install
pnpm --dir src/frontend install

# 5. Migraciones y datos de prueba (ficticios)
pnpm --dir src/backend migration:run

# 6. Ejecutar
pnpm --dir src/backend start:dev
pnpm --dir src/frontend dev
```

> Ajusta los nombres de scripts y archivos `.env` a los que existan en tu `package.json`.

## Reglas del proyecto

- **Datos ficticios:** pruebas y demos nunca usan datos reales de pacientes.
- **Fronteras entre módulos:** un módulo no importa el interior de otro; se verifica con `dependency-cruiser` en CI.
- **Definición de Hecho:** PR aprobado, pruebas en verde (≥ 70 % de cobertura del código nuevo), endpoints en OpenAPI, migraciones versionadas y operaciones sobre datos del paciente auditadas.

## Planificación

Scrum con Sprints de 3 semanas. **Sprint 1 (26/10 – 13/11/2026):** HU10 inicio de sesión y roles, HU06 registro de pacientes, HU01 citas sin duplicados y HU11 bitácora de auditoría.

## Exclusiones del alcance

- Integración en tiempo real con EPS/aseguradoras (se usan archivos planos).
- Hospitalización y cirugía ambulatoria.
- Migración masiva de historias clínicas en papel.

## Licencia

Proyecto académico. Uso educativo.
