import { Suspense } from "react";
import { AppShell } from "../components/app-shell";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="w-full min-h-[40vh] flex items-center justify-center text-on-surface-variant font-label-md">
            Cargando…
          </div>
        }
      >
        {children}
      </Suspense>
    </AppShell>
  );
}
