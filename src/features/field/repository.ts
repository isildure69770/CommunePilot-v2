import type { FieldAlert, LocalNotification, Mission } from "./types";

function repository<T>(key: string, event: string) {
  return {
    list(): T[] { try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } },
    save(values: T[]) { localStorage.setItem(key, JSON.stringify(values)); window.dispatchEvent(new Event(event)); },
    subscribe(callback: () => void) { window.addEventListener(event, callback); return () => window.removeEventListener(event, callback); },
  };
}
export const missionRepository = repository<Mission>("communepilot-missions-v1", "communepilot:missions");
export const alertRepository = repository<FieldAlert>("communepilot-field-alerts-v1", "communepilot:alerts");
export const notificationRepository = repository<LocalNotification>("communepilot-notifications-v1", "communepilot:notifications");
export function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
