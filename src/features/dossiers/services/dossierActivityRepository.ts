export type DossierActivityType = "dossier" | "document" | "mail" | "mission" | "calendar";

export interface DossierActivity {
  id: string;
  dossierId: number;
  timestamp: string;
  type: DossierActivityType;
  action: string;
  label: string;
  authorId?: string;
  documentId?: string;
  mailId?: number;
  missionId?: string;
  calendarEventId?: string;
}

const STORAGE_KEY = "communepilot-dossier-activities-v1";
export const DOSSIER_ACTIVITIES_CHANGED = "communepilot:dossier-activities";

function listAll(): DossierActivity[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value as DossierActivity[] : [];
  } catch { return []; }
}

export const dossierActivityRepository = {
  list(dossierId: number) {
    return listAll().filter((entry) => entry.dossierId === dossierId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
  add(value: Omit<DossierActivity, "id" | "timestamp"> & { id?: string; timestamp?: string }) {
    const entry: DossierActivity = {
      ...value,
      id: value.id ?? `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: value.timestamp ?? new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...listAll()]));
    window.dispatchEvent(new Event(DOSSIER_ACTIVITIES_CHANGED));
    return entry;
  },
};
