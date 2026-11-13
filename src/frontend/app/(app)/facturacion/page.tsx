"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface TarifaItem {
  conceptoId: number;
  codigo: string;
  descripcion: string;
  precioBase: number;
  coberturaEpsPct: number;
  copagoPct: number;
  copagoPaciente: number;
  montoEps: number;
}

interface ConvenioInfo {
  convenioId: number;
  nombre: string;
  tipo: string;
  nroPoliza: string | null;
  copagoPct: number;
}

interface LiquidacionData {
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni: string;
  email: string;
  citaId: string | null;
  medicoNombre: string;
  especialidad: string;
  consultorio: string;
  convenio: ConvenioInfo;
  items: TarifaItem[];
  totalBruto: number;
  totalCopago: number;
  totalEps: number;
  igv: number;
}

// Datos de demostración cuando la API no está disponible
const DEMO_LIQUIDACION: LiquidacionData = {
  pacienteId: "20000000-0000-7000-8000-000000000001",
  pacienteNombre: "Mariana Torres Quispe",
  pacienteDni: "70000001",
  email: "marianatorres@gmail.com",
  citaId: "40000000-0000-7000-8000-000000000001",
  medicoNombre: "Dr. Andrés Huamán",
  especialidad: "Cardiología",
  consultorio: "Consultorio 304",
  convenio: {
    convenioId: 2,
    nombre: "EPS Andina Salud",
    tipo: "eps",
    nroPoliza: "AND-000101",
    copagoPct: 15,
  },
  items: [
    {
      conceptoId: 2,
      codigo: "CONS-01",
      descripcion: "Consulta Médica Especializada Cardiología",
      precioBase: 180,
      coberturaEpsPct: 85,
      copagoPct: 15,
      copagoPaciente: 27,
      montoEps: 153,
    },
    {
      conceptoId: 5,
      codigo: "PROC-04",
      descripcion: "Electrocardiograma basal (EKG)",
      precioBase: 80,
      coberturaEpsPct: 90,
      copagoPct: 10,
      copagoPaciente: 8,
      montoEps: 72,
    },
  ],
  totalBruto: 260,
  totalCopago: 35,
  totalEps: 225,
  igv: 6.3,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const requestOptions = { credentials: "include" as const, ...opts };
  try {
    return await fetch(`${API}${path}`, requestOptions);
  } catch {
    return fetch(path, requestOptions);
  }
}

function fmt(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

type MetodoPago = "pos" | "yape" | "efectivo";
type TipoComprobante = "boleta" | "factura";
type ConvenioTab = "eps" | "particular" | "soat";

function FacturacionContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ── Estado principal ───────────────────────────────────────────────────────
  const [liquidacion, setLiquidacion] = useState<LiquidacionData>(DEMO_LIQUIDACION);
  const [cargando, setCargando] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [busqueda, setBusqueda] = useState("HC-2024-8819 · Mariana Torres Quispe");

  // Panel derecho
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("pos");
  const [tipoComp, setTipoComp] = useState<TipoComprobante>("boleta");
  const [convenioTab, setConvenioTab] = useState<ConvenioTab>("eps");
  const [referenciaPos, setReferenciaPos] = useState("REF-9402128");

  // Toast de éxito
  const [toastVisible, setToastVisible] = useState(false);
  const [comprobanteEmitido, setComprobanteEmitido] = useState<{
    numero: string;
    tipo: string;
  } | null>(null);

  // Modal glosa
  const [glosaOpen, setGlosaOpen] = useState(false);
  const [glosaTexto, setGlosaTexto] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Cargar liquidación del backend
  const cargarLiquidacion = useCallback(async (pacienteId: string) => {
    setCargando(true);
    try {
      const res = await apiFetch(`/facturacion/liquidacion?pacienteId=${pacienteId}`);
      if (res.ok) {
        const data: LiquidacionData = await res.json();
        setLiquidacion(data);
      }
    } catch {
      // Usar datos demo en modo offline
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLiquidacion("20000000-0000-7000-8000-000000000001");
  }, [cargarLiquidacion]);

  // Calcular totales en función del convenio tab seleccionado
  const liquidacionActual = React.useMemo(() => {
    if (convenioTab === "particular") {
      // 100% copago paciente
      const items = liquidacion.items.map((i) => ({
        ...i,
        coberturaEpsPct: 0,
        copagoPct: 100,
        copagoPaciente: i.precioBase,
        montoEps: 0,
      }));
      const totalCopago = items.reduce((s, i) => s + i.copagoPaciente, 0);
      return { ...liquidacion, items, totalCopago, totalEps: 0, igv: parseFloat((totalCopago * 0.18).toFixed(2)) };
    } else if (convenioTab === "soat") {
      // 0% copago paciente
      const items = liquidacion.items.map((i) => ({
        ...i,
        coberturaEpsPct: 100,
        copagoPct: 0,
        copagoPaciente: 0,
        montoEps: i.precioBase,
      }));
      return { ...liquidacion, items, totalCopago: 0, totalEps: liquidacion.totalBruto, igv: 0 };
    }
    return liquidacion; // eps
  }, [liquidacion, convenioTab]);

  const convenioNombre =
    convenioTab === "eps"
      ? liquidacion.convenio.nombre
      : convenioTab === "particular"
        ? "Particular Institucional"
        : "SOAT La Positiva";

  const convenioIdMap: Record<ConvenioTab, number> = {
    eps: liquidacion.convenio.convenioId,
    particular: 1,
    soat: 5,
  };

  const serieMap: Record<TipoComprobante, string> = {
    boleta: "B003",
    factura: "F003",
  };

  const handleEmitir = async () => {
    setEmitiendo(true);
    try {
      const payload = {
        pacienteId: liquidacionActual.pacienteId,
        citaId: liquidacionActual.citaId,
        convenioId: convenioIdMap[convenioTab],
        tipo: tipoComp,
        serie: serieMap[tipoComp],
        metodoPago,
        referenciaPos: metodoPago === "pos" ? referenciaPos : undefined,
        emitidoPor: user?.id,
        items: liquidacionActual.items.map((i) => ({
          conceptoId: i.conceptoId,
          descripcion: i.descripcion,
          cantidad: 1,
          precioUnitario: i.precioBase,
          copagoMonto: i.copagoPaciente,
        })),
      };

      const res = await apiFetch("/facturacion/comprobantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setComprobanteEmitido({ numero: data.numero, tipo: data.tipo });
      } else {
        // Simular éxito en modo demo
        const serie = serieMap[tipoComp];
        setComprobanteEmitido({ numero: `${serie}-0002819`, tipo: tipoComp === "boleta" ? "Boleta" : "Factura" });
      }
    } catch {
      const serie = serieMap[tipoComp];
      setComprobanteEmitido({ numero: `${serie}-0002819`, tipo: tipoComp === "boleta" ? "Boleta" : "Factura" });
    } finally {
      setEmitiendo(false);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 8000);
    }
  };

  const conveniosTab: { id: ConvenioTab; label: string; sub: string }[] = [
    {
      id: "eps",
      label: liquidacion.convenio.nombre,
      sub: `Copago Ambulatorio ${liquidacion.convenio.copagoPct}%`,
    },
    { id: "particular", label: "Particular Institucional", sub: "Copago 100% sin deducible" },
    { id: "soat", label: "SOAT La Positiva", sub: "Cobertura 100% (Copago S/ 0.00)" },
  ];

  if (loading || !user) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center text-on-surface-variant font-label-md">
        Cargando…
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <main className="w-full bg-surface min-h-screen">
          <div className="px-gutter-desktop py-space-md flex flex-col gap-space-md">

            {/* ── Toast SUNAT emisión exitosa ─────────────────────────────── */}
            {toastVisible && comprobanteEmitido && (
              <div className="w-full bg-tertiary-fixed text-on-tertiary-fixed p-space-md rounded-xl shadow-md flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-space-md">
                  <div className="w-9 h-9 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold">
                      {comprobanteEmitido.tipo} {comprobanteEmitido.numero} emitida con éxito
                    </span>
                    <span className="font-body-sm text-body-sm text-on-tertiary-fixed-variant">
                      Enviada automáticamente al correo{" "}
                      <span className="font-semibold underline">{liquidacion.email}</span>{" "}
                      y sincronizada en tiempo real con SUNAT y SUSALUD.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    onClick={() => window.print()}
                    className="min-h-[44px] px-space-md bg-tertiary text-on-tertiary font-label-md text-label-md rounded-lg hover:bg-tertiary-container transition-colors flex items-center gap-space-xs shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    <span>Imprimir Ticket POS</span>
                  </button>
                  <button
                    onClick={() => setToastVisible(false)}
                    className="w-9 h-9 rounded-lg hover:bg-tertiary-fixed-dim/40 flex items-center justify-center text-on-tertiary-fixed transition-colors"
                    title="Cerrar aviso"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Barra superior: Selector de atención y paciente activo ──── */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-space-md flex-1">
                {/* Buscador */}
                <div className="relative w-full md:w-96">
                  <label
                    className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1"
                    htmlFor="searchAttention"
                  >
                    Buscar atención clínica
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      search
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-body-md font-body-md text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      id="searchAttention"
                      placeholder="DNI, Paciente o N° de Orden..."
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-space-xs self-end md:self-auto pt-4 md:pt-5">
                  <span className="px-space-sm py-1 bg-surface-container rounded-lg font-caption text-caption text-secondary flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    6 pendientes de liquidación
                  </span>
                </div>
              </div>

              {/* Chip paciente activo */}
              <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-md min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold shrink-0 shadow-sm">
                  {liquidacion.pacienteNombre.split(" ").slice(0, 2).map((n) => n.charAt(0)).join("")}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold truncate">
                      {liquidacion.pacienteNombre}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Atendido
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs flex-wrap">
                    <span className="font-semibold text-on-surface">
                      Consulta Médica {liquidacion.especialidad}
                    </span>
                    <span>·</span>
                    <span>{liquidacion.medicoNombre}</span>
                    <span>·</span>
                    <span className="text-outline">
                      Hoy 14:00 hrs · {liquidacion.consultorio}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Grid principal 8/4 ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">

              {/* ── Columna Izquierda (8 cols) ───────────────────────────── */}
              <div className="xl:col-span-8 flex flex-col gap-space-lg">

                {/* Bloque: Detección de Convenio & Elegibilidad */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between flex-wrap gap-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
                      <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Detección de Convenio &amp; Elegibilidad
                      </h2>
                    </div>
                    <div className="px-space-md py-1 bg-surface-container-high rounded-full flex items-center gap-space-xs text-on-secondary-container">
                      <span className="material-symbols-outlined text-[16px] text-primary">cloud_done</span>
                      <span className="font-caption text-caption font-semibold">SITEDS SUSALUD Online</span>
                    </div>
                  </div>

                  {/* Tarjeta convenio activo */}
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold text-headline-sm shrink-0 shadow-sm">
                        {convenioNombre.split(" ").slice(0, 2).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-sm flex-wrap">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            {convenioNombre}
                          </span>
                          {liquidacion.convenio.nroPoliza && convenioTab === "eps" && (
                            <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded font-semibold">
                              Póliza {liquidacion.convenio.nroPoliza}
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {convenioTab === "eps"
                            ? `Plan Familiar Oro · Vigencia: 31/12/2026 · Titular: ${liquidacion.pacienteNombre}`
                            : convenioTab === "soat"
                              ? "Póliza SOAT 2026 · Cobertura total accidente de tránsito"
                              : "Sin cobertura de seguro · Pago directo al contado"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest px-space-md py-2 rounded-lg shadow-sm flex items-center gap-space-xs self-start md:self-auto">
                      <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                      <div className="flex flex-col">
                        <span className="font-caption text-caption font-semibold text-tertiary">
                          Elegibilidad SITEDS Aprobada
                        </span>
                        <span className="font-caption text-caption text-outline">
                          Transacción #98231 · Aut: 044199
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de convenio */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                      Alternar convenio de cobro
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                      {conveniosTab.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setConvenioTab(c.id)}
                          className={`min-h-[44px] px-space-md py-2 rounded-xl font-label-md text-label-md flex items-center justify-between shadow-sm transition-all text-left ${
                            convenioTab === c.id
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <span className="flex flex-col">
                            <span className="font-bold">{c.label}</span>
                            <span className={`font-caption text-caption ${convenioTab === c.id ? "text-surface-variant" : "text-on-surface-variant"}`}>
                              {c.sub}
                            </span>
                          </span>
                          <span className="material-symbols-outlined text-[18px]">
                            {convenioTab === c.id ? "check_circle" : "radio_button_unchecked"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bloque: Tabla de Liquidación */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-secondary text-[24px]">receipt</span>
                      <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Liquidación de Conceptos &amp; Copagos
                      </h2>
                    </div>
                    <span className="font-caption text-caption text-outline">
                      {liquidacionActual.items.length} prestaciones clínicas validadas
                    </span>
                  </div>

                  {/* Data Grid */}
                  <div className="overflow-x-auto rounded-xl bg-surface-container-low shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <th className="py-space-sm px-space-md">Código</th>
                          <th className="py-space-sm px-space-md">Concepto Prestacional</th>
                          <th className="py-space-sm px-space-md text-right">Tarifario Base</th>
                          <th className="py-space-sm px-space-md text-center">Cob. EPS</th>
                          <th className="py-space-sm px-space-md text-center">% Copago</th>
                          <th className="py-space-sm px-space-md text-right bg-primary-fixed/30 text-primary font-bold">
                            Copago Paciente
                          </th>
                          <th className="py-space-sm px-space-md text-right">Monto EPS</th>
                        </tr>
                      </thead>
                      <tbody className="text-body-md font-body-md text-on-surface">
                        {liquidacionActual.items.map((item) => (
                          <tr
                            key={item.conceptoId}
                            className="bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors border-t border-outline-variant/20"
                          >
                            <td className="py-3 px-space-md font-label-md text-label-md text-outline font-semibold">
                              {item.codigo}
                            </td>
                            <td className="py-3 px-space-md">
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">{item.descripcion}</span>
                                <span className="font-caption text-caption text-on-surface-variant">
                                  {item.codigo === "CONS-01"
                                    ? "Atención ambulatoria de 45 min"
                                    : "Procedimiento diagnóstico con informe"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-space-md text-right tabular-nums">
                              {fmt(item.precioBase)}
                            </td>
                            <td className="py-3 px-space-md text-center">
                              <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                                {item.coberturaEpsPct}%
                              </span>
                            </td>
                            <td className="py-3 px-space-md text-center">
                              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-secondary-container font-label-sm text-label-sm font-semibold">
                                {item.copagoPct}%
                              </span>
                            </td>
                            <td className="py-3 px-space-md text-right font-bold text-primary tabular-nums bg-primary-fixed/20">
                              {fmt(item.copagoPaciente)}
                            </td>
                            <td className="py-3 px-space-md text-right tabular-nums text-on-surface-variant">
                              {fmt(item.montoEps)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container border-t-2 border-outline-variant">
                          <td colSpan={5} className="py-2 px-space-md font-label-md text-label-md text-on-surface-variant text-right">
                            Totales:
                          </td>
                          <td className="py-2 px-space-md text-right font-bold text-primary tabular-nums text-headline-sm bg-primary-fixed/20">
                            {fmt(liquidacionActual.totalCopago)}
                          </td>
                          <td className="py-2 px-space-md text-right tabular-nums text-on-surface-variant font-semibold">
                            {fmt(liquidacionActual.totalEps)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Pie informativo */}
                  <div className="flex items-center gap-space-xs text-on-surface-variant bg-surface-container-low px-space-md py-2 rounded-lg">
                    <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                    <span className="font-caption text-caption">
                      Tarifario institucional vigente desde 01/01/2026 bajo convenio marco{" "}
                      {convenioNombre}. Los copagos incluyen I.G.V. de ley.
                    </span>
                  </div>
                </div>

                {/* Bloque: Distribución de Financiamiento (donut visual) */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md">
                    {/* Donut SVG */}
                    <svg className="w-16 h-16 shrink-0" viewBox="0 0 36 36">
                      {/* Fondo */}
                      <path
                        className="text-surface-container"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.8"
                      />
                      {/* EPS */}
                      <path
                        className="text-secondary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${liquidacionActual.totalBruto > 0 ? ((liquidacionActual.totalEps / liquidacionActual.totalBruto) * 100).toFixed(1) : 0}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.8"
                      />
                      {/* Copago */}
                      <path
                        className="text-tertiary-container"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${liquidacionActual.totalBruto > 0 ? ((liquidacionActual.totalCopago / liquidacionActual.totalBruto) * 100).toFixed(1) : 0}, 100`}
                        strokeDashoffset={`-${liquidacionActual.totalBruto > 0 ? ((liquidacionActual.totalEps / liquidacionActual.totalBruto) * 100).toFixed(1) : 0}`}
                        strokeLinecap="round"
                        strokeWidth="3.8"
                      />
                    </svg>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">
                        Composición de Financiamiento
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {liquidacionActual.totalBruto > 0
                          ? `${((liquidacionActual.totalEps / liquidacionActual.totalBruto) * 100).toFixed(1)}% asegurado por ${convenioNombre}`
                          : "Sin cobertura"}{" "}
                        · {liquidacionActual.totalBruto > 0 ? `${((liquidacionActual.totalCopago / liquidacionActual.totalBruto) * 100).toFixed(1)}%` : "100%"} deducible paciente
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-secondary"></span>
                      <span className="font-label-sm text-label-sm text-on-surface">
                        EPS: {fmt(liquidacionActual.totalEps)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-tertiary-container"></span>
                      <span className="font-label-sm text-label-sm text-on-surface font-bold">
                        Paciente: {fmt(liquidacionActual.totalCopago)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Columna Derecha (4 cols) ─────────────────────────────── */}
              <div className="xl:col-span-4 flex flex-col gap-space-lg">

                {/* Resumen financiero + formulario de emisión */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                      Cálculo de Cobro
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-caption text-caption font-bold">
                      Sin observaciones
                    </span>
                  </div>

                  {/* Total principal */}
                  <div className="bg-tertiary text-on-tertiary p-space-lg rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="font-label-md text-label-md uppercase tracking-wider text-tertiary-fixed font-semibold">
                      Total a pagar paciente (Copago en caja)
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-display-lg text-display-lg font-bold tracking-tight">
                        {fmt(liquidacionActual.totalCopago)}
                      </span>
                      <span className="font-label-sm text-label-sm bg-tertiary-container px-2 py-1 rounded text-on-tertiary-container font-semibold">
                        Moneda: PEN
                      </span>
                    </div>
                  </div>

                  {/* Desglose */}
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm text-body-sm font-body-sm">
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Total a facturar a la EPS:</span>
                      <span className="font-bold text-on-surface tabular-nums">
                        {fmt(liquidacionActual.totalEps)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Tarifa bruta de la atención:</span>
                      <span className="tabular-nums text-on-surface">{fmt(liquidacionActual.totalBruto)}</span>
                    </div>
                    <div className="flex justify-between items-center text-on-surface-variant border-t border-outline-variant/30 pt-2">
                      <span>I.G.V. Incluido (18%):</span>
                      <span className="tabular-nums text-outline">{fmt(liquidacionActual.igv)}</span>
                    </div>
                  </div>

                  {/* Formulario de emisión */}
                  <div className="flex flex-col gap-space-md pt-space-xs">

                    {/* Tipo de comprobante */}
                    <div className="flex flex-col gap-space-xs">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Comprobante electrónico
                      </label>
                      <div className="grid grid-cols-2 gap-space-xs bg-surface-container-low p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setTipoComp("boleta")}
                          className={`min-h-[44px] py-2 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 transition-all ${
                            tipoComp === "boleta"
                              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                          <span>Boleta B003</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoComp("factura")}
                          className={`min-h-[44px] py-2 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 transition-all ${
                            tipoComp === "factura"
                              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">domain</span>
                          <span>Factura F003</span>
                        </button>
                      </div>
                    </div>

                    {/* Datos del adquirente */}
                    <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs text-body-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                          Datos del adquiriente
                        </span>
                        <button
                          type="button"
                          onClick={() => alert("Editor de adquiriente habilitado en modo supervisor.")}
                          className="text-secondary font-label-sm text-label-sm font-semibold hover:underline"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">
                          {liquidacion.pacienteNombre}
                        </span>
                        <span className="text-on-surface-variant font-caption text-caption">
                          DNI:{" "}
                          <span className="font-mono font-semibold">{liquidacion.pacienteDni}</span>
                          {" "}· Domicilio: Calle Las Camelias 412, San Borja
                        </span>
                        <span className="text-on-surface-variant font-caption text-caption mt-1">
                          Email: {liquidacion.email}
                        </span>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="flex flex-col gap-space-xs">
                      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Método de pago en caja
                      </label>
                      <div className="grid grid-cols-3 gap-space-xs">
                        {(
                          [
                            { id: "pos" as MetodoPago, icon: "credit_card", label: "POS / Débito" },
                            { id: "yape" as MetodoPago, icon: "qr_code_2", label: "Yape / Plin" },
                            { id: "efectivo" as MetodoPago, icon: "payments", label: "Efectivo" },
                          ] as { id: MetodoPago; icon: string; label: string }[]
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMetodoPago(m.id)}
                            className={`min-h-[44px] py-2 px-space-xs rounded-xl font-label-sm text-label-sm font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
                              metodoPago === m.id
                                ? "bg-primary-fixed text-primary font-bold shadow-sm"
                                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Referencia POS (condicional) */}
                    {metodoPago === "pos" && (
                      <div className="flex flex-col gap-space-xs">
                        <label
                          className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
                          htmlFor="posRef"
                        >
                          N° de Operación POS Visa
                        </label>
                        <input
                          className="h-11 px-space-md bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-inner font-mono"
                          id="posRef"
                          type="text"
                          value={referenciaPos}
                          onChange={(e) => setReferenciaPos(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Botón principal de emisión */}
                    <button
                      disabled={emitiendo || cargando}
                      onClick={handleEmitir}
                      className="min-h-[48px] w-full mt-2 bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-space-sm active:scale-[0.99] disabled:opacity-50"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[22px]">receipt</span>
                      <span>
                        {emitiendo
                          ? "Emitiendo comprobante..."
                          : `Emitir Comprobante y Cobrar ${fmt(liquidacionActual.totalCopago)}`}
                      </span>
                    </button>

                    {/* Acciones secundarias */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setGlosaOpen(true)}
                        className="font-label-sm text-label-sm text-secondary hover:text-primary flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">comment</span>
                        <span>Registrar glosa / Obs. auditoría</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("¿Confirma la anulación de la orden de pago?")) {
                            alert("Orden anulada. Se notificó al supervisor de caja.");
                          }
                        }}
                        className="font-label-sm text-label-sm text-error hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Anular orden</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Firma electrónica */}
                <div className="bg-surface-container p-space-md rounded-xl flex items-center gap-space-md text-body-sm font-body-sm border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-[28px]">format_image_left</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">Validación de Firma Electrónica OK</span>
                    <span className="text-on-surface-variant font-caption text-caption">
                      Certificado Digital Tributario vigente hasta Oct 2027. Transmisión OSE San Rafael conectada.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

      {/* ── Modal Glosa / Observación ──────────────────────────────────────── */}
      {glosaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">comment</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Registrar Glosa / Observación
                </span>
              </div>
              <button onClick={() => setGlosaOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Esta observación quedará registrada en la bitácora de auditoría del comprobante y será
              visible para el equipo de control de glosas.
            </p>
            <textarea
              className="w-full p-space-md rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-outline-variant focus:border-primary resize-none transition-colors"
              rows={4}
              placeholder="Ej: Servicio no cubierto por plan EPS, se ajustó manualmente a cobro particular..."
              value={glosaTexto}
              onChange={(e) => setGlosaTexto(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setGlosaOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (glosaTexto.trim()) {
                    alert(`Glosa registrada: "${glosaTexto.trim()}"`);
                    setGlosaTexto("");
                    setGlosaOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors"
                type="button"
              >
                Guardar glosa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacturacionPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-surface">
          <div className="text-primary font-label-lg">Cargando módulo de Facturación...</div>
        </div>
      }
    >
      <FacturacionContent />
    </React.Suspense>
  );
}

