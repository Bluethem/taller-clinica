"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface PacienteDirectorio {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  iniciales: string;
  edad: number;
  sexo: "Femenino" | "Masculino";
  tipoDocumento: string;
  numeroDocumento: string;
  numeroHc: string;
  seguro: string;
  seguroClase: string;
  ultimaAtencion: {
    especialidad: string;
    medico: string;
  };
  estado: string;
  estadoClase: string;
  telefono: string;
  email: string;
  direccion: string;
  alergias: string;
  diagnosticoReciente: string;
  medicoTratante: string;
}

const PACIENTES_BASE: PacienteDirectorio[] = [
  {
    id: "20000000-0000-7000-8000-000000000001",
    nombres: "Mariana",
    apellidos: "Torres Quispe",
    nombreCompleto: "Mariana Torres Quispe",
    iniciales: "MT",
    edad: 38,
    sexo: "Femenino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000001",
    numeroHc: "HC-884920",
    seguro: "EPS Andina Salud",
    seguroClase: "bg-red-50 text-red-700 border-red-200",
    ultimaAtencion: {
      especialidad: "Cardiología",
      medico: "Dr. Andrés Huamán Torres",
    },
    estado: "Cita Agendada",
    estadoClase: "bg-blue-100 text-blue-800",
    telefono: "900000001",
    email: "mariana.torres@example.pe",
    direccion: "Av. Ficticia 101, San Borja",
    alergias: "Alergia a penicilina",
    diagnosticoReciente: "I10 - Hipertensión esencial (primaria)",
    medicoTratante: "Dr. Andrés Huamán Torres",
  },
  {
    id: "20000000-0000-7000-8000-000000000002",
    nombres: "Luis Alberto",
    apellidos: "Gutiérrez Ñahui",
    nombreCompleto: "Luis Alberto Gutiérrez Ñahui",
    iniciales: "LG",
    edad: 51,
    sexo: "Masculino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000002",
    numeroHc: "HC-700002",
    seguro: "Particular",
    seguroClase: "bg-slate-100 text-slate-700 border-slate-200",
    ultimaAtencion: {
      especialidad: "Cardiología",
      medico: "Dr. Andrés Huamán Torres",
    },
    estado: "Cita Agendada",
    estadoClase: "bg-blue-100 text-blue-800",
    telefono: "900000002",
    email: "luis.gutierrez@example.pe",
    direccion: "Jr. Imaginario 202, Surquillo",
    alergias: "Ninguna registrada",
    diagnosticoReciente: "E78.5 - Dislipidemia, no especificada",
    medicoTratante: "Dr. Andrés Huamán Torres",
  },
  {
    id: "20000000-0000-7000-8000-000000000003",
    nombres: "Carmen Rosa",
    apellidos: "Díaz Alva",
    nombreCompleto: "Carmen Rosa Díaz Alva",
    iniciales: "CD",
    edad: 34,
    sexo: "Femenino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000003",
    numeroHc: "HC-700003",
    seguro: "EPS Vida Plena",
    seguroClase: "bg-blue-50 text-blue-700 border-blue-200",
    ultimaAtencion: {
      especialidad: "Medicina General",
      medico: "Dra. Lucía Paredes Vega",
    },
    estado: "Atendido",
    estadoClase: "bg-slate-100 text-slate-700",
    telefono: "900000003",
    email: "carmen.diaz@example.pe",
    direccion: "Calle Demo 303, San Borja",
    alergias: "Ninguna registrada",
    diagnosticoReciente: "K21.9 - Reflujo gastroesofágico",
    medicoTratante: "Dra. Lucía Paredes Vega",
  },
  {
    id: "20000000-0000-7000-8000-000000000004",
    nombres: "José Miguel",
    apellidos: "Palomino Cruz",
    nombreCompleto: "José Miguel Palomino Cruz",
    iniciales: "JP",
    edad: 57,
    sexo: "Masculino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000004",
    numeroHc: "HC-700004",
    seguro: "SOAT Central Seguros",
    seguroClase: "bg-purple-50 text-purple-700 border-purple-200",
    ultimaAtencion: {
      especialidad: "Medicina General",
      medico: "Dra. Lucía Paredes Vega",
    },
    estado: "Activo",
    estadoClase: "bg-emerald-100 text-emerald-800",
    telefono: "900000004",
    email: "jose.palomino@example.pe",
    direccion: "Av. Prueba 404, La Victoria",
    alergias: "Ninguna registrada",
    diagnosticoReciente: "E11.9 - Diabetes mellitus tipo 2",
    medicoTratante: "Dra. Lucía Paredes Vega",
  },
  {
    id: "20000000-0000-7000-8000-000000000005",
    nombres: "Ana Lucía",
    apellidos: "Salas Bedoya",
    nombreCompleto: "Ana Lucía Salas Bedoya",
    iniciales: "AS",
    edad: 31,
    sexo: "Femenino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000005",
    numeroHc: "HC-700005",
    seguro: "Seguros Costa Azul",
    seguroClase: "bg-sky-50 text-sky-700 border-sky-200",
    ultimaAtencion: {
      especialidad: "Medicina General",
      medico: "Dra. Lucía Paredes Vega",
    },
    estado: "Cita Agendada",
    estadoClase: "bg-blue-100 text-blue-800",
    telefono: "900000005",
    email: "ana.salas@example.pe",
    direccion: "Psje. Test 505, Miraflores",
    alergias: "Alergia a mariscos",
    diagnosticoReciente: "R51 - Cefalea",
    medicoTratante: "Dra. Lucía Paredes Vega",
  },
  {
    id: "20000000-0000-7000-8000-000000000006",
    nombres: "Pedro Pablo",
    apellidos: "Cáceres Núñez",
    nombreCompleto: "Pedro Pablo Cáceres Núñez",
    iniciales: "PC",
    edad: 45,
    sexo: "Masculino",
    tipoDocumento: "DNI",
    numeroDocumento: "70000006",
    numeroHc: "HC-700006",
    seguro: "Particular",
    seguroClase: "bg-slate-100 text-slate-700 border-slate-200",
    ultimaAtencion: {
      especialidad: "Medicina General",
      medico: "Dra. Lucía Paredes Vega",
    },
    estado: "Cita Agendada",
    estadoClase: "bg-blue-100 text-blue-800",
    telefono: "900000006",
    email: "pedro.caceres@example.pe",
    direccion: "Av. Modelo 606, San Isidro",
    alergias: "Ninguna registrada",
    diagnosticoReciente: "Z00.1 - Control de salud de rutina",
    medicoTratante: "Dra. Lucía Paredes Vega",
  },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const requestOptions = { credentials: "include" as const, ...opts };
  try {
    return await fetch(`${API}${path}`, requestOptions);
  } catch {
    return fetch(path, requestOptions);
  }
}

function PacientesContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pacientes, setPacientes] = useState<PacienteDirectorio[]>(PACIENTES_BASE);
  const [selectedId, setSelectedId] = useState<string>("20000000-0000-7000-8000-000000000001");
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroRapido, setFiltroRapido] = useState<string>("todos");
  const [filtroSeguro, setFiltroSeguro] = useState<string>("todos");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const PAGE_SIZE = 10;

  // Modal registrar nuevo paciente
  const [modalNuevoOpen, setModalNuevoOpen] = useState<boolean>(false);
  const [nuevoDni, setNuevoDni] = useState<string>("");
  const [nuevoNombres, setNuevoNombres] = useState<string>("");
  const [nuevoPaterno, setNuevoPaterno] = useState<string>("");
  const [nuevoMaterno, setNuevoMaterno] = useState<string>("");
  const [nuevoNacimiento, setNuevoNacimiento] = useState<string>("1995-05-12");
  const [nuevoSexo, setNuevoSexo] = useState<"M" | "F">("F");
  const [nuevoTelefono, setNuevoTelefono] = useState<string>("");
  const [nuevoEmail, setNuevoEmail] = useState<string>("");
  const [nuevoDireccion, setNuevoDireccion] = useState<string>("");
  const [nuevoSeguro, setNuevoSeguro] = useState<string>("Rímac Seguros");
  const [nuevoAlergias, setNuevoAlergias] = useState<string>("");
  const [guardando, setGuardando] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ titulo: string; cuerpo: string } | null>(null);

  const mostrarNotificacion = (titulo: string, cuerpo: string) => {
    setToast({ titulo, cuerpo });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Cargar lista desde backend
  const cargarPacientes = useCallback(async () => {
    try {
      const res = await apiFetch("/pacientes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPacientes(data);
        }
      }
    } catch {
      // Usar base offline
    }
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  // Paciente seleccionado para la ficha lateral
  const pacienteSeleccionado = useMemo(() => {
    return pacientes.find((p) => p.id === selectedId) || pacientes[0] || PACIENTES_BASE[0];
  }, [pacientes, selectedId]);

  // Filtrado de pacientes
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      // Búsqueda por texto
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const match =
          p.nombreCompleto.toLowerCase().includes(q) ||
          p.numeroDocumento.includes(q) ||
          p.numeroHc.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filtro por estado
      if (filtroRapido === "atendidos" && p.estado !== "Atendido") return false;
      if (filtroRapido === "agendados" && !p.estado.toLowerCase().includes("cita") && !p.estado.toLowerCase().includes("agendada")) return false;

      // Filtro por seguro
      if (filtroSeguro !== "todos" && !p.seguro.toLowerCase().includes(filtroSeguro.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [pacientes, busqueda, filtroRapido, filtroSeguro]);

  // Resetear a página 1 al filtrar
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRapido, filtroSeguro]);

  const totalPacientes = pacientesFiltrados.length;
  const totalPaginas = Math.ceil(totalPacientes / PAGE_SIZE) || 1;
  const pacientesPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * PAGE_SIZE;
    return pacientesFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [pacientesFiltrados, paginaActual]);

  // Guardar nuevo paciente
  const handleGuardarNuevoPaciente = async () => {
    if (!nuevoDni.trim() || !nuevoNombres.trim() || !nuevoPaterno.trim()) {
      alert("Por favor complete los campos obligatorios: DNI, Nombres y Apellido Paterno.");
      return;
    }
    setGuardando(true);

    const payload = {
      tipoDocumento: "DNI" as const,
      numeroDocumento: nuevoDni.trim(),
      nombres: nuevoNombres.trim(),
      apellidoPaterno: nuevoPaterno.trim(),
      apellidoMaterno: nuevoMaterno.trim(),
      fechaNacimiento: nuevoNacimiento,
      sexo: nuevoSexo,
      telefono: nuevoTelefono.trim() || "+51 900 000 000",
      email: nuevoEmail.trim() || `${nuevoNombres.toLowerCase().replace(/\s+/g, "")}@ejemplo.pe`,
      direccion: nuevoDireccion.trim() || "Sede San Borja",
      seguro: nuevoSeguro,
      alergias: nuevoAlergias.trim() || "Ninguna registrada",
      creadoPor: user?.id || "10000000-0000-7000-8000-000000000001",
    };

    const birthYear = new Date(nuevoNacimiento).getFullYear();
    const edad = new Date().getFullYear() - birthYear;
    const nuevoItem: PacienteDirectorio = {
      id: `pac-${Date.now()}`,
      nombres: payload.nombres,
      apellidos: `${payload.apellidoPaterno} ${payload.apellidoMaterno}`.trim(),
      nombreCompleto: `${payload.nombres} ${payload.apellidoPaterno} ${payload.apellidoMaterno}`.trim(),
      iniciales: `${payload.nombres.charAt(0)}${payload.apellidoPaterno.charAt(0)}`.toUpperCase(),
      edad,
      sexo: payload.sexo === "M" ? "Masculino" : "Femenino",
      tipoDocumento: "DNI",
      numeroDocumento: payload.numeroDocumento,
      numeroHc: `2026-${payload.numeroDocumento.substring(payload.numeroDocumento.length - 5)}`,
      seguro: payload.seguro,
      seguroClase: "bg-red-50 text-red-700 border-red-200",
      ultimaAtencion: {
        especialidad: "Medicina General",
        medico: "Admisión General",
      },
      estado: "Cita Agendada",
      estadoClase: "bg-blue-100 text-blue-800",
      telefono: payload.telefono,
      email: payload.email,
      direccion: payload.direccion,
      alergias: payload.alergias,
      diagnosticoReciente: "Admisión e ingreso a clínica",
      medicoTratante: "Consultorios externos",
    };

    try {
      const res = await apiFetch("/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await cargarPacientes();
      }
    } catch {
      // fallback
    }

    setPacientes((prev) => [nuevoItem, ...prev]);
    setSelectedId(nuevoItem.id);
    setGuardando(false);
    setModalNuevoOpen(false);

    // Reset campos
    setNuevoDni("");
    setNuevoNombres("");
    setNuevoPaterno("");
    setNuevoMaterno("");
    setNuevoTelefono("");
    setNuevoEmail("");
    setNuevoDireccion("");
    setNuevoAlergias("");

    mostrarNotificacion(
      "Paciente Registrado con Éxito",
      `Se generó la Historia Clínica #${nuevoItem.numeroHc} para ${nuevoItem.nombreCompleto}.`
    );
  };

  if (loading || !user) {
    return (
    <div className="w-full min-h-[40vh] flex items-center justify-center text-on-surface-variant font-label-md">
      Cargando…
    </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* Main Module Content */}
          <main className="p-8 space-y-6 flex-1">
            {/* Header Module Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
                  Administración &amp; Historia Clínica Ambulatoria
                </p>
                <h2 className="text-2xl font-extrabold text-slate-800">Directorio de Pacientes</h2>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                  type="button"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Exportar Reporte</span>
                </button>
                {(user?.rol === "admision" || user?.rol === "administrador") && (
                  <button
                    onClick={() => setModalNuevoOpen(true)}
                    className="px-4 py-2 bg-[#1a446c] text-white rounded-lg text-xs font-semibold hover:bg-[#133556] transition shadow-sm flex items-center gap-2"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    <span>+ Registrar Nuevo Paciente</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Overview Panel (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Pacientes Registrados</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{pacientes.length}</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Registrados en base de datos</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-[#1a446c] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Historias Clínicas Activas</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{pacientes.length}</h3>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1">Sede San Borja (100% digitalizadas)</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Bar and Quick Category Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a446c] focus:border-transparent transition"
                    placeholder="Buscar por DNI, N° de Historia Clínica o apellidos..."
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {}}
                  className="px-6 py-2.5 bg-[#1a446c] text-white rounded-lg text-sm font-semibold hover:bg-[#133556] transition shadow-sm"
                  type="button"
                >
                  Buscar
                </button>
              </div>

              {/* Status Filters (Chips) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Filtro rápido:</span>
                  <button
                    onClick={() => setFiltroRapido("todos")}
                    className={`px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                      filtroRapido === "todos"
                        ? "font-semibold bg-[#1a446c] text-white shadow-sm"
                        : "font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Todos ({pacientes.length})
                  </button>
                  <button
                    onClick={() => setFiltroRapido("agendados")}
                    className={`px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                      filtroRapido === "agendados"
                        ? "font-semibold bg-[#1a446c] text-white shadow-sm"
                        : "font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Citas programadas ({pacientes.filter(p => p.estado.toLowerCase().includes('cita') || p.estado.toLowerCase().includes('agendada')).length})
                  </button>
                  <button
                    onClick={() => setFiltroRapido("atendidos")}
                    className={`px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                      filtroRapido === "atendidos"
                        ? "font-semibold bg-[#1a446c] text-white shadow-sm"
                        : "font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Atendidos ({pacientes.filter(p => p.estado.toLowerCase().includes('atendido')).length})
                  </button>
                </div>

                {/* Dropdowns */}
                <div className="flex items-center gap-2">
                  <select
                    value={filtroSeguro}
                    onChange={(e) => setFiltroSeguro(e.target.value)}
                    className="text-xs border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-600 focus:ring-blue-500"
                  >
                    <option value="todos">Todos los Seguros</option>
                    <option value="rímac">Rímac Seguros</option>
                    <option value="pacífico">Pacífico Salud</option>
                    <option value="sanitas">EPS Sanitas</option>
                    <option value="particular">Particular</option>
                  </select>
                  <select className="text-xs border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-600 focus:ring-blue-500">
                    <option>Sede San Borja</option>
                    <option>Sede Surco</option>
                    <option>Sede Miraflores</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Workspace: Split Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column (Span 2): Patient Table Directory */}
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>Registros de Pacientes</span>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {pacientesFiltrados.length} resultados mostrados
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">Ordenado por última actividad</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4" scope="col">
                          Paciente
                        </th>
                        <th className="py-3 px-4" scope="col">
                          Documento / HC
                        </th>
                        <th className="py-3 px-4" scope="col">
                          Seguro
                        </th>
                        <th className="py-3 px-4" scope="col">
                          Última Atención
                        </th>
                        <th className="py-3 px-4" scope="col">
                          Estado
                        </th>
                        <th className="py-3 px-4 text-center" scope="col">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pacientesPagina.map((p) => {
                        const esSeleccionado = p.id === pacienteSeleccionado.id;
                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`transition cursor-pointer ${
                              esSeleccionado
                                ? "bg-blue-50/50 hover:bg-blue-50 border-l-4 border-[#1a446c]"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-3.5 px-4 font-medium text-slate-900">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    esSeleccionado
                                      ? "bg-[#1a446c] text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {p.iniciales}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{p.nombreCompleto}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {p.edad} años · {p.sexo}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-slate-700 font-semibold">
                                DNI: {p.numeroDocumento}
                              </span>
                              <p className="text-[11px] text-slate-400">HC: {p.numeroHc}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${p.seguroClase}`}
                              >
                                {p.seguro}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-medium text-slate-700">{p.ultimaAtencion.especialidad}</p>
                              <p className="text-[11px] text-slate-400">{p.ultimaAtencion.medico}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${p.estadoClase}`}
                              >
                                {p.estado}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(p.id);
                                }}
                                className="text-[#1a446c] hover:text-blue-800 font-semibold text-xs px-2 py-1 rounded hover:bg-blue-100/50"
                              >
                                Ver Ficha
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                  <span>
                    Mostrando{" "}
                    <strong>
                      {totalPacientes === 0 ? 0 : (paginaActual - 1) * PAGE_SIZE + 1}-
                      {Math.min(paginaActual * PAGE_SIZE, totalPacientes)}
                    </strong>{" "}
                    de <strong>{totalPacientes}</strong> pacientes
                  </span>
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                      disabled={paginaActual === 1}
                      className={`px-2.5 py-1 rounded border border-slate-200 bg-white transition ${
                        paginaActual === 1
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`px-2.5 py-1 rounded border transition ${
                          paginaActual === num
                            ? "border-[#1a446c] bg-[#1a446c] text-white font-medium"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaActual === totalPaginas}
                      className={`px-2.5 py-1 rounded border border-slate-200 bg-white transition ${
                        paginaActual === totalPaginas
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column (Span 1): Selected Patient Quick Dossier */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Ficha Rápida del Paciente
                      </h3>
                    </div>
                    <span
                      onClick={() => alert(`Editando datos de ${pacienteSeleccionado.nombreCompleto}...`)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Editar Datos
                    </span>
                  </div>

                  {/* Patient Main Identity Box */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1a446c] text-white flex items-center justify-center font-bold text-lg shrink-0">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {pacienteSeleccionado.nombreCompleto}
                      </h4>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">
                        DNI: <strong className="text-slate-800">{pacienteSeleccionado.numeroDocumento}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        HC: {pacienteSeleccionado.numeroHc} · Sede San Borja
                      </p>
                    </div>
                  </div>

                  {/* Contact & Demographic Details */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="font-semibold text-slate-800">{pacienteSeleccionado.telefono}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Correo Electrónico:</span>
                      <span className="font-semibold text-slate-800">{pacienteSeleccionado.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Dirección:</span>
                      <span className="font-semibold text-slate-800">{pacienteSeleccionado.direccion}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Financiador / Seguro:</span>
                      <span className="font-semibold text-red-600">{pacienteSeleccionado.seguro}</span>
                    </div>
                  </div>

                  {/* Clinical Alerts / Summary */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Observaciones Clínicas
                    </span>
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs">
                      <span className="font-bold text-red-800">Alergias Conocidas:</span>
                      <p className="text-red-700 mt-0.5">{pacienteSeleccionado.alergias}</p>
                    </div>
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                      <span className="font-bold text-blue-900">Diagnóstico Principal Reciente:</span>
                      <p className="text-blue-800 mt-0.5">{pacienteSeleccionado.diagnosticoReciente}</p>
                      <p className="text-[11px] text-blue-600 mt-1">
                        Tratante: {pacienteSeleccionado.medicoTratante}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Selected Patient */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  {(user?.rol === "admision" || user?.rol === "administrador") && (
                    <button
                      onClick={() => router.push("/agenda")}
                      className="w-full py-2.5 px-4 bg-[#1a446c] hover:bg-[#133556] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">event_available</span>
                      <span>Agendar Nueva Cita Médica</span>
                    </button>
                  )}
                  <button
                    onClick={() =>
                      router.push(`/historia?pacienteId=${encodeURIComponent(pacienteSeleccionado.id)}`)
                    }
                    className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500">clinical_notes</span>
                    <span>Abrir Historia Clínica Completa</span>
                  </button>
                </div>
              </div>
            </div>
          </main>

      {/* ── MODAL REGISTRAR NUEVO PACIENTE ──────────────────────────────────── */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1a446c] flex items-center justify-center font-bold">
                  +
                </div>
                <h3 className="font-bold text-slate-800 text-base">Registrar Nuevo Paciente</h3>
              </div>
              <button
                onClick={() => setModalNuevoOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">DNI (8 dígitos) *</label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="71234567"
                  value={nuevoDni}
                  onChange={(e) => setNuevoDni(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1a446c]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Sexo *</label>
                <select
                  value={nuevoSexo}
                  onChange={(e) => setNuevoSexo(e.target.value as "M" | "F")}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1a446c]"
                >
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Nombres *</label>
                <input
                  type="text"
                  placeholder="Ej. Valeria"
                  value={nuevoNombres}
                  onChange={(e) => setNuevoNombres(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Apellido Paterno *</label>
                <input
                  type="text"
                  placeholder="Ej. Castillo"
                  value={nuevoPaterno}
                  onChange={(e) => setNuevoPaterno(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Apellido Materno</label>
                <input
                  type="text"
                  placeholder="Ej. Flores"
                  value={nuevoMaterno}
                  onChange={(e) => setNuevoMaterno(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={nuevoNacimiento}
                  onChange={(e) => setNuevoNacimiento(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Seguro / Financiador</label>
                <select
                  value={nuevoSeguro}
                  onChange={(e) => setNuevoSeguro(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                >
                  <option value="Rímac Seguros">Rímac Seguros</option>
                  <option value="Pacífico Salud">Pacífico Salud</option>
                  <option value="EPS Sanitas">EPS Sanitas</option>
                  <option value="Particular">Particular</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="+51 987 654 321"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="valeria.castillo@gmail.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-slate-700">Dirección</label>
              <input
                type="text"
                placeholder="Av. Las Camelias 412, San Borja"
                value={nuevoDireccion}
                onChange={(e) => setNuevoDireccion(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-slate-700">Alergias Conocidas</label>
              <input
                type="text"
                placeholder="Ej. Penicilina, AINEs (o 'Ninguna')"
                value={nuevoAlergias}
                onChange={(e) => setNuevoAlergias(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalNuevoOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={guardando}
                onClick={handleGuardarNuevoPaciente}
                className="px-5 py-2 bg-[#1a446c] hover:bg-[#133556] text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
                type="button"
              >
                {guardando ? "Registrando..." : "Registrar y Generar HC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ──────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-emerald-400 text-xl font-bold">✓</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{toast.titulo}</span>
            <span className="text-[11px] text-slate-300">{toast.cuerpo}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PacientesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="text-[#1a446c] text-sm font-semibold">Cargando Directorio de Pacientes...</div>
        </div>
      }
    >
      <PacientesContent />
    </React.Suspense>
  );
}

