import type { AlertSyncStatus, FieldAlert, LocalNotification, Mission } from "./types";

function repository<T>(key: string, event: string) {
  return {
    list(): T[] { try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } },
    save(values: T[]) { localStorage.setItem(key, JSON.stringify(values)); window.dispatchEvent(new Event(event)); },
    subscribe(callback: () => void) { window.addEventListener(event, callback); return () => window.removeEventListener(event, callback); },
  };
}
export const missionRepository = repository<Mission>("communepilot-missions-v1", "communepilot:missions");
const ALERT_KEY = "communepilot-field-alerts-v1";
const ALERT_EVENT = "communepilot:alerts";
const SYNC_EVENT = "communepilot:alerts-sync";
const API_PATH = import.meta.env.VITE_FIELD_ALERTS_API_PATH || "/api/field-alerts";
let syncStatus: AlertSyncStatus = "local";
let syncError = "";
let pendingSync: Promise<FieldAlert[]> | null = null;

function normalizeAlert(value: FieldAlert): FieldAlert {
  const createdAt = value.createdAt || new Date().toISOString();
  return { ...value, photos: Array.isArray(value.photos) ? value.photos : [], updatedAt: value.updatedAt || createdAt, history: Array.isArray(value.history) ? value.history : [] };
}

function alertList(): FieldAlert[] {
  try { const values = JSON.parse(localStorage.getItem(ALERT_KEY) ?? "[]"); return Array.isArray(values) ? values.map(normalizeAlert) : []; }
  catch { return []; }
}

function setSyncStatus(status: AlertSyncStatus, error = "") {
  syncStatus = status; syncError = error; window.dispatchEvent(new Event(SYNC_EVENT));
}

function mergeAlerts(local: FieldAlert[], remote: FieldAlert[]) {
  const merged = new Map<string, FieldAlert>();
  for (const item of [...local, ...remote]) {
    const normalized = normalizeAlert(item); const existing = merged.get(normalized.id);
    if (!existing) { merged.set(normalized.id, normalized); continue; }
    const newer = normalized.updatedAt > existing.updatedAt ? normalized : existing;
    const localVersion = local.find((candidate) => candidate.id === normalized.id);
    merged.set(normalized.id, { ...newer, photos: localVersion?.photos.some((photo) => photo.dataUrl) ? localVersion.photos : newer.photos });
  }
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function saveAlertLocal(values: FieldAlert[]) {
  localStorage.setItem(ALERT_KEY, JSON.stringify(values.map(normalizeAlert))); window.dispatchEvent(new Event(ALERT_EVENT));
}

async function synchronizeAlerts(): Promise<FieldAlert[]> {
  if (pendingSync) return pendingSync;
  pendingSync = (async () => {
    setSyncStatus("syncing");
    try {
      const local = alertList();
      const response = await fetch(API_PATH, { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alerts: local }) });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Connexion Azure requise ou rôle insuffisant." : `Service Azure indisponible (${response.status}).`);
      const body = await response.json() as { alerts?: FieldAlert[] };
      const merged = mergeAlerts(local, Array.isArray(body.alerts) ? body.alerts : []); saveAlertLocal(merged); setSyncStatus("synced"); return merged;
    } catch (error) { setSyncStatus("error", error instanceof Error ? error.message : "Synchronisation impossible."); return alertList(); }
    finally { pendingSync = null; }
  })();
  return pendingSync;
}

export const alertRepository = {
  list: alertList,
  save(values: FieldAlert[]) { saveAlertLocal(values); void synchronizeAlerts(); },
  subscribe(callback: () => void) { window.addEventListener(ALERT_EVENT, callback); return () => window.removeEventListener(ALERT_EVENT, callback); },
  subscribeSync(callback: () => void) { window.addEventListener(SYNC_EVENT, callback); return () => window.removeEventListener(SYNC_EVENT, callback); },
  getSyncState: () => ({ status: syncStatus, error: syncError }),
  synchronize: synchronizeAlerts,
};
export const notificationRepository = repository<LocalNotification>("communepilot-notifications-v1", "communepilot:notifications");
export function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
