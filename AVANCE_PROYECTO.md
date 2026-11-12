# Estado de Avance del Proyecto - SIGC (Clínica San Rafael)

**Sistema Integrado de Gestión Clínica (SIGC)**  
**Sede:** San Borja  
**Fecha de actualización:** Noviembre 2026  
**Versión:** v4.8.2  

---

## 1. Resumen Ejecutivo

El proyecto **SIGC (Clínica San Rafael)** cuenta con una arquitectura desacoplada full-stack compuesta por un backend modular en **NestJS** conectado a una base de datos **PostgreSQL** contenerizada con Docker, y un frontend asistencial interactivo desarrollado en **Next.js** con Tailwind CSS.

A la fecha, se han implementado, integrado y probado de extremo a extremo (E2E) **los 6 módulos principales de la aplicación**, cubriendo el flujo clínico, administrativo y de facturación completo:

1. **Seguridad & Autenticación** (`/`)
2. **Admisión & Agenda de Citas** (`/agenda`)
3. **Directorio de Pacientes** (`/pacientes`)
4. **Historia Clínica Electrónica - HCE** (`/historia`)
5. **Laboratorio Clínico Central** (`/laboratorio`)
6. **Facturación & Caja** (`/facturacion`)

---

## 2. Stack Tecnológico

| Capa | Tecnologías / Librerías | Descripción |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Material Symbols, Inter font | Interfaz clínica responsiva, renderizado estático pre-renderizado, navegación SPA unificada y micro-interacciones. |
| **Backend** | NestJS (ESM, TypeScript), TypeORM, RxJS, Terminus | Monolito modular con endpoints REST, validación por DTOs, pipes de seguridad y logging de auditoría. |
| **Base de Datos** | PostgreSQL 18 (Docker container `sigc-db`), UUIDv7 | 10 esquemas relacionales (`seguridad`, `pacientes`, `agenda`, `hce`, `laboratorio`, `facturacion`, `auditoria`, etc.) con reglas de inmutabilidad y triggers *append-only*. |
| **Testing** | Vitest, Supertest | Suite de pruebas E2E integradas con la base de datos (14/14 tests pasando al 100%). |
| **Normativa Legal** | Ley N.° 29733, NTS N° 139-MINSA, SITEDS SUSALUD | Trazabilidad de accesos en `auditoria.bitacora`, inmutabilidad en HCE y validación de coberturas. |

---

## 3. Módulos Implementados en Detalle

### 3.1. Seguridad y Control de Acceso (`/`)
- **Login Institucional:** Formulario de autenticación con control de intentos fallidos antes de bloqueo de cuenta.
- **Roles y Permisos:** Soporte para perfiles como *Médico*, *Admisión*, *Cajero*, *Laboratorio*, etc.
- **Contexto de Sesión:** Proveedor reactivo (`AuthContext`) que sincroniza el usuario logueado en toda la aplicación.
- **Trazabilidad:** Registro automático de inicios de sesión y auditoría de accesos.
- **Identidad Gráfica:** Logo oficial institucional `logoclinica.png` ubicado en la esquina superior izquierda y en el badge del portal.

### 3.2. Admisión & Agenda de Citas (`/agenda`)
- **Flujo en 3 pasos interactivo:**
  1. *Selección del Paciente:* Búsqueda en tiempo real por DNI o apellidos con precarga automática de datos demográficos.
  2. *Médico y Horario:* Selector de especialidad con visualización de tarjetas desplegables para 11 médicos especialistas (Cardiología, Medicina General, Ginecología, Pediatría, Traumatología), consultorio, y matriz de horarios disponibles por semana.
  3. *Confirmación:* Resumen de atención, selección de canal de recordatorio (Email/SMS) y generación de cita con código de folio único.
- **Integración Backend:** Endpoint `GET /agenda/especialidades`, `GET /agenda/pacientes/buscar`, cálculo de disponibilidad de slots y `POST /agenda/citas`.

### 3.3. Directorio de Pacientes (`/pacientes`)
- **Directorio General:** Listado consolidado de pacientes con visualización de avatar con iniciales, DNI, número de HC, cobertura de seguro, última atención y estado clínico.
- **Búsqueda & Filtros Rápidos:** Búsqueda reactiva por DNI, HC o nombre; filtros por estado (*Todos*, *Atendidos hoy*, *En espera / Triaje*, *Citas programadas*, *En Espera*) y selector de aseguradora.
- **Panel de KPIs:** Métricas de total de pacientes registrados (1,420), en espera en sede (8) y nuevas historias del mes (14).
- **Ficha Rápida (Split View):** Al seleccionar cualquier paciente de la tabla, se despliega a la derecha su expediente rápido con datos de contacto, alertas de alergias y diagnóstico reciente.
- **Navegación Cruzada:** Botones directos para *"Agendar Nueva Cita Médica"* (hacia `/agenda`) y *"Abrir Historia Clínica Completa"* (hacia `/historia`).
- **Modal "+ Registrar Nuevo Paciente":** Formulario asistido para dar de alta nuevos pacientes con validación de DNI de 8 dígitos, sexo, aseguradora y antecedentes, registrando inmediatamente en `pacientes.paciente`.

### 3.4. Historia Clínica Electrónica - HCE (`/historia`)
- **Dossier Clínico Maestro:** Encabezado con datos del paciente (Mariana Torres Quispe, #HC-884920), grupo sanguíneo, edad, seguro EPS Andina Salud y alertas críticas (Penicilina, AINEs).
- **Banner Legal & Auditoría:** Traza del operador activo y terminal según la NTS N° 139-MINSA y Ley N.° 29733.
- **Cronología Unificada de Consultas:**
  - *Consultas Activas:* Motivo, anamnesis, signos vitales (PA, FC, SatO2, IMC), diagnósticos CIE-10 (definitivo/presuntivo), plan terapéutico y receta electrónica farmacológica.
  - *Entradas Anuladas:* Tratamiento especial conforme a ley (la entrada médica no se elimina; se marca como anulada con franja roja, tachado y registro del motivo de auditoría).
- **Modal de Anulación Inmutable:** Exige al operador ingresar un motivo justificado de al menos 10 caracteres con contador en tiempo real antes de invalidar la entrada y generar el registro `#AUD-XXXX`.
- **Modal "+ Nueva consulta médica":** Permite al médico tratante redactar una nueva evolución clínica, ingresar signos vitales, asociar código CIE-10 y prescribir medicamentos.
- **Panel Lateral de Laboratorio:** Muestra exámenes validados y pendientes con modal de *"Ver informe"* y gráfico SVG de tendencia de PA Sistólica de los últimos 6 meses.

### 3.5. Laboratorio Clínico Central (`/laboratorio`)
- **Banner del Analizador Cobas c311:** Estado analítico y hora de calibración del equipo.
- **Cola de Muestras Recibidas:** Filtro por urgencia (*Todas*, *Urgencias*, *Rutina*) y buscador rápido por código de orden o paciente.
- **Validación Cuantitativa Bioquímica:**
  - Entrada de parámetros para Perfil Lipídico (Colesterol Total, Triglicéridos, HDL, LDL).
  - Cálculo dinámico de alertas en tiempo real según directrices NCEP-ATP III (*"Ligeramente elevado"*, *"+15 mg/dL límite"*, *"Adecuado"*, *"Óptimo"*).
- **Evidencia Digital:** Ficha del archivo PDF analítico adjunto y modal de previsualización con firma digital del bioquímico responsable (CQFP 1482).
- **Publicación en HCE:** Botón *"Guardar y publicar en la historia clínica"* que realiza `UPSERT` en `laboratorio.resultado`, actualiza el estado a **Validado** y dispara la notificación toast.

### 3.6. Facturación & Caja (`/facturacion`)
- **Detección de Convenio & Elegibilidad:** Conexión con SITEDS SUSALUD Online, mostrando el plan activo (EPS Andina Salud, Póliza AND-000101).
- **Alternancia Dinámica de Convenios:**
  - *EPS Andina Salud:* Copago ambulatorio del 15% (Paciente paga S/ 35.00, EPS S/ 225.00).
  - *Particular Institucional:* Copago 100% sin cobertura (Paciente paga S/ 260.00).
  - *SOAT La Positiva:* Cobertura al 100% por accidente (Copago Paciente S/ 0.00).
  - Recálculo instantáneo de la tabla, subtotales, IGV y gráfica donut SVG de financiamiento.
- **Emisión de Comprobantes:** Selector de Boleta B003 / Factura F003, medio de pago (POS Visa con número de operación, Yape/Plin, Efectivo) y botón *"Emitir Comprobante y Cobrar"*.
- **Integración Backend:** Inserción en `facturacion.comprobante` y `facturacion.comprobante_item`, numeración automática por serie y notificación de emisión exitosa con botón para imprimir Ticket POS.

---

## 4. Identidad Visual y Navegación Global

- **Logotipo Unificado:** Archivo `logoclinica.png` redimensionado (`h-10 w-10` / `h-11 w-11`) e integrado en la cabecera superior izquierda de **todas las pantallas del sistema**.
- **Barra Lateral Sincronizada:** Menú lateral accesible desde todos los módulos con resaltado del ítem activo:
  - Agenda (`/agenda`)
  - Pacientes (`/pacientes`)
  - Historia clínica (`/historia`)
  - Laboratorio (`/laboratorio`)
  - Facturación (`/facturacion`)
- **Estándar de Diseño:** Tipografía Inter, iconos vectoriales de Material Symbols y paleta clínica aprobada en los wireframes de UX/UI.

---

## 5. Estado de Pruebas y Calidad de Código

- **Pruebas E2E Backend (`pnpm --dir src/backend test:e2e`):**
  - **14 de 14 pruebas pasando al 100%**:
    - Verificación de Health Check `/`
    - Autenticación con credenciales válidas e inválidas
    - Catálogo de especialidades y búsqueda de pacientes
    - Cola de laboratorio y publicación de resultados
    - Liquidación de facturación y emisión de boletas
    - Obtención de historia clínica y validación de anulación legal (>= 10 caracteres)
    - Directorio y registro de pacientes
- **Compilación Frontend (`pnpm --dir src/frontend build`):**
  - **0 errores de compilación y 0 errores de TypeScript**.
  - 9 rutas estáticas pre-renderizadas y optimizadas con Turbopack:
    - `○ /`
    - `○ /_not-found`
    - `○ /agenda`
    - `○ /facturacion`
    - `○ /historia`
    - `○ /laboratorio`
    - `○ /pacientes`

---

## 6. Instrucciones para Ejecutar el Proyecto

### Requisitos Previos
- Docker Desktop (con servicio activo)
- Node.js (v20+) y PNPM (`npm install -g pnpm`)

### Pasos de Ejecución
1. **Base de Datos (Docker):**
   ```bash
   docker start sigc-db
   ```
2. **Backend (NestJS en puerto 3001):**
   ```bash
   pnpm --dir src/backend start:dev
   ```
3. **Frontend (Next.js en puerto 3000):**
   ```bash
   pnpm --dir src/frontend dev
   ```
4. **Acceso en el Navegador:**
   - URL: [http://localhost:3000](http://localhost:3000)
   - Usuario de prueba: `dramos@sanrafael.pe`
   - Contraseña: `password1234`

