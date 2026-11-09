"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/auth-context";

export default function LoginPage() {
  const [username, setUsername] = useState("dramos");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);

  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      let response: Response;

      try {
        response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      } catch {
        response = await fetch("/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        router.push("/agenda");
      } else {
        const remaining = Math.max(0, attempts - 1);
        setAttempts(remaining);
        setError(
          data.message ||
            `Usuario o contraseña incorrectos. Quedan ${remaining} intentos antes del bloqueo temporal de la cuenta institucional.`
        );
      }
    } catch {
      const remaining = Math.max(0, attempts - 1);
      setAttempts(remaining);
      setError(
        "No se pudo conectar con el servidor de seguridad. Comprueba que el backend esté activo en el puerto 3001."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface flex items-center justify-center p-gutter-desktop relative">
      {/* Top Left Logo Header */}
      <div className="fixed top-6 left-8 flex items-center gap-3 z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Logo Clínica San Rafael"
          className="h-11 w-11 object-contain rounded-xl shadow-xs"
          src="/logoclinica.png"
        />
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm leading-tight">Clínica San Rafael</span>
          <span className="text-xs text-slate-500">Sede San Borja</span>
        </div>
      </div>

      <div className="flex flex-col w-full items-center justify-center py-6 px-4">
        <div className="relative w-full max-w-[520px]">
          {/* Ambient glow */}
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-surface-container-highest/40 rounded-full blur-3xl pointer-events-none"></div>

          {/* Main Card */}
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 flex flex-col gap-6">

            {/* Sede badge */}
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg text-primary text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[16px]">apartment</span>
                <span>Sede: San Borja (Av. Guardia Civil 385)</span>
              </div>
              <div className="flex items-center gap-1.5 text-caption font-caption text-on-surface-variant">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                <span>Servidor Activo</span>
              </div>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-16 flex items-center justify-center mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Logo Clínica San Rafael"
                  className="h-14 w-14 object-contain rounded-xl shadow-xs"
                  src="/logoclinica.png"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Portal Asistencial y Administrativo
                </span>
                <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">
                  Sistema Integrado de Gestión Clínica (SIGC)
                </h1>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Acceso seguro para personal médico y administrativo · Sede San Borja
                </p>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 bg-error-container/40 rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <div className="flex flex-col text-left">
                  <span className="text-label-md font-label-md text-on-error-container font-semibold">
                    Credenciales no reconocidas
                  </span>
                  <p className="text-caption font-caption text-error font-medium mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit}>
              {/* Usuario */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md text-on-surface flex items-center justify-between" htmlFor="username">
                  <span>Usuario Institucional</span>
                  <span className="text-caption font-caption text-on-surface-variant font-normal">DNI o alias @sanrafael.pe</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">badge</span>
                  <input
                    className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-lg text-body-lg font-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors shadow-sm"
                    id="username" name="username" placeholder="Ej. dramos o DNI" required type="text"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md text-on-surface" htmlFor="password">Contraseña</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock</span>
                  <input
                    className="w-full h-11 pl-11 pr-28 bg-surface-container-low rounded-lg text-body-lg font-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors shadow-sm"
                    id="password" name="password" placeholder="••••••••••••" required
                    type={showPassword ? "text" : "password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Alternar visibilidad de contraseña"
                    className="absolute right-2 px-2.5 py-1 text-label-sm font-label-sm text-secondary hover:text-primary flex items-center gap-1 rounded hover:bg-surface-container transition-colors"
                    type="button" onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                    <span>{showPassword ? "Ocultar" : "Mostrar"}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex flex-col gap-3">
                <button
                  disabled={loading}
                  className="w-full min-h-[44px] h-12 bg-primary hover:bg-primary-container active:bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                >
                  <span>{loading ? "Validando credenciales..." : "Ingresar al SIGC"}</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-label-md font-label-md text-secondary hover:text-primary hover:underline transition-colors"
                    onClick={() => alert("Canal de soporte: Central telefónica Anexo 402 o correo a soporte@sanrafael.pe")}
                  >
                    <span className="material-symbols-outlined text-[16px]">contact_support</span>
                    <span>¿Olvidó su contraseña? Contactar a Soporte TI (Anexo 402)</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Legal footer */}
            <div className="bg-surface-container-low rounded-lg p-3.5 flex items-start gap-2.5 text-left">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">policy</span>
              <div className="flex flex-col gap-1">
                <span className="text-label-sm font-label-sm font-semibold text-on-surface">Marco de Confidencialidad y Auditoría Médica</span>
                <p className="text-caption font-caption text-on-surface-variant leading-relaxed">
                  <strong>Aviso legal:</strong> Todo acceso a historias clínicas y datos de salud queda estrictamente registrado con IP, fecha y hora según la <strong>Ley N.° 29733</strong> y normativas del <strong>MINSA</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Metadata footer */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-caption font-caption text-on-surface-variant/80 px-2 gap-2 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-tertiary-container">verified_user</span>
              <span>Conexión Cifrada SSL 256-bit · Endpoint Hospitalario Seguro</span>
            </div>
            <span>SIGC v4.8.2 · © 2025 Clínica San Rafael</span>
          </div>
        </div>
      </div>
    </main>
  );
}
