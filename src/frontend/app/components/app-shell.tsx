"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { canAccessPath, crumbForPath, navForRole } from "../lib/nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const ready =
    !loading && Boolean(user) && Boolean(user && canAccessPath(user.rol, pathname));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!canAccessPath(user.rol, pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  const items = user ? navForRole(user.rol) : [];
  const crumb = crumbForPath(pathname);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {ready && user && (
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
              {items.map((item) => {
                const activo =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left w-full ${
                      activo
                        ? "bg-primary-container text-on-primary font-bold"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="font-label-lg text-label-lg">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-space-md border-t border-outline-variant bg-surface-container-low flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-tertiary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="font-caption text-caption font-semibold">
                Servidor Clínico: En línea
              </span>
            </div>
            <div className="font-caption text-caption text-on-surface-variant">
              SIGC v4.8.2 · Clínica San Rafael
            </div>
          </div>
        </aside>
      )}

      {ready && user && (
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface-container-lowest border-b border-outline-variant z-40 flex items-center justify-between px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">local_hospital</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">SIGC</span>
            <span className="font-caption text-caption text-outline">&gt;</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{crumb}</span>
          </div>
          <div className="hidden md:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container border border-outline-variant rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
            <span className="font-caption text-caption">
              La sesión se cierra tras 10 min de inactividad
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex flex-col text-right">
              <span className="font-label-md text-label-md text-on-surface leading-tight">
                {user.nombres} {user.apellidos}
              </span>
              <span className="font-caption text-caption text-on-surface-variant capitalize">
                {user.rol}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant" />
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
      )}

      <div
        className={
          ready
            ? "pl-[260px] w-full pt-16 bg-surface min-h-screen flex-1"
            : "w-full min-h-screen bg-surface"
        }
      >
        {!ready && (
          <div className="min-h-screen flex items-center justify-center text-on-surface-variant font-label-md">
            Cargando…
          </div>
        )}
        {/* children siempre montados: Instant Navigations */}
        <div className={ready ? "contents" : "hidden"}>{children}</div>
      </div>
    </div>
  );
}
