import type { Signalement } from "../types/signalement";

const STORAGE_KEY = "communepilot-signalements";

export function loadSignalements(): Signalement[] | null {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as Signalement[];
  } catch {
    return null;
  }
}

export function saveSignalements(
  signalements: Signalement[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(signalements),
  );
}