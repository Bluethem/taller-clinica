"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { canCreateCitas, isMedico } from "../../lib/nav";

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
  const { user, loading } = useAuth();
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

      // Limpiar y regresar al Paso 1 después de la confirmación satisfactoria
      setTimeout(() => {
        setPaso(1);
        setPacienteSeleccionado(null);
        setBusqueda("");
        setPacientes([]);
        setSlotSeleccionado(null);
        setCitaRegistrada(null);
      }, 3500);

      setTimeout(() => setToastVisible(false), 5500);
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

  const [misCitas, setMisCitas] = useState<Array<{
    id: string;
    inicio: string;
    fin: string;
    estado: string;
    motivo: string | null;
    pacienteId: string;
    pacienteNombres: string;
    pacienteApellidos: string;
    numeroDocumento: string;
  }>>([]);
  const [cargandoMisCitas, setCargandoMisCitas] = useState(false);

  useEffect(() => {
    if (!user || !isMedico(user.rol)) return;
    let active = true;
    setCargandoMisCitas(true);
    apiFetch("/agenda/mis-citas")
      .then(async (r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (active) setMisCitas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setMisCitas([]);
      })
      .finally(() => {
        if (active) setCargandoMisCitas(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
    <div className="w-full min-h-[40vh] flex items-center justify-center text-on-surface-variant font-label-md">
      Cargando…
    </div>
    );
  }

  if (isMedico(user.rol) || !canCreateCitas(user.rol)) {
    return (
      <main className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-md flex flex-col gap-space-lg">
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
          <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">
            Consulta externa
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface">Mis citas</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Citas asignadas a tu usuario. El alta la realiza Admisión (semana demo del wizard).
          </p>
        </section>
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
          {cargandoMisCitas && (
            <p className="p-space-md font-body-md text-on-surface-variant">Cargando citas…</p>
          )}
          {!cargandoMisCitas && misCitas.length === 0 && (
            <p className="p-space-md font-body-md text-on-surface-variant">
              No tienes citas programadas. Verifica que Admisión te haya asignado el turno
              (mismo médico/usuario).
            </p>
          )}
          <ul className="divide-y divide-outline-variant/30">
            {misCitas.map((c) => (
              <li key={c.id} className="px-space-md py-space-md flex items-center justify-between gap-space-md">
                <div>
                  <p className="font-label-lg text-label-lg font-bold">
                    {c.pacienteNombres} {c.pacienteApellidos}
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    DNI {c.numeroDocumento}
                    {c.motivo ? ` · ${c.motivo}` : ""} · {c.estado}
                  </p>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-md text-label-md text-primary font-bold text-right">
                    {new Date(c.inicio).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/historia?pacienteId=${encodeURIComponent(c.pacienteId)}`)
                    }
                    className="px-space-sm py-1 rounded-lg border border-outline-variant font-label-sm text-label-sm"
                  >
                    Historia
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <main className="w-full bg-surface min-h-screen">
          <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-md flex flex-col gap-space-lg">

            {/* ── Stepper Header ─────────────────────────────────────────────── */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <button type="button" onClick={() => {
                    if (paso === 1) router.push("/dashboard");
                    else setPaso((p) => (p - 1) as 1 | 2 | 3);
                  }}
                  className="min-h-[44px] px-space-md bg-surface-container-lowest text-primary rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm">
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

            {/* ── Vista por Pasos (Wizard) ──────────────────────────────────────── */}
            <div className="w-full">
              {/* ══════════════════════════════════════════════════════════════════
                  PASO 1: Identificar Paciente
              ══════════════════════════════════════════════════════════════════ */}
              {paso === 1 && (
                <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-lg max-w-4xl mx-auto">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">badge</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Paso 1: Identificar Paciente</h2>
                        <p className="text-caption text-on-surface-variant">Ingrese el número de documento o apellidos del paciente para validar sus datos</p>
                      </div>
                    </div>
                  </div>

                  {/* Campo de búsqueda */}
                  <div className="flex flex-col gap-space-sm">
                    <label className="block font-label-md text-label-md text-on-surface font-semibold" htmlFor="search-patient">
                      Buscar DNI o apellidos del paciente
                    </label>
                    <div className="relative max-w-lg">
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl text-body-lg font-body-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner border border-outline-variant/40"
                        id="search-patient"
                        placeholder="Ej. 70000001 o Torres"
                        type="text"
                        value={busqueda}
                        onChange={e => {
                          setBusqueda(e.target.value);
                          buscarPaciente(e.target.value);
                        }}
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-[22px]">search</span>
                    </div>

                    {/* Lista desplegable si hay varias coincidencias */}
                    {pacientes.length > 1 && (
                      <ul className="max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg max-h-48 overflow-y-auto divide-y divide-outline-variant/20 z-10">
                        {pacientes.map(p => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="w-full text-left px-space-md py-space-sm text-body-md hover:bg-surface-container-low transition-colors flex items-center justify-between"
                              onClick={() => {
                                setPacienteSeleccionado(p);
                                setPacientes([]);
                                setBusqueda(p.numero_documento);
                              }}
                            >
                              <span className="font-semibold text-on-surface">{p.apellido_paterno} {p.apellido_materno}, {p.nombres}</span>
                              <span className="text-caption text-on-surface-variant font-mono bg-surface-container px-2 py-0.5 rounded">DNI {p.numero_documento}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {buscando && <p className="text-caption text-secondary font-medium">Buscando paciente en el padrón…</p>}
                  </div>

                  {/* Ficha / Tarjeta de datos del paciente */}
                  {pacienteSeleccionado ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-space-md">
                        <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[32px]">person</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellido_paterno} {pacienteSeleccionado.apellido_materno}
                          </span>
                          <div className="flex items-center gap-space-sm flex-wrap text-caption text-on-surface-variant mt-1">
                            <span className="bg-surface-container-lowest px-2.5 py-1 rounded-md border border-outline-variant/40 font-mono text-on-surface font-semibold">
                              {pacienteSeleccionado.tipo_documento || "DNI"}: {pacienteSeleccionado.numero_documento}
                            </span>
                            {pacienteSeleccionado.fecha_nacimiento && (
                              <span className="bg-surface-container-lowest px-2.5 py-1 rounded-md border border-outline-variant/40">
                                F. Nac: {pacienteSeleccionado.fecha_nacimiento}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-tertiary font-semibold text-caption">
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              Historia Clínica Habilitada
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-space-sm self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPacienteSeleccionado(null);
                            setBusqueda("");
                          }}
                          className="px-space-md py-2 text-on-surface-variant hover:text-error hover:bg-surface-container rounded-xl font-label-md text-label-md transition-colors"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaso(2)}
                          className="min-h-[46px] px-space-lg bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center gap-space-xs shadow-md transition-all active:scale-[0.99]"
                        >
                          <span>Continuar al Paso 2</span>
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-low rounded-2xl p-space-xl text-center flex flex-col items-center justify-center border border-dashed border-outline-variant">
                      <span className="material-symbols-outlined text-outline text-[40px] mb-2">person_search</span>
                      <p className="font-label-lg text-label-lg text-on-surface font-semibold">Ingrese un DNI para seleccionar al paciente</p>
                      <p className="font-caption text-caption text-on-surface-variant mt-1">
                        Ejemplo de prueba: DNI <button type="button" onClick={() => { setBusqueda("70000001"); buscarPaciente("70000001"); }} className="underline font-bold text-primary">70000001</button> (Mariana Torres Quispe)
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  PASO 2: Médico y Horario de Consulta
              ══════════════════════════════════════════════════════════════════ */}
              {paso === 2 && (
                <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-lg max-w-6xl mx-auto animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-outline-variant/30 pb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">stethoscope</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Paso 2: Elegir Médico y Horario</h2>
                        <p className="text-caption text-on-surface-variant">
                          Paciente seleccionado: <strong className="text-on-surface font-semibold">{pacienteSeleccionado?.nombres} {pacienteSeleccionado?.apellido_paterno}</strong> (DNI: {pacienteSeleccionado?.numero_documento})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-sm">
                      <button
                        type="button"
                        onClick={() => setPaso(1)}
                        className="px-space-md py-2 border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                      >
                        Cambiar paciente
                      </button>
                      <button
                        type="button"
                        disabled={!slotSeleccionado}
                        onClick={() => setPaso(3)}
                        className="min-h-[44px] px-space-lg bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center gap-space-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Ir a Confirmación</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Selector de Especialidades */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Especialidad médica solicitada
                      </label>
                      <span className="font-caption text-caption text-secondary font-semibold">
                        {medicos.length} médico{medicos.length === 1 ? "" : "s"} disponible{medicos.length === 1 ? "" : "s"} en esta área
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
                      {especialidades.map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setEspecialidadId(e.id);
                            setMedicoId(null);
                            setSlotSeleccionado(null);
                          }}
                          className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md shrink-0 transition-colors ${
                            especialidadId === e.id
                              ? "bg-primary-container text-on-primary font-bold shadow-sm"
                              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          {e.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listado de Médicos disponibles */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Médicos disponibles en {especialidades.find(e => e.id === especialidadId)?.nombre || "el área"}
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                      {medicos.map(m => {
                        const isSelected = medicoId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setMedicoId(m.id);
                              setSlotSeleccionado(null);
                            }}
                            className={`rounded-2xl p-space-md shadow-sm flex flex-col justify-between cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-primary-container/10 ring-2 ring-primary border-primary shadow-md"
                                : "bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant"
                            }`}
                          >
                            <div className="flex items-start gap-space-sm mb-3">
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
                              <div className="flex flex-col min-w-0 pr-1">
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

                            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 mt-auto">
                              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm min-w-0">
                                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">meeting_room</span>
                                <span className="truncate text-caption font-medium">{m.consultorio || "Consultorio C-201"}</span>
                              </div>

                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold shrink-0 shadow-sm">
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                  Seleccionado
                                </span>
                              ) : (
                                <span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-0.5 shrink-0">
                                  <span>Elegir</span>
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendario de Horarios Disponibles */}
                  {medicoId && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md pt-space-xs">
                      <div className="lg:col-span-8 bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-space-md border border-outline-variant/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-space-sm">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold">Semana: {semanaLabel()}</span>
                            <span className="font-caption text-caption text-on-surface-variant">Franjas de 30 min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Semana anterior"
                              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container shadow-sm"
                              onClick={() => {
                                const p = new Date(semanaInicio);
                                p.setDate(p.getDate() - 7);
                                setSemanaInicio(p);
                              }}
                            >
                              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Semana siguiente"
                              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container shadow-sm"
                              onClick={() => {
                                const p = new Date(semanaInicio);
                                p.setDate(p.getDate() + 7);
                                setSemanaInicio(p);
                              }}
                            >
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
                                  <div
                                    key={d}
                                    className={`p-1.5 rounded-lg font-label-md text-label-md ${
                                      esDiaSeleccionado ? "bg-surface-container text-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant"
                                    }`}
                                  >
                                    {d} {fecha.getDate()}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Grilla de Slots */}
                            <div className="grid grid-cols-5 gap-space-xs">
                              {DIAS.map((_, i) => (
                                <div key={i} className="flex flex-col gap-space-xs">
                                  {slotsPorDia(i).map(slot => {
                                    const seleccionado = slotSeleccionado?.inicio === slot.inicio;
                                    return slot.disponible ? (
                                      <button
                                        key={slot.inicio}
                                        type="button"
                                        onClick={() => setSlotSeleccionado(slot)}
                                        className={`p-2 rounded-xl font-label-sm text-label-sm text-center transition-all ${
                                          seleccionado
                                            ? "bg-primary-container text-on-primary font-bold shadow-md ring-2 ring-primary"
                                            : "bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary cursor-pointer shadow-xs font-semibold"
                                        }`}
                                      >
                                        {seleccionado ? (
                                          <>
                                            <span className="block">{slot.hora}</span>
                                            <span className="text-[10px] uppercase font-semibold text-tertiary-fixed">Elegido</span>
                                          </>
                                        ) : (
                                          slot.hora
                                        )}
                                      </button>
                                    ) : (
                                      <div
                                        key={slot.inicio}
                                        className="p-2 rounded-xl bg-surface-container-highest text-on-surface-variant/50 font-caption text-caption flex flex-col items-center justify-center cursor-not-allowed"
                                      >
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

                      {/* Horarios libres y duración */}
                      <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <span className="material-symbols-outlined text-secondary text-[20px]">event_available</span>
                          <h3 className="font-label-lg text-label-lg font-bold">Próximos horarios libres</h3>
                        </div>
                        <p className="font-caption text-caption text-on-surface-variant">
                          {medicoActual ? `Dr(a). ${medicoActual.nombres} ${medicoActual.apellidos}` : "Médico seleccionado"}
                        </p>
                        <div className="flex flex-col gap-space-xs">
                          {slots.filter(s => s.disponible).slice(0, 5).map(s => (
                            <button
                              key={s.inicio}
                              type="button"
                              onClick={() => setSlotSeleccionado(s)}
                              className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors"
                            >
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
                        <div className="bg-surface-container p-space-sm rounded-xl flex items-center gap-space-sm mt-auto">
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
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  PASO 3: Confirmación de Cita
              ══════════════════════════════════════════════════════════════════ */}
              {paso === 3 && (
                <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-lg max-w-3xl mx-auto animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">task_alt</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Paso 3: Confirmar Cita Médica</h2>
                        <p className="text-caption text-on-surface-variant">Verifique los detalles finales de la atención antes de emitir la reserva</p>
                      </div>
                    </div>
                    <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Paso Final</span>
                  </div>

                  {/* Resumen Detallado */}
                  <div className="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-space-sm border border-outline-variant/20">
                    <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-bold">Resumen de la cita médica</span>
                    <div className="flex flex-col gap-space-sm mt-1 divide-y divide-outline-variant/20">
                      {[
                        { label: "Paciente:", value: pacienteSeleccionado ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellido_paterno} ${pacienteSeleccionado.apellido_materno}` : "—" },
                        { label: "Documento:", value: pacienteSeleccionado ? `DNI ${pacienteSeleccionado.numero_documento}` : "—" },
                        { label: "Especialidad:", value: especialidades.find(e => e.id === especialidadId)?.nombre ?? "—" },
                        { label: "Médico Tratante:", value: medicoActual ? `Dr(a). ${medicoActual.nombres} ${medicoActual.apellidos} (${medicoActual.subespecialidad || medicoActual.especialidad})` : "—" },
                        { label: "Consultorio:", value: medicoActual?.consultorio || "Consultorio C-201 (Pabellón C)" },
                        { label: "Fecha y Hora:", value: slotSeleccionado ? new Date(slotSeleccionado.inicio).toLocaleString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—", primary: true },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-start pt-2 text-body-md font-body-md">
                          <span className="text-on-surface-variant font-medium">{row.label}</span>
                          <span className={`font-semibold text-right ${row.primary ? "text-primary font-bold text-headline-xs" : "text-on-surface"}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivo de Consulta */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="block font-label-md text-label-md text-on-surface font-semibold" htmlFor="consult-reason">
                      Motivo de la consulta <span className="text-error font-bold">*</span>
                    </label>
                    <textarea
                      className="w-full p-3.5 bg-surface-container-low rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner resize-none border border-outline-variant/30"
                      id="consult-reason"
                      rows={3}
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                    />
                    <span className="font-caption text-caption text-on-surface-variant">Obligatorio según norma técnica de historia clínica MINSA.</span>
                  </div>

                  {/* Recordatorio */}
                  <div className="flex items-start gap-space-sm bg-surface-container-low/60 p-space-md rounded-xl border border-outline-variant/20">
                    <input
                      checked={recordatorio}
                      onChange={e => setRecordatorio(e.target.checked)}
                      className="w-5 h-5 rounded mt-0.5 accent-primary cursor-pointer"
                      id="send-reminder"
                      type="checkbox"
                    />
                    <label className="font-body-md text-body-md text-on-surface cursor-pointer select-none" htmlFor="send-reminder">
                      Enviar recordatorio automático 24 horas antes por correo electrónico y SMS
                    </label>
                  </div>

                  {/* Error si falla */}
                  {errorConfirm && (
                    <div className="p-3.5 bg-error-container text-on-error-container rounded-xl flex items-start gap-2">
                      <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                      <p className="text-caption font-medium">{errorConfirm}</p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex items-center justify-between gap-space-md pt-space-xs">
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="px-space-lg py-3 border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-label-md text-label-md transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Modificar médico / horario</span>
                    </button>

                    <button
                      type="button"
                      onClick={confirmarCita}
                      disabled={guardando || !pacienteSeleccionado || !medicoId || !slotSeleccionado || !motivo.trim()}
                      className="min-h-[48px] px-space-xl bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
                      <span>{guardando ? "Registrando cita…" : "Confirmar Cita Médica"}</span>
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
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

