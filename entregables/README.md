# Entregables – SIGC Clínica San Rafael

Documentación de ingeniería del proyecto integrador, organizada por semana del curso **SW705 · Taller de Ingeniería de Software I** (Equipo C). Para el contexto general, ver el [README principal](../README.md).

## Estructura

```
entregables/
├── README.md
├── semana-2/
│   └── semana-2.md
├── semana-3/
│   └── semana-3.md
├── semana-5/
│   └── semana-5.md
├── semana-6/
│   ├── semana-6.md
│   └── pantallas-UX/
│       ├── login.html
│       ├── agenda.html
│       ├── historia.html
│       ├── laboratorio.html
│       └── facturacion.html
└── semana-7/
    └── semana-7.md
```

## Contenido por semana

| Semana | Archivo | Tema | Contenido principal |
| --- | --- | --- | --- |
| 2 | [`semana-2/semana-2.md`](semana-2/semana-2.md) | Acta de constitución y documento de visión | Datos generales, justificación, objetivos SMART, alcance, exclusiones, supuestos, riesgos, hitos, declaración de visión, perfiles de usuario y factibilidad |
| 3 | [`semana-3/semana-3.md`](semana-3/semana-3.md) | Ingeniería de requerimientos | Educción, requerimientos funcionales (RF01–RF10) y no funcionales (RNF01–RNF05), historias de usuario (INVEST) y backlog priorizado (MoSCoW) |
| 5 | [`semana-5/semana-5.md`](semana-5/semana-5.md) | Arquitectura de software | Selección del estilo (monolito modular), atributos de calidad, 9 ADR, vistas en Structurizr DSL y stack tecnológico |
| 6 | [`semana-6/semana-6.md`](semana-6/semana-6.md) | Diseño de datos y prototipo UX/UI | Diseño de componentes, modelo de BD (31 tablas, 3FN, DBML), scripts SQL con datos ficticios, prototipo y matriz de trazabilidad |
| 6 | [`semana-6/pantallas-UX/`](semana-6/pantallas-UX) | Prototipo de pantallas | Cinco pantallas HTML navegables (ver abajo) |
| 7 | [`semana-7/semana-7.md`](semana-7/semana-7.md) | Planificación ágil (Scrum) | Roles y acuerdos, estimación con planning poker, Definición de Hecho, Sprint Backlog 1, plan de release y tablero Kanban |

### Pantallas del prototipo (`semana-6/pantallas-UX/`)

| Archivo | Pantalla | Historia de usuario |
| --- | --- | --- |
| `login.html` | P1 · Inicio de sesión | HU10 |
| `agenda.html` | P2 · Agenda: reservar cita en 3 pasos | HU01 / HU02 |
| `historia.html` | P3 · Historia clínica unificada | HU03 / HU08 |
| `laboratorio.html` | P4 · Laboratorio: cargar resultado | HU04 |
| `facturacion.html` | P5 · Facturación: emitir comprobante | HU05 |

Para verlas, abre cada archivo `.html` directamente en el navegador.

## Cronología del curso

| Semana | Hito |
| --- | --- |
| 2 | Acta de constitución y documento de visión |
| 3–4 | Especificación de requerimientos, backlog y modelos UML |
| 5–6 | Arquitectura, modelo de base de datos y prototipo UX/UI |
| 7 | Plan de release y Sprint Backlog 1 |
| 8 | Examen Parcial: sustentación del Entregable 1 |
| 16 | Examen Final: sustentación del Entregable 2 (producto funcionando) |

## Cómo se conectan los documentos

```
Semana 2  →  Semana 3  →  Semana 5  →  Semana 6  →  Semana 7
 Visión      Requisitos   Arquitectura  Datos + UX    Planificación
 y alcance   e historias  y ADR         y trazabilidad Scrum
```

Cada entregable es coherente con el anterior: los objetivos SMART (S2) se traducen en RF/RNF e historias (S3), que condicionan los atributos de calidad y ADR (S5), que se materializan en el modelo de datos y las pantallas (S6) y se planifican en Sprints (S7).

## Equipo C

| Integrante | Rol de ingeniería |
| --- | --- |
| David Luza Ccorimanya | Project Manager |
| Romel Rodrigo Chumpitaz Flores | DevOps |
| Henry Javier Medina Malpartida | Full Stack |

**Docente:** Mg. Ing. José Carlos García La Riva
