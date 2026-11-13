"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { MODULE_CARDS, canCreateCitas, isMedico, navForRole } from "../../lib/nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path: string, opts?: RequestInit) {
  const requestOptions = { credentials: "include" as const, ...opts };
  try {
    return await fetch(`${API}${path}`, requestOptions);
  } catch {
    return fetch(path, requestOptions);
  }
}

interface MiCita {
  id: string;
  inicio: string;
  fin: string;
  estado: string;
  motivo: string | null;
  pacienteNombres: string;
  pacienteApellidos: string;
  numeroDocumento: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [citas, setCitas] = useState<MiCita[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);

  useEffect(() => {
    if (!user || !isMedico(user.rol)) return;
    let active = true;
    setCargandoCitas(true);
    apiFetch("/agenda/mis-citas")
      .then(async (r) => (r.ok ? r.json() : []))
      .then((data: MiCita[]) => {
        if (active) setCitas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCitas([]);
      })
      .finally(() => {
        if (active) setCargandoCitas(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
    <div className="w-full min-h-[40vh] flex items-center justify-center text-on-surface-variant font-label-md">
      Cargando…
    </div>
    );
  }

  const permittedHrefs = new Set(navForRole(user.rol).map((n) => n.href));
  const modulos = MODULE_CARDS.filter((m) => permittedHrefs.has(m.href));

  return (
    <main className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-md flex flex-col gap-space-lg">
      <section className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-primary-container/25 via-surface-container-lowest to-surface-container-low px-space-lg py-space-lg">
        <div className="absolute inset-y-0 right-0 w-1/3 opacity-[0.07] pointer-events-none bg-[radial-gradient(circle_at_30%_40%,#1a446c,transparent_60%)]" />
        <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">
          Sede San Borja
        </span>
        <h1 className="font-headline-md text-headline-md text-on-surface mt-1">
          Hola, {user.nombres}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
          Sesión como <span className="capitalize font-semibold text-on-surface">{user.rol}</span>.
          Accede solo a los módulos de tu rol.
        </p>
      </section>

      {(canCreateCitas(user.rol) || user.rol === "administrador") && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          <button
            type="button"
            onClick={() => router.push("/pacientes")}
            className="text-left rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md hover:border-primary/40 transition flex gap-space-md items-center"
          >
            <span className="material-symbols-outlined text-[28px] text-primary">person_add</span>
            <div>
              <h2 className="font-label-lg text-label-lg font-bold">Pacientes</h2>
              <p className="font-caption text-caption text-on-surface-variant">
                Registrar o buscar en el directorio
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => router.push("/agenda")}
            className="text-left rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md hover:border-primary/40 transition flex gap-space-md items-center"
          >
            <span className="material-symbols-outlined text-[28px] text-primary">event_available</span>
            <div>
              <h2 className="font-label-lg text-label-lg font-bold">Agendar cita</h2>
              <p className="font-caption text-caption text-on-surface-variant">
                Wizard de reserva en 3 pasos
              </p>
            </div>
          </button>
        </section>
      )}

      {isMedico(user.rol) && (
        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm font-bold">Mis citas</h2>
            <button
              type="button"
              onClick={() => router.push("/agenda")}
              className="font-label-md text-label-md text-primary font-semibold"
            >
              Ver agenda
            </button>
          </div>
          {cargandoCitas && (
            <p className="font-body-md text-body-md text-on-surface-variant">Cargando…</p>
          )}
          {!cargandoCitas && citas.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No hay citas asignadas a tu usuario.
            </p>
          )}
          <ul className="flex flex-col gap-space-xs">
            {citas.slice(0, 5).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-space-sm py-space-sm border-b border-outline-variant/30 last:border-0"
              >
                <div>
                  <p className="font-label-md text-label-md font-semibold">
                    {c.pacienteNombres} {c.pacienteApellidos}
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    DNI {c.numeroDocumento}
                    {c.motivo ? ` · ${c.motivo}` : ""}
                  </p>
                </div>
                <span className="font-label-md text-label-md text-primary font-bold text-right">
                  {new Date(c.inicio).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-space-sm pt-space-xs">
            <button
              type="button"
              onClick={() => router.push("/pacientes")}
              className="px-space-md py-space-sm rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md"
            >
              Buscar paciente
            </button>
            <button
              type="button"
              onClick={() => router.push("/historia")}
              className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md"
            >
              Historia clínica
            </button>
          </div>
        </section>
      )}

      {["laboratorio", "cajero", "enfermera", "gerencia"].includes(user.rol) && (
        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md">
          <h2 className="font-headline-sm text-headline-sm font-bold mb-space-sm">Tu módulo</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
            Continúa en el módulo principal de tu rol.
          </p>
          {modulos[0] && (
            <button
              type="button"
              onClick={() => router.push(modulos[0].href)}
              className="inline-flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[20px]">{modulos[0].icon}</span>
              Abrir {modulos[0].label}
            </button>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md">
        {modulos.map((modulo) => (
          <button
            key={modulo.href}
            type="button"
            onClick={() => router.push(modulo.href)}
            className="text-left bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-space-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">{modulo.icon}</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{modulo.label}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{modulo.desc}</p>
          </button>
        ))}
      </section>
    </main>
  );
}
