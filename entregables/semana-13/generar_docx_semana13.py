#!/usr/bin/env python3
"""Genera la guía Semana 13 completada (Word) a partir de la plantilla del docente."""

from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
TEMPLATE = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/Guia_Practica_Semana13_SW705_fae6.docx"
)
OUT = ROOT / "Guia_Practica_Semana13_EquipoC_COMPLETADA.docx"
EVID = ROOT / "evidencias"


def text_to_png(name: str, content: str, width: int = 1100) -> Path:
    """Renderiza salida de terminal como PNG para incrustar en Word."""
    lines = content.rstrip().split("\n")
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    ]
    font = None
    for fp in font_paths:
        if Path(fp).exists():
            font = ImageFont.truetype(fp, 16)
            break
    if font is None:
        font = ImageFont.load_default()
    line_h = 22
    pad = 16
    height = pad * 2 + line_h * max(len(lines), 1)
    img = Image.new("RGB", (width, height), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, width, 28), fill=(50, 50, 50))
    draw.text((12, 6), "Terminal · Equipo C · Clínica San Rafael", fill=(220, 220, 220), font=font)
    y = 36
    for line in lines:
        draw.text((pad, y), line[:120], fill=(20, 20, 20), font=font)
        y += line_h
    out = EVID / name
    img.save(out)
    return out


def set_cell(table, row: int, col: int, text: str) -> None:
    if row >= len(table.rows):
        raise IndexError(f"fila {row} fuera de rango (filas={len(table.rows)})")
    cells = table.rows[row].cells
    if col >= len(cells):
        raise IndexError(f"col {col} fuera de rango (cols={len(cells)}) fila={row}")
    cells[col].text = text


def insert_after(paragraph, doc: Document):
    from docx.text.paragraph import Paragraph
    from docx.oxml import OxmlElement

    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    return Paragraph(new_p, paragraph._parent)


def add_evidence_after_paragraph(doc: Document, needle: str, image: Path, width=Inches(6.2)) -> bool:
    for p in doc.paragraphs:
        if needle in p.text:
            new_p = insert_after(p, doc)
            new_p.add_run(f"Captura: {image.stem}")
            run = new_p.add_run()
            run.add_break()
            run.add_picture(str(image), width=width)
            return True
    return False


def main() -> None:
    EVID.mkdir(parents=True, exist_ok=True)
    shots = {
        "01_metricas_corte.png": (EVID / "metricas_corte.txt").read_text(),
        "02_pytest_rojo.png": (EVID / "pytest_rojo.txt").read_text(),
        "03_pytest_verde.png": (EVID / "pytest_verde.txt").read_text(),
        "04_pytest_cov.png": (ROOT.parent.parent / "metricas/salida_pytest_cov.txt").read_text(),
        "05_radon.png": (EVID / "radon.txt").read_text(),
        "06_tiempo_ciclo.png": (
            ROOT.parent.parent / "metricas/salida_tiempo_ciclo.txt"
        ).read_text(),
        "07_git_merge.png": (EVID / "git_merge_conflicto.txt").read_text(),
    }
    png_paths = {k: text_to_png(k, v) for k, v in shots.items()}

    shutil.copy(TEMPLATE, OUT)
    doc = Document(OUT)

    # Tabla portada equipo
    t0 = doc.tables[0]
    set_cell(t0, 0, 1, "Equipo C: David Luza Ccorimanya · Romel Rodrigo Chumpitaz Flores · Henry Javier Medina Malpartida")
    set_cell(t0, 1, 1, "20232595H · 20231014A · 20232571A")
    set_cell(t0, 2, 1, "U")
    set_cell(t0, 3, 1, "26/11/2026 — sesión Semana 13")
    set_cell(t0, 4, 1, "https://github.com/Bluethem/taller-clinica")

    # 1.1 Historias
    historias = [
        ("HU-03 — Historia clínica unificada", "8", "Hecha", "2026-11-21", "PR #12 fusionado"),
        ("HU-04 — Resultado digital laboratorio", "5", "Hecha", "2026-11-22", "PR #13 fusionado"),
        ("HU-05 — Comprobante según convenio", "5", "Hecha", "2026-11-24", "PR #14 fusionado"),
        ("SC-02 — Cancelar cita (antelación mínima)", "3", "Hecha", "2026-11-25", "PR #15 fusionado"),
        (
            "HU-07 — Recordatorio 24 h antes",
            "5",
            "En curso",
            "—",
            "https://github.com/Bluethem/taller-clinica/pull/12",
        ),
    ]
    t3 = doc.tables[3]
    needed = len(historias) - (len(t3.rows) - 1)
    for _ in range(max(0, needed)):
        t3.add_row()
    for i, row in enumerate(historias, start=1):
        for j, val in enumerate(row):
            set_cell(t3, i, j, val)

    # 1.3 Resultado programa
    t5 = doc.tables[5]
    set_cell(t5, 1, 1, "26 / 21 / 5 pts")
    set_cell(t5, 2, 1, "10,4 pts")
    set_cell(t5, 3, 1, "−5,4 pts → adelantado")
    set_cell(t5, 4, 1, "3,50 pts/día")
    set_cell(t5, 5, 1, "35,0 pts de 26 (proyección lineal; quedan 5 pts reales)")

    # 1.4 Riesgos
    t6 = doc.tables[6]
    set_cell(
        t6,
        1,
        1,
        "Sin HU-07 no se cierra RF06 ni el incremento del sprint a tiempo.",
    )
    set_cell(
        t6,
        1,
        2,
        "Priorizar HU-07 en S13; PM congela nuevas tareas hasta fusionar.",
    )
    set_cell(
        t6,
        2,
        1,
        "Conflicto en app/citas.py al integrar SC-02 y HU-07.",
    )
    set_cell(
        t6,
        2,
        2,
        "Fusionar main en feature/hu-07-recordatorio; conservar ambas constantes.",
    )

    # 1.5 Reparto
    t7 = doc.tables[7]
    reparto = [
        (
            "David Luza Ccorimanya",
            "Estado del sprint, métricas de proceso, informe",
            "1, 5, 6",
            "PR informe / métricas",
        ),
        (
            "Romel Rodrigo Chumpitaz Flores",
            "Conflicto de fusión, CI, revisión",
            "3, integración",
            "Revisor HU-07",
        ),
        (
            "Henry Javier Medina Malpartida",
            "TDD HU-07, métricas de producto, mutaciones",
            "2, 4",
            "Autor HU-07 (commits test → feat)",
        ),
        ("—", "(equipo de 3 integrantes)", "Daily conjunta", "—"),
    ]
    for i, row in enumerate(reparto, start=1):
        for j, val in enumerate(row):
            set_cell(t7, i, j, val)

    # 2.1 CP
    t8 = doc.tables[8]
    cps = [
        ("Sí", "Límite superior 24 h"),
        ("No", "Fuera de ventana"),
        ("Sí", "Dentro de ventana"),
        ("Sí", "Límite inferior (cita ahora)"),
        ("No", "Cita pasada"),
        ("No", "Estado cancelada"),
        ("No", "Idempotencia"),
        ("No envía / no marca recordada", "Fallo del notificador"),
    ]
    for i, (rec, tipo) in enumerate(cps, start=1):
        set_cell(t8, i, 2, rec)
        set_cell(t8, i, 3, tipo)

    # pytest fases
    t13 = doc.tables[13]
    set_cell(
        t13,
        1,
        1,
        "ImportError / ModuleNotFoundError: app.recordatorios (12 tests definidos, 0 pasan)",
    )
    set_cell(t13, 2, 1, "12 passed in 0,01s (python3 -m pytest -q)")
    set_cell(
        t13,
        3,
        1,
        "Marcar recordada sin validar enviar() — corregido con CP-08",
    )

    # 3.1 salida git
    t15 = doc.tables[15]
    set_cell(
        t15,
        1,
        1,
        "CONFLICT (content): Merge conflict in app/citas.py",
    )
    set_cell(t15, 2, 1, "app/citas.py")

    conflicto = """<<<<<<< HEAD
HORAS_ANTES_RECORDATORIO = 24
=======
MINUTOS_MINIMOS_CANCELAR = 120
>>>>>>> origin/main"""

    resuelto = """ESTADO_RESERVADA = "reservada"
ESTADO_CANCELADA = "cancelada"
MINUTOS_MINIMOS_CANCELAR = 120
HORAS_ANTES_RECORDATORIO = 24

@dataclass
class Cita:
    dni: str
    inicio: datetime
    estado: str = ESTADO_RESERVADA
    recordada: bool = False"""

    doc.tables[17].rows[0].cells[0].text = conflicto
    doc.tables[18].rows[0].cells[0].text = resuelto

    t19 = doc.tables[19]
    set_cell(
        t19,
        1,
        1,
        "HORAS_ANTES_RECORDATORIO = 24 y campo recordada en Cita",
    )
    set_cell(t19, 1, 2, "MINUTOS_MINIMOS_CANCELAR y función puede_cancelar")
    set_cell(t19, 1, 3, "Conservar ambos cambios en app/citas.py")
    set_cell(t19, 1, 4, "Romel + Henry")

    # 4.2 métricas
    t22 = doc.tables[22]
    set_cell(t22, 1, 2, "12/12 en verde")
    set_cell(t22, 1, 3, "Sí")
    set_cell(t22, 2, 2, "100 % (recordatorios, notificaciones)")
    set_cell(t22, 2, 3, "Sí")
    set_cell(t22, 3, 2, "100 % total app/")
    set_cell(t22, 3, 3, "Sí")
    set_cell(t22, 4, 2, "5 (citas_a_recordar)")
    set_cell(t22, 4, 3, "Sí")
    set_cell(t22, 5, 2, "0")
    set_cell(t22, 5, 3, "Sí")

    t24 = doc.tables[24]
    set_cell(t24, 1, 1, "CP-01-24h")
    set_cell(t24, 1, 2, "Sí")
    set_cell(t24, 2, 1, "CP-07-ya-recordada")
    set_cell(t24, 2, 2, "Sí")

    # 5 métricas proceso
    t26 = doc.tables[26]
    set_cell(t26, 1, 1, "4")
    set_cell(t26, 1, 2, "PR #12–#15 (sprint 2)")
    set_cell(t26, 2, 1, "2,3 días")
    set_cell(t26, 2, 2, "Aceptable; por debajo del umbral informal de 3 días")
    set_cell(t26, 3, 1, "3,3 días (PR #14)")
    set_cell(t26, 3, 2, "Facturación / tarifario requirió segunda revisión")
    set_cell(
        t26,
        4,
        1,
        "Designar revisor por turno en Daily; meta ≤ 2 días",
    )
    set_cell(t26, 4, 2, "Reduce cola de revisión antes del cierre del sprint")

    # 6 evidencias enlaces
    t29 = doc.tables[29]
    set_cell(
        t29,
        1,
        1,
        "https://github.com/Bluethem/taller-clinica/pull/12",
    )
    set_cell(
        t29,
        2,
        1,
        "https://github.com/Bluethem/taller-clinica/pull/12 (docs en la misma rama)",
    )
    set_cell(
        t29,
        3,
        1,
        "https://github.com/Bluethem/taller-clinica/tree/cursor/sprint2-semana13-739c/metricas",
    )
    set_cell(
        t29,
        4,
        1,
        "Etiqueta v0.1.0 · Release Sprint 1 (base); PR Sprint 2 mitad pendiente de merge",
    )

    # Informe resumen tabla 28
    informe = """# Informe de mitad del Sprint 2 — SIGC Clínica San Rafael S.A.C.

Fecha de corte: 2026-11-26 (día 6 de 10)

## 1. Estado del sprint
Comprometido 26 pts · Hecho 21 pts · Restante 5 pts (HU-07).

## 2. Métricas de proceso
Burndown adelantado (−5,4 pts vs ideal). Ciclo de PR: mediana 2,3 d · máx 3,3 d.

## 3. Métricas de producto
12 pruebas verdes; cobertura con ramas 100 % en app/; radon grado A.

## 4. Riesgos y decisiones
Ver tablas 1.4 y documento docs/informe_mitad_sprint2.md en el repositorio.

## 5. Plan hasta el cierre
26/11 cierre HU-07; 01–02/12 Review y cierre Sprint 2."""

    doc.tables[28].rows[0].cells[0].text = informe

    # Capturas incrustadas (buscar anclas en el doc)
    anchors = [
        ("Evidencia: salida de metricas_corte.py", png_paths["01_metricas_corte.png"]),
        ("Evidencia: capturas de pytest", png_paths["02_pytest_rojo.png"]),
        ("enlace al pull request", png_paths["03_pytest_verde.png"]),
        ("Evidencia: salida de git merge", png_paths["07_git_merge.png"]),
        ("Evidencia: salida de pytest con cobertura", png_paths["04_pytest_cov.png"]),
        ("Evidencia: salida de tiempo_ciclo.py", png_paths["06_tiempo_ciclo.png"]),
    ]
    missing = []
    for needle, img in anchors:
        if not add_evidence_after_paragraph(doc, needle, img):
            missing.append(needle)

    # Si no encontró anclas, agregar sección al final
    if missing:
        doc.add_page_break()
        doc.add_heading("Anexo — Capturas generadas automáticamente", level=1)
        for img in png_paths.values():
            doc.add_paragraph(img.name)
            doc.add_picture(str(img), width=Inches(6.2))

    doc.add_paragraph()
    p = doc.add_paragraph()
    run = p.add_run(
        "📷 Capturas pendientes (insertar manualmente en Word): "
        "(1) Burndown del tablero/Jira o captura del cuadro 1.3. "
        "(2) GitHub → PR #12 → Checks en verde (test + practica-python). "
        "(3) Pantalla del conflicto en el editor, si el docente exige evidencia del merge en vivo."
    )
    run.font.size = Pt(10)

    doc.save(OUT)
    print("Generado:", OUT)
    if missing:
        print("Anclas no encontradas (imágenes al anexo):", missing)


if __name__ == "__main__":
    main()