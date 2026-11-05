"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Especialidad { id: number; nombre: string; }
interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  especialidadId: number;
  cmp: string;
  rne?: string;
  consultorio?: string;
  subespecialidad?: string;
  avatarUrl?: string;
}
interface Paciente { id: string; tipo_documento: string; numero_documento: string; nombres: string; apellido_paterno: string; apellido_materno: string; fecha_nacimiento: string | null; }
interface Slot { fecha: string; hora: string; inicio: string; fin: string; disponible: boolean; }
interface CitaRegistrada { id: string; folio: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const requestOptions = { credentials: "include" as const, ...opts };
  try {
    return await fetch(`${API}${path}`, requestOptions);
  } catch {
    return fetch(path, requestOptions); // vía rewrite Next.js
  }
}

// Fecha de inicio de semana base para entorno de demostración (semana de muestra del proyecto: 12-16 Oct 2026)
const SEMANA_DEMO = new Date("2026-10-12T00:00:00-05:00");

function formatearFecha(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

function AgendaPageContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // ── Estado del stepper ────────────────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [toastVisible, setToastVisible] = useState(false);

  // ── Paso 1 – Paciente ──────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("70000001");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [buscando, setBuscando] = useState(false);

  const buscarPaciente = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setBuscando(true);
    try {
      const r = await apiFetch(`/agenda/pacientes/buscar?q=${encodeURIComponent(q)}`);
      const data: Paciente[] = await r.json();
      setPacientes(data);
      if (data.length === 1) setPacienteSeleccionado(data[0]);
    } catch { /* red caída */ }
    finally { setBuscando(false); }
  }, []);

  // Carga inicial con el DNI de ejemplo
  useEffect(() => { buscarPaciente("70000001"); }, [buscarPaciente]);

  // ── Paso 2 – Médico / Horario ──────────────────────────────────────────────
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadId, setEspecialidadId] = useState<number | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicoId, setMedicoId] = useState<string | null>(null);

  // Semana
  const [semanaInicio, setSemanaInicio] = useState<Date>(SEMANA_DEMO);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  useEffect(() => {
    apiFetch("/agenda/especialidades")
      .then(r => r.json())
      .then((data: Especialidad[]) => {
        setEspecialidades(data);
        if (data.length > 0) {
          const cardio = data.find(e => e.nombre.toLowerCase().includes("cardio"));
          setEspecialidadId(cardio ? cardio.id : data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (especialidadId === null) return;
    apiFetch(`/agenda/medicos?especialidadId=${especialidadId}`)
      .then(r => r.json())
      .then((data: Medico[]) => {
        setMedicos(data);
        if (data.length > 0) {
          // Si el médico seleccionado actual está en la lista, conservarlo; sino, elegir el primero
          setMedicoId(prev => (prev && data.some(m => m.id === prev) ? prev : data[0].id));
        } else {
          setMedicoId(null);
        }
      })
      .catch(() => {});
  }, [especialidadId]);

  useEffect(() => {
    if (!medicoId) return;
    setCargandoSlots(true);
    const desde = new Date(semanaInicio);
    const hasta = new Date(semanaInicio);
    hasta.setDate(hasta.getDate() + 5);
    apiFetch(`/agenda/slots/${medicoId}?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`)
      .then(r => r.json())
      .then((data: Slot[]) => { setSlots(data); setSlotSeleccionado(null); })
      .catch(() => {})
      .finally(() => setCargandoSlots(false));
  }, [medicoId, semanaInicio]);

  // ── Paso 3 – Confirmación ─────────────────────────────────────────────────
  const [motivo, setMotivo] = useState("Control post-operatorio y evaluación de presión arterial");
  const [recordatorio, setRecordatorio] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [citaRegistrada, setCitaRegistrada] = useState<CitaRegistrada | null>(null);
  const [errorConfirm, setErrorConfirm] = useState<string | null>(null);

  const confirmarCita = async () => {
    if (!pacienteSeleccionado || !medicoId || !slotSeleccionado || !motivo.trim()) return;
    setGuardando(true);
    setErrorConfirm(null);
    try {
      const r = await apiFetch("/agenda/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.id,
          medicoId,
          inicio: slotSeleccionado.inicio,
          motivo,
          enviarRecordatorio: recordatorio,
          creadoPor: user?.id ?? "",
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setErrorConfirm(err.message ?? "Error al registrar la cita. Puede que el horario ya esté ocupado.");
        return;
      }
      const data: CitaRegistrada = await r.json();
      setCitaRegistrada(data);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 5000);
    } catch {
      setErrorConfirm("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const medicoActual = medicos.find(m => m.id === medicoId);

  const slotsPorDia = (diaOffset: number) => {
    const fecha = new Date(semanaInicio);
    fecha.setDate(fecha.getDate() + diaOffset);
    const fechaStr = formatearFecha(fecha);
    return slots.filter(s => s.fecha === fechaStr);
  };

  const semanaLabel = () => {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 4);
    return `${semanaInicio.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })} – ${fin.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  const handleLogout = () => { logout(); router.replace("/"); };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading || !user) return null;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-surface-container-lowest border-r border-outline-variant z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col">
          <div className="h-16 px-space-md border-b border-outline-variant flex items-center gap-space-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Logo Clínica San Rafael"
              className="h-10 w-10 object-contain rounded-lg shrink-0"
              src="/logoclinica.png"
            />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-primary leading-tight truncate font-bold">
                Clínica San Rafael
              </span>
              <span className="font-caption text-caption text-on-surface-variant truncate">
                Sede San Borja
              </span>
            </div>
          </div>
          <div className="px-space-md py-space-sm">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Módulos Clínicos</span>
          </div>
          <nav className="flex flex-col gap-space-xs px-space-sm">
            {[
              { label: "Agenda", icon: "calendar_month", href: "/agenda", activo: true },
              { label: "Pacientes", icon: "person_search", href: "/pacientes", activo: false },
              { label: "Historia clínica", icon: "clinical_notes", href: "/historia", activo: false },
              { label: "Laboratorio", icon: "chips", href: "/laboratorio", activo: false },
              { label: "Facturación", icon: "receipt_long", href: "/facturacion", activo: false },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.href && item.href !== "#") router.push(item.href);
                }}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left w-full ${
                  item.activo
                    ? "bg-primary-container text-on-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-space-md border-t border-outline-variant bg-surface-container-low flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-tertiary">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span className="font-caption text-caption font-semibold">Servidor Clínico: En línea</span>
          </div>
          <div className="font-caption text-caption text-on-surface-variant">SIGC v4.8.2 · Clínica San Rafael</div>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      <div className="pl-[260px]">

        {/* Header */}
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface-container-lowest border-b border-outline-variant z-40 flex items-center justify-between px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">local_hospital</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">SIGC</span>
            <span className="font-caption text-caption text-outline">&gt;</span>
            <span className="font-label-md text-label-md text-on-surface-variant">Agenda</span>
          </div>
          <div className="hidden md:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container border border-outline-variant rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
            <span className="font-caption text-caption">La sesión se cierra tras 10 min de inactividad</span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="flex flex-col text-right">
                <span className="font-label-md text-label-md text-on-surface leading-tight">{user.nombres} {user.apellidos}</span>
                <span className="font-caption text-caption text-on-surface-variant capitalize">{user.rol}</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <button onClick={handleLogout}
              className="min-h-[44px] px-space-md border border-primary text-primary hover:bg-surface-container-low rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors"
              type="button">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="w-full pt-16 bg-surface min-h-screen">
          <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-md flex flex-col gap-space-lg">

            {/* ── Stepper Header ─────────────────────────────────────────────── */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <button type="button" onClick={() => paso > 1 && setPaso((p) => (p - 1) as 1 | 2 | 3)}
                  className="min-h-[44px] px-space-md bg-surface-container-lowest text-primary rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-40"
                  disabled={paso === 1}>
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  <span>Atrás</span>
                </button>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">Admisión &amp; Consulta Externa</span>
                  <h1 className="font-headline-md text-headline-md text-on-surface">Reservar Cita Médica</h1>
                </div>
              </div>
              <nav aria-label="Progreso de reserva" className="flex items-center gap-space-sm overflow-x-auto py-1">
                {[
                  { n: 1, label: "1. Paciente", icon: "badge" },
                  { n: 2, label: "2. Médico y horario", icon: "stethoscope" },
                  { n: 3, label: "3. Confirmación", icon: "task_alt" },
                ].map((s, i) => (
                  <React.Fragment key={s.n}>
                    {i > 0 && <div className={`w-6 h-[2px] shrink-0 ${paso > i ? "bg-primary" : "bg-outline-variant"}`}></div>}
                    <div className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-label-md text-label-md shrink-0 ${
                      paso === s.n
                        ? "bg-primary-container text-on-primary font-bold shadow-sm"
                        : paso > s.n
                          ? "bg-tertiary-fixed text-tertiary font-semibold"
                          : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {paso > s.n
                        ? <span className="material-symbols-outlined text-[18px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        : <span className="material-symbols-outlined text-[18px]">{s.icon}</span>}
                      <span>{s.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </nav>
            </section>

            {/* ── Toast éxito ───────────────────────────────────────────────── */}
            {toastVisible && (
              <div className="bg-tertiary text-on-tertiary rounded-xl p-space-md shadow-md flex items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[24px] text-tertiary-fixed shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold text-on-tertiary">✓ Cita registrada exitosamente en el sistema</span>
                    <span className="font-caption text-caption text-tertiary-fixed-dim">Folio: {citaRegistrada?.folio}. Auditoría registrada conforme a Ley N.° 29733.</span>
                  </div>
                </div>
                <button onClick={() => setToastVisible(false)} type="button"
                  className="p-1 hover:bg-tertiary-container text-on-tertiary rounded transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* ── Grid principal ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">

              {/* ── Columnas izquierda y central (8 col) ── */}
              <div className="xl:col-span-8 flex flex-col gap-space-lg">

                {/* ═══ PASO 1: Paciente ════════════════════════════════════════ */}
                <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">Paso 1: Identificar Paciente</h2>
                    </div>
                    {paso === 1 && pacienteSeleccionado && (
                      <button type="button" onClick={() => setPaso(2)}
                        className="min-h-[40px] px-space-md bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors">
                        <span>Continuar</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    )}
                  </div>

                  {/* Buscador */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-start">
                    <div className="md:col-span-5">
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="search-patient">Buscar DNI o apellidos</label>
                      <div className="relative">
                        <input
                          className="w-full h-11 pl-10 pr-4 bg-surface-container-low rounded-lg text-body-lg font-body-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          id="search-patient" placeholder="Ej. 70000001 o Torres" type="text"
                          value={busqueda}
                          onChange={e => { setBusqueda(e.target.value); buscarPaciente(e.target.value); }}
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
                      </div>
                      {/* Lista de resultados */}
                      {pacientes.length > 1 && (
                        <ul className="mt-1 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-md max-h-40 overflow-y-auto">
                          {pacientes.map(p => (
                            <li key={p.id}>
                              <button type="button"
                                className="w-full text-left px-space-md py-space-sm text-body-sm hover:bg-surface-container-low transition-colors"
                                onClick={() => { setPacienteSeleccionado(p); setPacientes([]); setBusqueda(p.numero_documento); }}>
                                <span className="font-semibold">{p.apellido_paterno} {p.apellido_materno}, {p.nombres}</span>
                                <span className="ml-2 text-on-surface-variant">DNI {p.numero_documento}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {buscando && <p className="text-caption text-on-surface-variant mt-1">Buscando…</p>}
                    </div>

                    {/* Tarjeta del paciente seleccionado */}
                    {pacienteSeleccionado ? (
                      <div className="md:col-span-7 bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm shadow-sm">
                        <div className="flex items-center gap-space-md">
                          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[28px] text-on-primary">person</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-space-xs flex-wrap">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellido_paterno} {pacienteSeleccionado.apellido_materno}
                              </span>
                            </div>
                            <div className="flex items-center gap-space-md text-on-surface-variant font-caption text-caption mt-0.5">
                              <span>DNI: <strong className="text-on-surface font-label-md">{pacienteSeleccionado.numero_documento}</strong></span>
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => setPacienteSeleccionado(null)}
                          className="text-primary hover:text-on-primary-fixed-variant font-label-sm text-label-sm flex items-center gap-space-xs shrink-0">
                          <span>Cambiar</span>
                          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                        </button>
                      </div>
                    ) : (
                      <div className="md:col-span-7 bg-surface-container-low rounded-xl p-space-md text-caption text-on-surface-variant flex items-center justify-center min-h-[80px]">
                        Busca el paciente por DNI o apellidos
                      </div>
                    )}
                  </div>
                </section>

                {/* ═══ PASO 2: Médico y Horario ════════════════════════════════ */}
                <section className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md transition-opacity ${paso < 2 ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">stethoscope</span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">Paso 2: Médico y Horario de Consulta</h2>
                    </div>
                    {paso === 2 && slotSeleccionado && (
                      <button type="button" onClick={() => setPaso(3)}
                        className="min-h-[40px] px-space-md bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors">
                        <span>Continuar</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    )}
                  </div>

                  {/* Chips de especialidades */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Especialidad médica solicitada
                      </label>
                      <span className="font-caption text-caption text-secondary font-semibold">
                        {medicos.length} médico{medicos.length === 1 ? "" : "s"} disponible{medicos.length === 1 ? "" : "s"} en esta área
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
                      {especialidades.map(e => (
                        <button key={e.id} type="button"
                          onClick={() => { setEspecialidadId(e.id); setMedicoId(null); setSlotSeleccionado(null); }}
                          className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md shrink-0 transition-colors ${
                            especialidadId === e.id
                              ? "bg-primary-container text-on-primary font-bold shadow-sm"
                              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                          }`}>
                          {e.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tarjetas desplegadas de médicos disponibles */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Médicos disponibles en {especialidades.find(e => e.id === especialidadId)?.nombre || "el área"} (Haz clic en un médico para ver su agenda)
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-space-md">
                      {medicos.map(m => {
                        const isSelected = medicoId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => { setMedicoId(m.id); setSlotSeleccionado(null); }}
                            className={`rounded-xl p-space-md shadow-sm relative flex flex-col justify-between cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-primary-container/10 ring-2 ring-primary border-primary shadow-md"
                                : "bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-space-sm min-w-0">
                                {m.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={m.avatarUrl}
                                    alt={`Dr. ${m.nombres} ${m.apellidos}`}
                                    className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0 border border-outline-variant/40"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[28px] text-on-secondary-fixed">stethoscope</span>
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0 pr-2">
                                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate leading-tight">
                                    Dr(a). {m.nombres} {m.apellidos}
                                  </h3>
                                  <span className="font-label-md text-label-md text-primary font-medium truncate mt-0.5">
                                    {m.subespecialidad || m.especialidad}
                                  </span>
                                  <span className="font-caption text-caption text-on-surface-variant mt-0.5">
                                    {m.cmp} {m.rne ? `· ${m.rne}` : ""}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold shrink-0 shadow-sm">
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                  Seleccionado
                                </span>
                              )}
                            </div>

                            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 mt-auto">
                              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm min-w-0">
                                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">meeting_room</span>
                                <span className="truncate text-caption font-medium">{m.consultorio || "Consultorio C-201"}</span>
                              </div>

                              {!isSelected && (
                                <button
                                  type="button"
                                  className="text-primary hover:text-primary-container font-label-sm text-label-sm font-semibold flex items-center gap-0.5 shrink-0"
                                >
                                  <span>Elegir</span>
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendario semanal */}
                  {medicoId && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
                      <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-space-sm">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold">Semana: {semanaLabel()}</span>
                            <span className="font-caption text-caption text-on-surface-variant">Franjas de 30 min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" aria-label="Semana anterior"
                              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container shadow-sm"
                              onClick={() => { const p = new Date(semanaInicio); p.setDate(p.getDate() - 7); setSemanaInicio(p); }}>
                              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button type="button" aria-label="Semana siguiente"
                              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container shadow-sm"
                              onClick={() => { const p = new Date(semanaInicio); p.setDate(p.getDate() + 7); setSemanaInicio(p); }}>
                              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                          </div>
                        </div>

                        {cargandoSlots ? (
                          <div className="text-center py-8 text-on-surface-variant font-caption">Cargando horarios disponibles…</div>
                        ) : (
                          <>
                            {/* Cabecera días */}
                            <div className="grid grid-cols-5 gap-space-xs text-center">
                              {DIAS.map((d, i) => {
                                const fecha = new Date(semanaInicio);
                                fecha.setDate(fecha.getDate() + i);
                                const esDiaSeleccionado = slotSeleccionado
                                  ? slotSeleccionado.fecha === formatearFecha(fecha)
                                  : i === 0;
                                return (
                                  <div key={d} className={`p-1.5 rounded-lg font-label-md text-label-md ${esDiaSeleccionado ? "bg-surface-container text-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant"}`}>
                                    {d} {fecha.getDate()}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Slots */}
                            <div className="grid grid-cols-5 gap-space-xs">
                              {DIAS.map((_, i) => (
                                <div key={i} className="flex flex-col gap-space-xs">
                                  {slotsPorDia(i).map(slot => {
                                    const seleccionado = slotSeleccionado?.inicio === slot.inicio;
                                    return slot.disponible ? (
                                      <button key={slot.inicio} type="button"
                                        onClick={() => setSlotSeleccionado(slot)}
                                        className={`p-2 rounded font-label-sm text-label-sm text-center transition-colors ${
                                          seleccionado
                                            ? "bg-primary-container text-on-primary font-bold shadow-md ring-2 ring-secondary-container"
                                            : "bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary cursor-pointer shadow-sm font-semibold"
                                        }`}>
                                        {seleccionado ? (
                                          <><span className="block">{slot.hora}</span><span className="text-[10px] uppercase font-semibold text-tertiary-fixed">Elegido</span></>
                                        ) : slot.hora}
                                      </button>
                                    ) : (
                                      <div key={slot.inicio}
                                        className="p-2 rounded bg-surface-container-highest text-on-surface-variant/60 font-caption text-caption flex flex-col items-center justify-center cursor-not-allowed">
                                        <span className="line-through">{slot.hora}</span>
                                        <span className="font-label-sm text-[10px] text-outline">Ocupado</span>
                                      </div>
                                    );
                                  })}
                                  {slotsPorDia(i).length === 0 && (
                                    <div className="p-2 text-center text-caption text-on-surface-variant/50">—</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Panel lateral disponibilidad */}
                      <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <span className="material-symbols-outlined text-secondary text-[20px]">event_available</span>
                          <h3 className="font-label-lg text-label-lg font-bold">Próximos horarios libres</h3>
                        </div>
                        <p className="font-caption text-caption text-on-surface-variant">
                          {medicoActual ? `Dr(a). ${medicoActual.nombres} ${medicoActual.apellidos}` : "Médico seleccionado"}
                        </p>
                        <div className="flex flex-col gap-space-xs">
                          {slots.filter(s => s.disponible).slice(0, 5).map(s => (
                            <button key={s.inicio} type="button"
                              onClick={() => setSlotSeleccionado(s)}
                              className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                                <span className="font-label-md text-label-md font-semibold text-on-surface">{s.hora} hrs</span>
                                <span className="font-caption text-caption text-on-surface-variant">
                                  {new Date(s.inicio).toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" })}
                                </span>
                              </div>
                              <span className="font-label-sm text-label-sm text-secondary font-semibold">Elegir</span>
                            </button>
                          ))}
                          {slots.filter(s => s.disponible).length === 0 && !cargandoSlots && (
                            <p className="text-caption text-on-surface-variant">Sin disponibilidad para esta semana.</p>
                          )}
                        </div>
                        <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-space-sm">
                          <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface">Duración por consulta</span>
                            <span className="font-caption text-caption text-on-surface-variant">30 minutos reglamentarios</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* ── Columna derecha: PASO 3 (4 col) ─────────────────────────── */}
              <div className="xl:col-span-4 flex flex-col gap-space-lg">
                <section className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md sticky top-20 transition-opacity ${paso < 3 ? "opacity-60 pointer-events-none" : ""}`}>
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">Paso 3: Confirmación</h2>
                    </div>
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Final</span>
                  </div>

                  {/* Resumen */}
                  <div className="flex flex-col gap-space-xs bg-surface-container-low rounded-xl p-space-md">
                    <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">Resumen de la cita médica</span>
                    <div className="flex flex-col gap-space-sm mt-1">
                      {[
                        { label: "Paciente:", value: pacienteSeleccionado ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellido_paterno} ${pacienteSeleccionado.apellido_materno}` : "—" },
                        { label: "Especialidad:", value: especialidades.find(e => e.id === especialidadId)?.nombre ?? "—" },
                        { label: "Médico Tratante:", value: medicoActual ? `Dr(a). ${medicoActual.nombres} ${medicoActual.apellidos} (${medicoActual.subespecialidad || medicoActual.especialidad})` : "—" },
                        { label: "Consultorio:", value: medicoActual?.consultorio || "Consultorio C-201 (Pabellón C)" },
                        { label: "Fecha y Hora:", value: slotSeleccionado ? new Date(slotSeleccionado.inicio).toLocaleString("es-PE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—", primary: true },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-start text-body-sm font-body-sm">
                          <span className="text-on-surface-variant">{row.label}</span>
                          <span className={`font-semibold text-right ${row.primary ? "text-primary font-bold" : "text-on-surface"}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="block font-label-md text-label-md text-on-surface font-semibold" htmlFor="consult-reason">
                      Motivo de la consulta <span className="text-error font-bold">*</span>
                    </label>
                    <textarea
                      className="w-full p-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner resize-none"
                      id="consult-reason" rows={3} value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                    />
                    <span className="font-caption text-caption text-on-surface-variant">Obligatorio según norma técnica de historia clínica MINSA.</span>
                  </div>

                  {/* Recordatorio */}
                  <div className="flex items-start gap-space-sm bg-surface-container-low/60 p-space-sm rounded-lg">
                    <input checked={recordatorio} onChange={e => setRecordatorio(e.target.checked)}
                      className="w-5 h-5 rounded mt-0.5 accent-primary cursor-pointer" id="send-reminder" type="checkbox" />
                    <label className="font-body-sm text-body-sm text-on-surface cursor-pointer select-none" htmlFor="send-reminder">
                      Enviar recordatorio 24 horas antes por correo y SMS
                    </label>
                  </div>

                  {/* Error confirmación */}
                  {errorConfirm && (
                    <div className="p-3 bg-error-container rounded-lg flex items-start gap-2">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">error</span>
                      <p className="text-caption text-on-error-container">{errorConfirm}</p>
                    </div>
                  )}

                  {/* Botón confirmar */}
                  {!citaRegistrada ? (
                    <button type="button" onClick={confirmarCita}
                      disabled={guardando || !pacienteSeleccionado || !medicoId || !slotSeleccionado || !motivo.trim()}
                      className="w-full min-h-[48px] px-space-lg bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
                      <span>{guardando ? "Registrando…" : "Confirmar cita (Paso 3 de 3)"}</span>
                    </button>
                  ) : (
                    /* Tarjeta de éxito */
                    <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Cita Registrada
                        </span>
                        <span className="font-label-sm text-label-sm font-mono px-space-xs py-0.5 rounded bg-surface-container-lowest text-on-surface font-semibold">
                          {citaRegistrada.folio}
                        </span>
                      </div>
                      <div className="flex flex-col text-body-sm font-body-sm text-on-surface">
                        <p className="font-semibold text-primary">
                          {slotSeleccionado ? new Date(slotSeleccionado.inicio).toLocaleString("es-PE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                        <p className="text-on-surface-variant">{medicoActual ? `Dr(a). ${medicoActual.nombres} ${medicoActual.apellidos} (${medicoActual.especialidad})` : ""}</p>
                        <p className="text-on-surface-variant">Sede San Borja</p>
                      </div>
                      <div className="grid grid-cols-1 gap-space-xs pt-space-xs">
                        <button type="button" onClick={() => { setCitaRegistrada(null); setPaso(1); setSlotSeleccionado(null); setMotivo(""); }}
                          className="w-full min-h-[44px] px-space-md bg-surface-container-lowest text-primary hover:bg-surface-container-low rounded-lg font-label-md text-label-md font-medium flex items-center justify-center gap-space-xs transition-colors">
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          <span>Reservar otra cita</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant font-label-md">Cargando agenda…</div>}>
      <AgendaPageContent />
    </React.Suspense>
  );
}

