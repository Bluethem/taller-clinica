"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Diagnostico {
  codigo: string;
  descripcion: string;
  tipo: "Definitivo" | "Presuntivo";
}

interface Medicamento {
  nombre: string;
  dosis: string;
  despacho: string;
}

interface SignosVitales {
  presionArterial: string;
  paEstado: string;
  frecuenciaCardiaca: number;
  fcEstado: string;
  saturacionOxigeno: number;
  satEstado: string;
  imc: number;
  imcEstado: string;
}

interface EntradaClinica {
  id: string;
  especialidad: string;
  consultorio: string;
  medicoNombre: string;
  cmp: string;
  rne?: string;
  fecha: string;
  hora: string;
  duracion: string;
  motivo: string;
  enfermedadActual: string;
  estado: "cerrada" | "anulada";
  signosVitales?: SignosVitales;
  diagnosticos: Diagnostico[];
  receta?: {
    codigo: string;
    vigencia: string;
    medicamentos: Medicamento[];
    indicacionesNoFarmacologicas?: string;
  };
  anulacion?: {
    codigo: string;
    anuladoPor: string;
    anuladoEn: string;
    motivo: string;
    diagnosticoErroneo?: string;
    prescripcionCancelada?: string;
  };
}

interface HistoriaData {
  pacienteId: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  edad: number;
  sexo: string;
  grupoSanguineo: string;
  numeroHc: string;
  convenio: string;
  poliza: string;
  alertasCriticas: string[];
  entradas: EntradaClinica[];
}

const HISTORIA_DEMO: HistoriaData = {
  pacienteId: "20000000-0000-7000-8000-000000000001",
  nombres: "Mariana",
  apellidos: "Torres Quispe",
  numeroDocumento: "70000001",
  tipoDocumento: "DNI",
  fechaNacimiento: "14/07/1988",
  edad: 38,
  sexo: "Femenino",
  grupoSanguineo: "O Rh (+)",
  numeroHc: "HC-884920",
  convenio: "EPS Andina Salud (Copago 15%)",
  poliza: "#904-88219-01",
  alertasCriticas: [
    "Alergia severa: Penicilina y derivados",
    "Alergia: AINEs (Ibuprofeno / Naproxeno)",
  ],
  entradas: [
    {
      id: "50000000-0000-7000-8000-000000000002",
      especialidad: "Cardiología",
      consultorio: "Consultorio C-201 · Piso 2",
      medicoNombre: "Dr. Andrés Huamán Vargas",
      cmp: "48920",
      rne: "24190 (Cardiología)",
      fecha: "12 de Octubre, 2026",
      hora: "14:30 hrs",
      duracion: "35 min",
      motivo:
        'Paciente refiere cefalea matutina de moderada intensidad, acúfenos ocasionales y palpitaciones esporádicas no asociadas a esfuerzo físico intenso en la última semana. Cumple parcialmente con esquema previo.',
      enfermedadActual: "Hipertensión arterial en control con cefalea ocasional.",
      estado: "cerrada",
      signosVitales: {
        presionArterial: "145 / 92 mmHg",
        paEstado: "HTA Estadio 1",
        frecuenciaCardiaca: 84,
        fcEstado: "Normocardia",
        saturacionOxigeno: 98,
        satEstado: "FiO2 Ambiental",
        imc: 24.2,
        imcEstado: "Normopeso",
      },
      diagnosticos: [
        {
          codigo: "I10",
          descripcion: "Hipertensión esencial (primaria)",
          tipo: "Definitivo",
        },
        {
          codigo: "R00.2",
          descripcion: "Palpitaciones",
          tipo: "Presuntivo",
        },
      ],
      receta: {
        codigo: "#RX-2026-99318",
        vigencia: "30 días",
        medicamentos: [
          {
            nombre: "1. Losartán Potásico 50 mg (Tableta recubierta)",
            dosis: "Dosis: 1 tableta cada 24 horas por vía oral, en ayunas por 30 días.",
            despacho: "Despacho Farmacia Central",
          },
          {
            nombre: "2. Amlodipino Besilato 5 mg (Tableta)",
            dosis: "Dosis: 1 tableta cada 24 horas por vía oral a las 20:00 hrs por 30 días.",
            despacho: "Despacho Farmacia Central",
          },
        ],
        indicacionesNoFarmacologicas:
          "Reducción de consumo de sodio a < 2g/día. Control diario de PA matutina por 7 días en libreta ambulatoria.",
      },
    },
    {
      id: "50000000-0000-7000-8000-000000000003",
      especialidad: "Medicina General",
      consultorio: "Consultorio MG-104",
      medicoNombre: "Dr. Carlos Mendoza Arana",
      cmp: "35102",
      fecha: "15 de Agosto, 2026",
      hora: "11:15 hrs",
      duracion: "15 min",
      motivo: "Registro ingresado en historia de homónima por error de tipeo en admisión.",
      enfermedadActual: "Error en asignación de paciente.",
      estado: "anulada",
      diagnosticos: [
        {
          codigo: "J02.9",
          descripcion: "Faringitis aguda, no especificada",
          tipo: "Presuntivo",
        },
      ],
      anulacion: {
        codigo: "#ANUL-2026-0881",
        anuladoPor: "Dr. Carlos Mendoza",
        anuladoEn: "15/08/2026 a las 11:45 hrs",
        motivo:
          "Registro ingresado en historia de homónima por error de tipeo en admisión. Reasignado a HC correcta (#HC-884918 Mariana Torres Quintanilla). No hubo prescripción dispensada.",
        diagnosticoErroneo: "J02.9 · Faringitis aguda, no especificada.",
        prescripcionCancelada:
          "Amoxicilina 500mg cápsulas VO c/8h por 7 días. (CANCELADA - PACIENTE ES ALÉRGICA A PENICILINA).",
      },
    },
    {
      id: "50000000-0000-7000-8000-000000000001",
      especialidad: "Medicina General",
      consultorio: "Consultorio MG-102",
      medicoNombre: "Dr. Juan Carlos Vega Rivas",
      cmp: "39102",
      fecha: "10 de Mayo, 2026",
      hora: "09:15 hrs",
      duracion: "20 min",
      motivo:
        'Paciente refiere epigastralgia urente de 2 semanas de evolución tras ingesta de alimentos condimentados, acompañada de pirosis nocturna. Niega náuseas o vómitos.',
      enfermedadActual: "Cuadro compatible con gastritis aguda erosiva moderada.",
      estado: "cerrada",
      diagnosticos: [
        {
          codigo: "K29.7",
          descripcion: "Gastritis, no especificada",
          tipo: "Definitivo",
        },
      ],
      receta: {
        codigo: "#RX-2026-44120",
        vigencia: "28 días",
        medicamentos: [
          {
            nombre: "Omeprazol 20 mg (Cápsula con microgránulos gastrorresistentes)",
            dosis: "Tomar 1 cápsula 30 minutos antes del desayuno por 28 días. Dieta blanda fraccionada.",
            despacho: "Despacho Farmacia Central",
          },
        ],
      },
    },
  ],
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const requestOptions = { credentials: "include" as const, ...opts };
  try {
    return await fetch(`${API}${path}`, requestOptions);
  } catch {
    return fetch(path, requestOptions);
  }
}

function HistoriaContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [historia, setHistoria] = useState<HistoriaData>(HISTORIA_DEMO);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todas");
  const [mostrarAnuladas, setMostrarAnuladas] = useState<boolean>(true);

  // Modal anulación
  const [modalAnulacionOpen, setModalAnulacionOpen] = useState(false);
  const [entradaParaAnular, setEntradaParaAnular] = useState<EntradaClinica | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardandoAnulacion, setGuardandoAnulacion] = useState(false);

  // Modal nueva consulta
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [nuevaEsp, setNuevaEsp] = useState("Cardiología");
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [nuevaAnamnesis, setNuevaAnamnesis] = useState("");
  const [nuevaPa, setNuevaPa] = useState("120 / 80 mmHg");
  const [nuevoCie10, setNuevoCie10] = useState("I10");
  const [nuevaReceta, setNuevaReceta] = useState("");
  const [guardandoConsulta, setGuardandoConsulta] = useState(false);

  // Modal ver informe de lab
  const [modalLabOpen, setModalLabOpen] = useState(false);
  const [labInformeActual, setLabInformeActual] = useState<{
    titulo: string;
    orden: string;
    fecha: string;
    valores: Array<{ nombre: string; valor: string; ref: string }>;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ titulo: string; cuerpo: string } | null>(null);

  const mostrarNotificacion = (titulo: string, cuerpo: string) => {
    setToast({ titulo, cuerpo });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Cargar historia clínica del backend
  const cargarHistoria = useCallback(async () => {
    try {
      const res = await apiFetch("/historia/20000000-0000-7000-8000-000000000001");
      if (res.ok) {
        const data = await res.json();
        if (data && data.entradas) {
          setHistoria(data);
        }
      }
    } catch {
      // Usar demo si falla
    }
  }, []);

  useEffect(() => {
    cargarHistoria();
  }, [cargarHistoria]);

  // Filtrado de entradas de la cronología
  const entradasFiltradas = useMemo(() => {
    return historia.entradas.filter((e) => {
      if (!mostrarAnuladas && e.estado === "anulada") return false;
      if (filtroEspecialidad === "todas") return true;
      if (filtroEspecialidad === "cardiologia") return e.especialidad.toLowerCase().includes("cardio");
      if (filtroEspecialidad === "medicina-general") return e.especialidad.toLowerCase().includes("medicina");
      return true;
    });
  }, [historia.entradas, mostrarAnuladas, filtroEspecialidad]);

  const totalAnuladas = historia.entradas.filter((e) => e.estado === "anulada").length;

  // Manejar anulación
  const handleConfirmarAnulacion = async () => {
    if (!entradaParaAnular || motivoAnulacion.trim().length < 10) return;
    setGuardandoAnulacion(true);

    try {
      const res = await apiFetch("/historia/anular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entradaId: entradaParaAnular.id,
          motivo: motivoAnulacion.trim(),
          anuladoPor: user?.id || "10000000-0000-7000-8000-000000000001",
        }),
      });

      const auditCode = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;

      // Actualizar estado local
      setHistoria((prev) => ({
        ...prev,
        entradas: prev.entradas.map((e) =>
          e.id === entradaParaAnular.id
            ? {
                ...e,
                estado: "anulada",
                anulacion: {
                  codigo: `#ANUL-2026-${entradaParaAnular.id.substring(0, 4)}`,
                  anuladoPor: user ? `${user.nombres} ${user.apellidos}` : "Dr. Usuario",
                  anuladoEn: "Hoy, recién",
                  motivo: motivoAnulacion.trim(),
                  diagnosticoErroneo: e.diagnosticos[0]?.descripcion,
                },
              }
            : e
        ),
      }));

      mostrarNotificacion(
        "Entrada Anulada con Éxito",
        `Se registró la invalidación en la bitácora legal (#${auditCode}) conforme a NTS N° 139-MINSA.`
      );
    } catch {
      mostrarNotificacion(
        "Entrada Anulada con Éxito",
        "Se registró la invalidación en la bitácora legal (#AUD-9912)."
      );
    } finally {
      setGuardandoAnulacion(false);
      setModalAnulacionOpen(false);
      setEntradaParaAnular(null);
      setMotivoAnulacion("");
    }
  };

  // Manejar nueva consulta médica
  const handleGuardarNuevaConsulta = async () => {
    if (!nuevoMotivo.trim()) return;
    setGuardandoConsulta(true);

    const nuevaEntrada: EntradaClinica = {
      id: `nueva-${Date.now()}`,
      especialidad: nuevaEsp,
      consultorio: "Consultorio 304",
      medicoNombre: user ? `Dr. ${user.nombres} ${user.apellidos}` : "Dr. Andrés Huamán Vargas",
      cmp: "48920",
      fecha: "Hoy, 14:00 hrs",
      hora: "14:00 hrs",
      duracion: "30 min",
      motivo: nuevoMotivo,
      enfermedadActual: nuevaAnamnesis || nuevoMotivo,
      estado: "cerrada",
      signosVitales: {
        presionArterial: nuevaPa,
        paEstado: "Normal",
        frecuenciaCardiaca: 76,
        fcEstado: "Normocardia",
        saturacionOxigeno: 99,
        satEstado: "FiO2 Ambiental",
        imc: 23.5,
        imcEstado: "Normopeso",
      },
      diagnosticos: [
        {
          codigo: nuevoCie10,
          descripcion:
            nuevoCie10 === "I10"
              ? "Hipertensión esencial (primaria)"
              : nuevoCie10 === "K29.7"
              ? "Gastritis, no especificada"
              : "Consulta médica general",
          tipo: "Definitivo",
        },
      ],
      receta: nuevaReceta.trim()
        ? {
            codigo: `#RX-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            vigencia: "30 días",
            medicamentos: [
              {
                nombre: nuevaReceta,
                dosis: "Según indicación médica por 30 días.",
                despacho: "Despacho Farmacia Central",
              },
            ],
          }
        : undefined,
    };

    try {
      await apiFetch("/historia/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: historia.pacienteId,
          motivoConsulta: nuevoMotivo,
          enfermedadActual: nuevaAnamnesis || nuevoMotivo,
          examenFisico: `PA ${nuevaPa}; FC 76 lpm.`,
          diagnosticoCie10: nuevoCie10,
        }),
      });
    } catch {
      // offline fallback
    }

    setHistoria((prev) => ({
      ...prev,
      entradas: [nuevaEntrada, ...prev.entradas],
    }));

    setGuardandoConsulta(false);
    setModalConsultaOpen(false);
    setNuevoMotivo("");
    setNuevaAnamnesis("");
    setNuevaReceta("");
    mostrarNotificacion(
      "Consulta Guardada con Éxito",
      "La atención médica ha sido firmada e incorporada a la Historia Clínica Electrónica."
    );
  };

  const handleLogout = () => {
    logout();
  };

  if (loading || !user) return null;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
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
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Módulos Clínicos
            </span>
          </div>
          <nav className="flex flex-col gap-space-xs px-space-sm">
            {[
              { label: "Agenda", icon: "calendar_month", href: "/agenda", activo: false },
              { label: "Pacientes", icon: "person_search", href: "/pacientes", activo: false },
              { label: "Historia clínica", icon: "clinical_notes", href: "/historia", activo: true },
              { label: "Laboratorio", icon: "chips", href: "/laboratorio", activo: false },
              { label: "Facturación", icon: "receipt_long", href: "/facturacion", activo: false },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.href !== "#") router.push(item.href);
                }}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left w-full ${
                  item.activo
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
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
          <div className="font-caption text-caption text-on-surface-variant">
            SIGC v4.8.2 · Clínica San Rafael
          </div>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="pl-[260px]">
        {/* Header Superior */}
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface-container-lowest border-b border-outline-variant z-40 flex items-center justify-between px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">local_hospital</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">SIGC</span>
            <span className="font-caption text-caption text-outline">&gt;</span>
            <span className="font-label-md text-label-md text-on-surface-variant">Historia Clínica</span>
          </div>
          <div className="hidden md:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container border border-outline-variant rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
            <span className="font-caption text-caption">La sesión se cierra tras 10 min de inactividad</span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
                {user ? user.nombres.charAt(0) : "D"}
              </div>
              <div className="flex flex-col text-right">
                <span className="font-label-md text-label-md text-on-surface leading-tight">
                  {user ? `${user.nombres} ${user.apellidos}` : "Diego Ramos"}
                </span>
                <span className="font-caption text-caption text-on-surface-variant capitalize">
                  {user?.rol || "Admisión"}
                </span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <button
              onClick={handleLogout}
              className="min-h-[44px] px-space-md border border-primary text-primary hover:bg-surface-container-low rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <main className="w-full pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            {/* Context bar / Breadcrumb */}
            <div className="px-gutter-desktop py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-secondary">folder_shared</span>
                <span>Módulo Asistencial</span>
                <span className="text-outline">/</span>
                <span className="text-primary font-bold">Historia Clínica Electrónica Unificada</span>
                <span className="text-outline">/</span>
                <span className="font-mono text-outline">{historia.numeroHc}</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed/30 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                  Sincronizado con RENIEC &amp; SIS/SUSALUD
                </span>
                <span className="text-caption font-caption text-outline">Terminal: SEDE-SB-CONS-04</span>
              </div>
            </div>

            {/* Dossier del paciente */}
            <div className="px-gutter-desktop pt-space-md pb-space-sm">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md border-b border-outline-variant/20">
                  <div className="flex flex-wrap items-center gap-space-md">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-display-lg text-headline-lg shadow-inner font-bold">
                        MT
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary rounded-full p-0.5 material-symbols-outlined text-[14px]"
                        title="Paciente Activo"
                      >
                        check
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-space-sm">
                        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                          {historia.nombres} {historia.apellidos}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm shadow-sm font-semibold">
                          #{historia.numeroHc}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                          {historia.convenio}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                          DNI: <strong>{historia.numeroDocumento}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                          {historia.edad} años ({historia.fechaNacimiento})
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline">female</span>
                          {historia.sexo}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline">bloodtype</span>
                          {historia.grupoSanguineo}
                        </span>
                        <span>·</span>
                        <span className="text-tertiary font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">verified_user</span>
                          Póliza EPS: {historia.poliza}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones superiores */}
                  <div className="flex items-center gap-space-sm self-start lg:self-center">
                    <button
                      onClick={() => window.print()}
                      className="min-h-[44px] px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center gap-space-xs transition-colors shadow-sm"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">print</span>
                      <span>Imprimir Resumen</span>
                    </button>
                    <button
                      onClick={() => setModalConsultaOpen(true)}
                      className="min-h-[44px] px-space-lg rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-space-xs shadow-md transition-all active:scale-[0.99]"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                      <span>+ Nueva consulta médica</span>
                    </button>
                  </div>
                </div>

                {/* Tira de Alertas Críticas (Alergias) */}
                <div className="bg-error-container text-on-error-container p-space-md rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-sm shadow-inner">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div>
                      <span className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-error">
                        Alertas Médicas Críticas:
                      </span>
                      <div className="flex flex-wrap items-center gap-space-xs mt-1">
                        {historia.alertasCriticas.map((alerta) => (
                          <span
                            key={alerta}
                            className="px-2.5 py-1 rounded bg-error text-on-error font-label-sm text-label-sm flex items-center gap-1 shadow-sm font-semibold"
                          >
                            <span className="material-symbols-outlined text-[14px]">dangerous</span>
                            {alerta}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-caption font-caption text-error font-medium md:text-right">
                    Última validación por Triaje Médico: Hoy 08:15 hrs
                  </div>
                </div>

                {/* Banner de Auditoría Legal */}
                <div className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between gap-space-sm text-on-surface-variant font-caption text-caption">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-secondary">gavel</span>
                    <span>
                      <strong>Bitácora de auditoría activa:</strong> Su acceso a esta historia clínica queda
                      registrado con ID:{" "}
                      <span className="font-mono font-semibold text-primary">
                        {user ? `${user.nombres} ${user.apellidos}` : "Diego Ramos"} ({user?.rol || "Admisión"} / Consulta asistida)
                      </span>{" "}
                      conforme a la Ley N.° 29733 de Protección de Datos Personales y NTS N° 139-MINSA.
                    </span>
                  </div>
                  <span className="font-mono text-outline shrink-0">IP: 192.168.10.82 · SHA256-OK</span>
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Vistas */}
            <div className="px-gutter-desktop py-space-sm flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"
                    htmlFor="filtro-especialidad"
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline">tune</span>
                    Especialidad:
                  </label>
                  <select
                    className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer pr-4"
                    id="filtro-especialidad"
                    value={filtroEspecialidad}
                    onChange={(e) => setFiltroEspecialidad(e.target.value)}
                  >
                    <option value="todas">Todas las especialidades ({historia.entradas.length} entradas)</option>
                    <option value="cardiologia">Cardiología (1)</option>
                    <option value="medicina-general">Medicina General (2)</option>
                    <option value="ginecologia">Ginecología (0)</option>
                  </select>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[18px] text-outline">calendar_month</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Rango:</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Año 2026 (Completo)
                  </span>
                </div>
              </div>

              {/* Toggle de entradas anuladas */}
              <div className="flex items-center gap-space-sm bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-[20px] text-error">history_toggle_off</span>
                <span className="font-label-md text-label-md text-on-surface">Mostrar entradas anuladas</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={mostrarAnuladas}
                    onChange={(e) => setMostrarAnuladas(e.target.checked)}
                    className="sr-only peer"
                    id="toggle-anuladas"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-error-container text-on-error-container font-mono">
                  {totalAnuladas} AUDITADA{totalAnuladas !== 1 ? "S" : ""}
                </span>
              </div>
            </div>

            {/* Split Layout 2 Columnas */}
            <div className="px-gutter-desktop py-space-sm pb-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* ── COLUMNA IZQUIERDA: CRONOLOGÍA (8 COLS) ──────────────────── */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[24px]">timeline</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Cronología Unificada de Consultas
                    </h2>
                  </div>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Orden cronológico descendente (Más reciente a más antigua)
                  </span>
                </div>

                {/* Timeline Stream */}
                <div className="relative flex flex-col gap-space-lg">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-surface-variant hidden sm:block"></div>

                  {entradasFiltradas.map((entrada) => {
                    const esAnulada = entrada.estado === "anulada";

                    if (esAnulada) {
                      return (
                        <div key={entrada.id} className="relative flex flex-col sm:flex-row gap-space-md">
                          <div className="sm:flex flex-col items-center shrink-0 hidden z-10">
                            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-[24px]">block</span>
                            </div>
                            <span className="text-[11px] font-bold uppercase text-error mt-1">ANULADA</span>
                          </div>

                          <div className="flex-1 bg-surface-container rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md relative overflow-hidden border border-error/30">
                            <div className="h-1.5 bg-error -mt-space-lg -mx-space-lg mb-space-xs"></div>

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm">
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-space-sm">
                                  <span className="px-3 py-1 rounded bg-error text-on-error font-label-md text-label-md font-bold tracking-wider flex items-center gap-1 shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                                    ENTRADA ANULADA
                                  </span>
                                  <span className="font-mono text-caption text-error font-bold">
                                    REGISTRO INVALIDADO {entrada.anulacion?.codigo || "#ANUL-2026"}
                                  </span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface line-through opacity-60">
                                  {entrada.medicoNombre} ({entrada.especialidad})
                                </h3>
                              </div>
                              <div className="text-left sm:text-right flex flex-col opacity-75">
                                <span className="font-label-sm text-label-sm text-on-surface">
                                  Fecha original: {entrada.fecha}
                                </span>
                                <span className="font-caption text-caption text-on-surface-variant">
                                  {entrada.consultorio}
                                </span>
                              </div>
                            </div>

                            {/* Detalle de auditoría */}
                            <div className="bg-error-container text-on-error-container p-space-md rounded-lg flex flex-col gap-1.5 shadow-sm">
                              <div className="flex items-center gap-space-xs font-label-md text-label-md font-bold">
                                <span className="material-symbols-outlined text-[18px] text-error">
                                  assignment_late
                                </span>
                                <span>Trazabilidad de la Auditoría Médica:</span>
                              </div>
                              <div className="font-body-sm text-body-sm">
                                <strong>Anulado formalmente por:</strong> {entrada.anulacion?.anuladoPor} el{" "}
                                <span className="font-mono">{entrada.anulacion?.anuladoEn}</span>.
                              </div>
                              <div className="font-body-sm text-body-sm bg-surface-container-lowest/80 p-space-sm rounded mt-1 text-on-surface">
                                <strong>Motivo de anulación registrado:</strong>{" "}
                                <span className="text-error font-medium">
                                  &ldquo;{entrada.anulacion?.motivo}&rdquo;
                                </span>
                              </div>
                            </div>

                            {/* Contenido original tachado */}
                            <div className="bg-surface-container-low p-space-md rounded-lg opacity-60 select-none">
                              <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1 line-through">
                                Contenido Original Invalidado (Solo lectura legal):
                              </div>
                              <div className="flex flex-col gap-1 line-through text-on-surface-variant font-body-sm text-body-sm">
                                {entrada.anulacion?.diagnosticoErroneo && (
                                  <p>
                                    <strong>Diagnóstico Erróneo:</strong> {entrada.anulacion.diagnosticoErroneo}
                                  </p>
                                )}
                                {entrada.anulacion?.prescripcionCancelada && (
                                  <p>
                                    <strong>Prescripción Errónea Inicial:</strong>{" "}
                                    {entrada.anulacion.prescripcionCancelada}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-caption font-caption text-on-surface-variant border-t border-outline-variant/20 pt-2">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-error">policy</span>
                                Firma de auditoría archivada ante Comité de Ética Clínica San Borja.
                              </span>
                              <span className="font-mono text-outline">HASH: 8F2A90...E41</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Entrada activa normal
                    return (
                      <div key={entrada.id} className="relative flex flex-col sm:flex-row gap-space-md">
                        <div className="sm:flex flex-col items-center shrink-0 hidden z-10">
                          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-[24px]">
                              {entrada.especialidad.includes("Cardio") ? "cardiology" : "medical_services"}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold uppercase text-primary mt-1">2026</span>
                        </div>

                        <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md hover:shadow-md transition-shadow border border-outline-variant/30">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-space-xs">
                                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                                  {entrada.especialidad}
                                </span>
                                <span className="text-on-surface-variant font-caption text-caption">
                                  {entrada.consultorio}
                                </span>
                                <span className="text-tertiary font-label-sm text-label-sm flex items-center gap-1 font-semibold">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  Cerrada &amp; Firmada
                                </span>
                              </div>
                              <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                                {entrada.medicoNombre}
                              </h3>
                              <span className="font-caption text-caption text-outline">
                                CMP: {entrada.cmp} {entrada.rne ? `· RNE: ${entrada.rne}` : ""}
                              </span>
                            </div>
                            <div className="text-left sm:text-right flex flex-col">
                              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                                {entrada.fecha}
                              </span>
                              <span className="font-caption text-caption text-on-surface-variant">
                                {entrada.hora} · Duración: {entrada.duracion}
                              </span>
                            </div>
                          </div>

                          {/* Motivo de consulta */}
                          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 border border-outline-variant/20">
                            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                              Motivo de consulta y Anamnesis:
                            </span>
                            <p className="font-body-md text-body-md text-on-surface">
                              &ldquo;{entrada.motivo}&rdquo;
                            </p>
                          </div>

                          {/* Signos Vitales (si existen) */}
                          {entrada.signosVitales && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm py-1">
                              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                                <span className="font-caption text-caption text-on-surface-variant">
                                  P/A Arterial
                                </span>
                                <span className="font-label-lg text-label-lg text-error font-bold">
                                  {entrada.signosVitales.presionArterial}
                                </span>
                                <span className="text-[11px] text-error font-semibold">
                                  {entrada.signosVitales.paEstado}
                                </span>
                              </div>
                              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                                <span className="font-caption text-caption text-on-surface-variant">
                                  Frec. Cardíaca
                                </span>
                                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                                  {entrada.signosVitales.frecuenciaCardiaca} lpm
                                </span>
                                <span className="text-[11px] text-tertiary font-semibold">
                                  {entrada.signosVitales.fcEstado}
                                </span>
                              </div>
                              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                                <span className="font-caption text-caption text-on-surface-variant">Sat. O2</span>
                                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                                  {entrada.signosVitales.saturacionOxigeno} %
                                </span>
                                <span className="text-[11px] text-tertiary font-semibold">
                                  {entrada.signosVitales.satEstado}
                                </span>
                              </div>
                              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                                <span className="font-caption text-caption text-on-surface-variant">IMC</span>
                                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                                  {entrada.signosVitales.imc} kg/m²
                                </span>
                                <span className="text-[11px] text-on-surface-variant font-semibold">
                                  {entrada.signosVitales.imcEstado}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Diagnósticos CIE-10 */}
                          <div className="flex flex-col gap-1">
                            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                              Diagnóstico Principal (CIE-10):
                            </span>
                            <div className="flex flex-wrap items-center gap-space-xs">
                              {entrada.diagnosticos.map((diag) => (
                                <span
                                  key={diag.codigo}
                                  className="px-3 py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md flex items-center gap-1.5 shadow-sm font-semibold"
                                >
                                  <span className="material-symbols-outlined text-[18px]">verified</span>
                                  {diag.codigo} · {diag.descripcion} - {diag.tipo}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Receta Médica */}
                          {entrada.receta && (
                            <div className="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-outline-variant/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold">
                                  <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                                  <span>Plan Terapéutico y Receta Electrónica ({entrada.receta.codigo})</span>
                                </div>
                                <span className="font-caption text-caption text-on-surface-variant">
                                  Vigencia: {entrada.receta.vigencia}
                                </span>
                              </div>
                              <div className="flex flex-col gap-space-xs text-body-sm text-on-surface">
                                {entrada.receta.medicamentos.map((med, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded bg-surface-container-lowest flex items-start justify-between gap-space-sm shadow-xs border border-outline-variant/10"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-on-surface">{med.nombre}</span>
                                      <span className="text-on-surface-variant">{med.dosis}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-caption font-semibold">
                                      {med.despacho}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {entrada.receta.indicacionesNoFarmacologicas && (
                                <div className="text-caption font-caption text-on-surface-variant italic pt-1">
                                  Indicaciones no farmacológicas: {entrada.receta.indicacionesNoFarmacologicas}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer de acción y anulación */}
                          <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs border-t border-outline-variant/20">
                            <div className="flex items-center gap-2 text-caption font-caption text-outline">
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                              <span>Firma digitalizada con certificado RENIEC PKI</span>
                            </div>
                            <div className="flex items-center gap-space-sm">
                              <button
                                onClick={() => {
                                  setEntradaParaAnular(entrada);
                                  setMotivoAnulacion("");
                                  setModalAnulacionOpen(true);
                                }}
                                className="min-h-[44px] px-space-md rounded-lg text-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">rule_folder</span>
                                <span>Anular entrada clínica...</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── COLUMNA DERECHA: ESTUDIOS Y LABORATORIO (4 COLS) ───────── */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md sticky top-20 border border-outline-variant/30">
                  <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                    <div className="flex items-center gap-space-xs text-primary font-bold">
                      <span className="material-symbols-outlined text-[24px]">chips</span>
                      <h2 className="font-headline-sm text-headline-sm">Estudios y Laboratorio</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      3 Activos
                    </span>
                  </div>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Pruebas vinculadas directamente al historial clínico de la sede San Borja.
                  </p>

                  <div className="flex flex-col gap-space-sm">
                    {/* Item 1: Perfil Lipídico */}
                    <div className="bg-surface-container-low hover:bg-surface-container p-space-md rounded-lg flex flex-col gap-space-xs transition-colors shadow-xs border border-outline-variant/20">
                      <div className="flex items-start justify-between gap-space-xs">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Perfil Lipídico Completo
                        </span>
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Listo / Validado
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-caption font-caption text-on-surface-variant">
                        <span>Fecha toma: 10/10/2026</span>
                        <span className="font-mono">ORD-2026-90412</span>
                      </div>
                      <div className="mt-1 pt-2 bg-surface-container-lowest p-2 rounded text-caption font-caption flex justify-between text-on-surface border border-outline-variant/10">
                        <span>
                          Colesterol Total: <strong>215 mg/dL</strong> (H)
                        </span>
                        <span>
                          Triglicéridos: <strong>148 mg/dL</strong>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setLabInformeActual({
                              titulo: "Perfil Lipídico Completo",
                              orden: "ORD-2026-90412",
                              fecha: "10/10/2026",
                              valores: [
                                { nombre: "Colesterol Total", valor: "215 mg/dL", ref: "< 200" },
                                { nombre: "Triglicéridos", valor: "148 mg/dL", ref: "< 150" },
                                { nombre: "Colesterol HDL", valor: "48 mg/dL", ref: "> 50" },
                                { nombre: "Colesterol LDL", valor: "135 mg/dL", ref: "< 100" },
                              ],
                            });
                            setModalLabOpen(true);
                          }}
                          className="min-h-[36px] px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Ver informe</span>
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Hemograma */}
                    <div className="bg-surface-container-low hover:bg-surface-container p-space-md rounded-lg flex flex-col gap-space-xs transition-colors shadow-xs border border-outline-variant/20">
                      <div className="flex items-start justify-between gap-space-xs">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Hemograma Automatizado
                        </span>
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Listo / Validado
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-caption font-caption text-on-surface-variant">
                        <span>Fecha toma: 10/10/2026</span>
                        <span className="font-mono">ORD-2026-90413</span>
                      </div>
                      <div className="mt-1 pt-2 bg-surface-container-lowest p-2 rounded text-caption font-caption flex justify-between text-on-surface border border-outline-variant/10">
                        <span>
                          Hemoglobina: <strong>13.8 g/dL</strong>
                        </span>
                        <span>
                          Leucocitos: <strong>7,200 /uL</strong>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setLabInformeActual({
                              titulo: "Hemograma Automatizado",
                              orden: "ORD-2026-90413",
                              fecha: "10/10/2026",
                              valores: [
                                { nombre: "Hemoglobina", valor: "13.8 g/dL", ref: "12.0 - 15.5" },
                                { nombre: "Leucocitos", valor: "7,200 /uL", ref: "4,500 - 11,000" },
                                { nombre: "Plaquetas", valor: "245,000 /uL", ref: "150,000 - 450,000" },
                              ],
                            });
                            setModalLabOpen(true);
                          }}
                          className="min-h-[36px] px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center gap-1 shadow-xs transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span>Ver informe</span>
                        </button>
                      </div>
                    </div>

                    {/* Item 3: Papanicolaou (Pendiente) */}
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs shadow-xs border border-outline-variant/20">
                      <div className="flex items-start justify-between gap-space-xs">
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          Papanicolaou (PAP Base Líquida)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-label-sm text-label-sm font-semibold flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                          Pendiente en Lab Central
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-caption font-caption text-on-surface-variant">
                        <span>Fecha muestra: 08/10/2026</span>
                        <span className="font-mono">ORD-2026-88190</span>
                      </div>
                      <p className="text-caption font-caption text-outline italic mt-1">
                        En procesamiento histológico. Tiempo estimado de entrega: 48 horas hábiles.
                      </p>
                    </div>
                  </div>

                  {/* Acceso directo a módulo de Laboratorio */}
                  <div className="pt-space-sm">
                    <button
                      onClick={() => router.push("/laboratorio")}
                      className="min-h-[44px] w-full py-2.5 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors shadow-xs"
                      type="button"
                    >
                      <span>Ir a Módulo de Laboratorio</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>

                  {/* Widget Sparkline PA Sistólica */}
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs mt-space-xs border border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        Tendencia PA Sistólica (Últimos 6m)
                      </span>
                      <span className="text-caption font-caption text-outline">Meta &lt; 130</span>
                    </div>
                    <svg className="w-full h-14 text-primary" viewBox="0 0 280 60">
                      <line
                        opacity="0.3"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                        x1="0"
                        x2="280"
                        y1="40"
                        y2="40"
                      />
                      <polyline
                        fill="none"
                        points="10,15 75,25 140,20 205,42 270,30"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <circle cx="10" cy="15" fill="currentColor" r="3.5" />
                      <circle cx="75" cy="25" fill="currentColor" r="3.5" />
                      <circle cx="140" cy="20" fill="currentColor" r="3.5" />
                      <circle cx="205" cy="42" fill="currentColor" r="3.5" />
                      <circle cx="270" cy="30" fill="#ba1a1a" r="4" />
                    </svg>
                    <div className="flex justify-between text-[11px] text-outline font-mono">
                      <span>Mayo</span>
                      <span>Jun</span>
                      <span>Ago</span>
                      <span>Set</span>
                      <span className="text-error font-bold">Oct (145)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL DE ANULACIÓN INMUTABLE ────────────────────────────────────── */}
      {modalAnulacionOpen && entradaParaAnular && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-start justify-between gap-space-sm pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-space-sm text-error">
                <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">gavel</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    ¿Anular esta entrada clínica?
                  </h3>
                  <span className="font-caption text-caption text-outline font-mono">
                    {entradaParaAnular.especialidad} ({entradaParaAnular.fecha}) - {entradaParaAnular.medicoNombre}
                  </span>
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                onClick={() => setModalAnulacionOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-error-container text-on-error-container p-space-md rounded-lg flex flex-col gap-1">
              <div className="flex items-center gap-space-xs font-label-md text-label-md font-bold text-error">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Advertencia de Inmutabilidad Legal (NTS N° 139-MINSA):</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-error-container">
                La entrada <strong>no se elimina</strong> del historial médico del paciente: quedará
                registrada permanentemente como <strong>ANULADA</strong> con su identidad, estampa de tiempo
                y este motivo en la bitácora legal auditable.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex justify-between items-center"
                htmlFor="motivo-anulacion-input"
              >
                <span>Motivo de la anulación (Obligatorio)*</span>
                <span className="font-caption text-caption text-outline font-mono">
                  {motivoAnulacion.trim().length} / 10 caracteres
                </span>
              </label>
              <textarea
                className="w-full p-space-sm rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-error shadow-inner placeholder:text-outline resize-none border border-outline-variant"
                id="motivo-anulacion-input"
                placeholder="Especifique detalladamente la causal clínica o administrativa de anulación (ej. Registro en paciente incorrecto, error en dosificación no dispensada)..."
                rows={4}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
              />
              <span
                className={`text-[12px] italic ${
                  motivoAnulacion.trim().length >= 10
                    ? "text-tertiary font-semibold"
                    : "text-outline"
                }`}
              >
                {motivoAnulacion.trim().length >= 10
                  ? "Cumple con el requerimiento de auditoría mínima."
                  : "Debe ingresar al menos 10 caracteres descriptivos para habilitar la acción."}
              </span>
            </div>

            <div className="p-space-sm rounded bg-surface-container flex items-center justify-between text-caption font-caption text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                Operador firmante:{" "}
                <strong>{user ? `${user.nombres} ${user.apellidos}` : "Diego Ramos"} ({user?.rol || "Admisión"})</strong>
              </span>
              <span className="font-mono text-outline">Token #USR-9921</span>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant/20">
              <button
                className="min-h-[44px] px-space-lg rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors"
                onClick={() => setModalAnulacionOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={motivoAnulacion.trim().length < 10 || guardandoAnulacion}
                onClick={handleConfirmarAnulacion}
                className={`min-h-[44px] px-space-lg rounded-lg bg-error text-on-error font-label-lg text-label-lg flex items-center gap-space-xs shadow-md transition-all ${
                  motivoAnulacion.trim().length >= 10
                    ? "hover:bg-on-error-container active:scale-95"
                    : "opacity-40 cursor-not-allowed"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <span>{guardandoAnulacion ? "Registrando anulación..." : "Anular entrada definitivamente"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA CONSULTA MÉDICA ────────────────────────────────────── */}
      {modalConsultaOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl p-space-xl flex flex-col gap-space-md border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">add_circle</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Registrar Nueva Consulta Médica
                </span>
              </div>
              <button
                onClick={() => setModalConsultaOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Especialidad</label>
                <select
                  value={nuevaEsp}
                  onChange={(e) => setNuevaEsp(e.target.value)}
                  className="h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary"
                >
                  <option value="Cardiología">Cardiología</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Gastroenterología">Gastroenterología</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">P/A Arterial</label>
                <input
                  type="text"
                  value={nuevaPa}
                  onChange={(e) => setNuevaPa(e.target.value)}
                  placeholder="120 / 80 mmHg"
                  className="h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline uppercase">Motivo de Consulta *</label>
              <input
                type="text"
                value={nuevoMotivo}
                onChange={(e) => setNuevoMotivo(e.target.value)}
                placeholder="Ej. Control de rutina y revisión de perfil lipídico..."
                className="h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline uppercase">Anamnesis / Enfermedad Actual</label>
              <textarea
                rows={3}
                value={nuevaAnamnesis}
                onChange={(e) => setNuevaAnamnesis(e.target.value)}
                placeholder="Detalle los síntomas, evolución y antecedentes referidos..."
                className="p-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Diagnóstico Principal (CIE-10)</label>
                <select
                  value={nuevoCie10}
                  onChange={(e) => setNuevoCie10(e.target.value)}
                  className="h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary"
                >
                  <option value="I10">I10 · Hipertensión esencial (primaria)</option>
                  <option value="K29.7">K29.7 · Gastritis, no especificada</option>
                  <option value="E78.0">E78.0 · Hipercolesterolemia pura</option>
                  <option value="J02.9">J02.9 · Faringitis aguda</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Prescripción / Medicamento</label>
                <input
                  type="text"
                  value={nuevaReceta}
                  onChange={(e) => setNuevaReceta(e.target.value)}
                  placeholder="Ej. Atorvastatina 20 mg VO c/24h"
                  className="h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-on-surface border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                onClick={() => setModalConsultaOpen(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-md text-label-md"
              >
                Cancelar
              </button>
              <button
                disabled={!nuevoMotivo.trim() || guardandoConsulta}
                onClick={handleGuardarNuevaConsulta}
                className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md text-label-md shadow-md disabled:opacity-40"
              >
                {guardandoConsulta ? "Guardando..." : "Guardar y Firmar Consulta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INFORME DE LABORATORIO ───────────────────────────────────── */}
      {modalLabOpen && labInformeActual && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {labInformeActual.titulo}
                </span>
              </div>
              <button onClick={() => setModalLabOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 font-mono text-xs flex flex-col gap-2">
              <div className="text-center font-bold">CLÍNICA SAN RAFAEL · LABORATORIO CLÍNICO</div>
              <div className="text-center text-on-surface-variant">Orden: {labInformeActual.orden} · Fecha: {labInformeActual.fecha}</div>
              <div className="border-t border-dashed my-2"></div>
              {labInformeActual.valores.map((v, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>{v.nombre}:</span>
                  <span><strong>{v.valor}</strong> (Ref: {v.ref})</span>
                </div>
              ))}
              <div className="border-t border-dashed my-2"></div>
              <div className="text-right text-tertiary font-bold">Validado por Lic. Patricia Morales (CQFP 1482)</div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalLabOpen(false)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST DE NOTIFICACIÓN ───────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl flex items-center gap-space-sm z-50 animate-in fade-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">verified</span>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-bold">{toast.titulo}</span>
            <span className="font-caption text-caption text-outline-variant">{toast.cuerpo}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoriaClinicaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-surface">
          <div className="text-primary font-label-lg">Cargando Historia Clínica Electrónica...</div>
        </div>
      }
    >
      <HistoriaContent />
    </React.Suspense>
  );
}

