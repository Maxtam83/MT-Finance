import {
  LayoutDashboard,
  ShieldCheck,
  Tags,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Libellé court de la barre de navigation mobile. */
  shortLabel: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Accueil", icon: LayoutDashboard },
  { href: "/comptes", label: "Comptes", shortLabel: "Comptes", icon: Wallet },
  { href: "/regles", label: "Règles & Tags", shortLabel: "Règles", icon: Tags },
  { href: "/import", label: "Import", shortLabel: "Import", icon: Upload },
  { href: "/investissements", label: "Investissements", shortLabel: "Invest.", icon: TrendingUp },
  { href: "/admin", label: "Administration", shortLabel: "Admin", icon: ShieldCheck, adminOnly: true },
];

/** Nombre à signaler sur une entrée : les demandes se traitent dans « Comptes ». */
export function getNavBadgeCount(href: string, pendingRequestCount: number): number {
  return href === "/comptes" ? pendingRequestCount : 0;
}

/** Nom accessible d'une entrée, nombre de demandes compris. */
export function describeNavItem(label: string, badgeCount: number): string {
  if (badgeCount === 0) return label;
  return `${label}, ${badgeCount} ${badgeCount === 1 ? "demande" : "demandes"} en attente`;
}

/** Masquer un lien n'est pas une protection : `/admin` utilise `requireAdmin()`. */
export function getNavItems(isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);
}

/** Indique si un lien correspond à la page affichée. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
