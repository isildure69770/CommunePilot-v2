import type { CalendarAuditEntry, CalendarEvent } from "../types";

const EVENTS_KEY = "communepilot-calendar-events-v1";
const AUDIT_KEY = "communepilot-calendar-audit-v1";
const EXTERNAL_EVENTS_KEY = "communepilot-calendar-external-events-v1";
export const CALENDAR_CHANGED = "communepilot:calendar";

function read<T>(key: string): T[] {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(parsed) ? parsed as T[] : []; }
  catch { return []; }
}
function write<T>(key: string, values: T[]) { localStorage.setItem(key, JSON.stringify(values)); window.dispatchEvent(new Event(CALENDAR_CHANGED)); }

export interface CalendarRepository {
  list(): CalendarEvent[];
  get(id: string): CalendarEvent | undefined;
  save(event: CalendarEvent): CalendarEvent;
  remove(id: string): void;
  subscribe(callback: () => void): () => void;
}

export const localCalendarRepository: CalendarRepository = {
  list: () => read<CalendarEvent>(EVENTS_KEY).map((event) => ({ ...event, participantIds: event.participantIds ?? [], attachments: event.attachments ?? [], reminders: event.reminders ?? [], visibility: event.visibility ?? "Public mairie" })),
  get(id) { return this.list().find((event) => event.id === id); },
  save(event) { const values = this.list(); const index = values.findIndex((item) => item.id === event.id); if (index >= 0) values[index] = event; else values.unshift(event); write(EVENTS_KEY, values); return event; },
  remove(id) { write(EVENTS_KEY, this.list().filter((event) => event.id !== id)); },
  subscribe(callback) { window.addEventListener(CALENDAR_CHANGED, callback); return () => window.removeEventListener(CALENDAR_CHANGED, callback); },
};

export const externalCalendarRepository = {
  list: () => read<CalendarEvent>(EXTERNAL_EVENTS_KEY),
  replaceProvider(provider: NonNullable<CalendarEvent["provider"]>, events: CalendarEvent[]) {
    const preserved = this.list().filter((event) => event.provider !== provider);
    write(EXTERNAL_EVENTS_KEY, [...events, ...preserved]);
  },
  removeProvider(provider: NonNullable<CalendarEvent["provider"]>) {
    write(EXTERNAL_EVENTS_KEY, this.list().filter((event) => event.provider !== provider));
  },
};

export const calendarAuditRepository = {
  list(eventId?: string) { const entries = read<CalendarAuditEntry>(AUDIT_KEY).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); return eventId ? entries.filter((entry) => entry.eventId === eventId) : entries; },
  add(value: Omit<CalendarAuditEntry, "id" | "timestamp">) { const entry: CalendarAuditEntry = { ...value, id: `cal-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString() }; write(AUDIT_KEY, [entry, ...read<CalendarAuditEntry>(AUDIT_KEY)]); return entry; },
};

export const calendarRepository: CalendarRepository = {
  list: () => [...localCalendarRepository.list(), ...externalCalendarRepository.list()],
  get: (id) => calendarRepository.list().find((event) => event.id === id),
  save(event) {
    if (event.managedExternally) throw new Error("Cet événement est géré par son calendrier externe.");
    return localCalendarRepository.save(event);
  },
  remove(id) {
    const event = calendarRepository.get(id);
    if (event?.managedExternally) throw new Error("Cet événement est géré par son calendrier externe.");
    localCalendarRepository.remove(id);
  },
  subscribe: localCalendarRepository.subscribe,
};
