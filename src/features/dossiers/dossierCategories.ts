import type { Dossier } from "./types/dossier";
import { COMMISSIONS, getCommission } from "../commissions/commissions";

export const DOSSIER_CATEGORIES = [
  "Voirie",
  "Bâtiments",
  "Conseil municipal",
  "Communication",
  "Gestion des salles",
  "Finances",
] as const;

export const UNKNOWN_CATEGORY_LABEL = "Autres catégories";

export function normalizeDossierCategory(category?: string) {
  return category?.trim() ?? "";
}

export function isUncategorizedDossier(dossier: Pick<Dossier, "category">) {
  return normalizeDossierCategory(dossier.category) === "";
}

export function getDossierCategorySection(category?: string) {
  const normalizedCategory = normalizeDossierCategory(category);
  if (!normalizedCategory) return null;

  return DOSSIER_CATEGORIES.includes(
    normalizedCategory as (typeof DOSSIER_CATEGORIES)[number],
  )
    ? normalizedCategory
    : UNKNOWN_CATEGORY_LABEL;
}

const CATEGORY_ROUTES: Record<string, { label: string; to: string }> = {
  Voirie: { label: "Retour à Voirie", to: "/voirie" },
  Bâtiments: { label: "Retour à Bâtiments", to: "/batiments" },
  "Conseil municipal": { label: "Retour au Conseil municipal", to: "/conseil-municipal" },
};

export function getDossierReturnTarget(category?: string) {
  const normalized = normalizeDossierCategory(category);
  const commission = getCommission(normalized);
  if (commission) return { label: `Retour à ${commission.label}`, to: commission.route };
  return CATEGORY_ROUTES[normalized] ?? { label: "Dossiers non classés", to: "/dossiers" };
}

export const COMMISSION_CATEGORIES = COMMISSIONS.map((commission) => commission.category);
