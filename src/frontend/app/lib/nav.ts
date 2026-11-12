export type AppRole =
  | "medico"
  | "enfermera"
  | "admision"
  | "administrador"
  | "laboratorio"
  | "cajero"
  | "gerencia";

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  roles: AppRole[];
  crumb: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Inicio",
    icon: "home",
    href: "/dashboard",
    crumb: "Inicio",
    roles: ["medico", "enfermera", "admision", "administrador", "laboratorio", "cajero", "gerencia"],
  },
  {
    label: "Agenda",
    icon: "calendar_month",
    href: "/agenda",
    crumb: "Agenda",
    roles: ["medico", "admision", "administrador"],
  },
  {
    label: "Pacientes",
    icon: "person_search",
    href: "/pacientes",
    crumb: "Pacientes",
    roles: ["medico", "enfermera", "admision", "administrador"],
  },
  {
    label: "Historia clínica",
    icon: "clinical_notes",
    href: "/historia",
    crumb: "Historia clínica",
    roles: ["medico", "enfermera", "administrador"],
  },
  {
    label: "Laboratorio",
    icon: "chips",
    href: "/laboratorio",
    crumb: "Laboratorio",
    roles: ["laboratorio", "administrador"],
  },
  {
    label: "Facturación",
    icon: "receipt_long",
    href: "/facturacion",
    crumb: "Facturación",
    roles: ["cajero", "administrador", "gerencia"],
  },
];

export const MODULE_CARDS = [
  { label: "Agenda", href: "/agenda", icon: "calendar_month", desc: "Reservar y gestionar citas" },
  { label: "Pacientes", href: "/pacientes", icon: "person_search", desc: "Directorio y búsqueda" },
  { label: "Historia clínica", href: "/historia", icon: "clinical_notes", desc: "HCE unificada" },
  { label: "Laboratorio", href: "/laboratorio", icon: "chips", desc: "Órdenes y resultados" },
  { label: "Facturación", href: "/facturacion", icon: "receipt_long", desc: "Comprobantes y convenios" },
] as const;

export function navForRole(rol: string): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(rol as AppRole));
}

export function canAccessPath(rol: string, pathname: string): boolean {
  const item = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  if (!item) return true;
  return item.roles.includes(rol as AppRole);
}

export function crumbForPath(pathname: string): string {
  const item = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return item?.crumb ?? "SIGC";
}

export function canCreateCitas(rol: string): boolean {
  return rol === "admision" || rol === "administrador";
}

export function isMedico(rol: string): boolean {
  return rol === "medico";
}
