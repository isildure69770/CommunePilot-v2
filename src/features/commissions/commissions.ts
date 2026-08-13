import type { LucideIcon } from "lucide-react";
import { Building2, Megaphone, Route, Warehouse } from "lucide-react";

export type CommissionId = "voirie" | "batiments" | "salles" | "communication";

export interface CommissionDefinition {
  id: CommissionId;
  label: string;
  route: string;
  category: string;
  tone: CommissionId;
  icon: LucideIcon;
  aliases: string[];
  description: string;
}

export const COMMISSIONS: readonly CommissionDefinition[] = [
  { id: "voirie", label: "Voirie", route: "/voirie", category: "Voirie", tone: "voirie", icon: Route, aliases: ["voirie", "routes", "route"], description: "Dossiers, chantiers, signalements et patrimoine routier" },
  { id: "batiments", label: "Bâtiments", route: "/batiments", category: "Bâtiments", tone: "batiments", icon: Building2, aliases: ["bâtiment", "bâtiments", "batiment", "batiments"], description: "Travaux, interventions et équipements communaux" },
  { id: "salles", label: "Gestion des salles", route: "/gestion-des-salles", category: "Gestion des salles", tone: "salles", icon: Warehouse, aliases: ["gestion des salles", "salles communales", "salle", "salles"], description: "Salles, dossiers, échéances et interventions" },
  { id: "communication", label: "Communication", route: "/communication", category: "Communication", tone: "communication", icon: Megaphone, aliases: ["communication", "communications"], description: "Dossiers, échéances, documents et tâches" },
] as const;

const clean = (value?: string) => (value ?? "").trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

export function getCommission(value?: string) {
  const normalized = clean(value);
  return COMMISSIONS.find((commission) => commission.aliases.some((alias) => clean(alias) === normalized));
}

export function getCommissionById(id?: string) {
  return COMMISSIONS.find((commission) => commission.id === id);
}

export function isInCommission(value: string | undefined, commission: CommissionDefinition) {
  return getCommission(value)?.id === commission.id;
}
