import type { Dossier } from "../types/dossier";

const STORAGE_KEY = "communepilot-dossiers";

export function loadDossiers(): Dossier[] | null {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as Dossier[];
  } catch {
    return null;
  }
}

export function saveDossiers(dossiers: Dossier[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(dossiers)
  );
}