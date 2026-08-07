import type { Chantier } from "../types/chantier";

const STORAGE_KEY = "communepilot-chantiers";

export function loadChantiers(): Chantier[] | null {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as Chantier[];
  } catch {
    return null;
  }
}

export function saveChantiers(chantiers: Chantier[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chantiers),
  );
}