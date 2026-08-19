import type { CalendarEvent } from "../types";
import { externalCalendarRepository } from "../services/calendarRepository";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
] as const;

export type CalendarDestination = "Général" | "Voirie" | "Bâtiments" | "Gestion des salles" | "Communication";
export interface GoogleCalendarMapping {
  id: string;
  name: string;
  color?: string;
  accessRole: string;
  primary: boolean;
  enabled: boolean;
  destination: CalendarDestination;
  syncToken?: string;
}
export interface GoogleCalendarState { calendars: GoogleCalendarMapping[]; lastSyncAt?: string; accountEmail?: string; }

const STATE_KEY = "communepilot-google-calendar-state-v1";
const TOKEN_KEY = "communepilot-google-calendar-access-token";
const API = "https://www.googleapis.com/calendar/v3";

function readState(): GoogleCalendarState {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) ?? '{"calendars":[]}') as GoogleCalendarState; }
  catch { return { calendars: [] }; }
}
function saveState(state: GoogleCalendarState) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
export const googleCalendarStateRepository = { read: readState, save: saveState };

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type TokenClient = { requestAccessToken(options?: { prompt?: string }): void };
declare global {
  interface Window { google?: { accounts: { oauth2: { initTokenClient(config: { client_id: string; scope: string; callback(response: TokenResponse): void; error_callback?(error: unknown): void }): TokenClient; revoke(token: string, callback: () => void): void } } }; }
}

let scriptPromise: Promise<void> | undefined;
function loadGoogleIdentityServices() {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Le service de connexion Google n’a pas pu être chargé."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { const error = new Error(`Google Calendar a répondu ${response.status}.`) as Error & { status?: number }; error.status = response.status; throw error; }
  return response.json() as Promise<T>;
}

export class GoogleCalendarProvider {
  readonly id = "google" as const;
  readonly enabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  get connected() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
  private token() { const token = sessionStorage.getItem(TOKEN_KEY); if (!token) throw new Error("Reconnectez Google Calendar pour continuer."); return token; }

  async connect() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) throw new Error("Configuration Google requise : renseignez VITE_GOOGLE_CLIENT_ID.");
    await loadGoogleIdentityServices();
    return new Promise<void>((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_CALENDAR_SCOPES.join(" "),
        callback: (response) => {
          if (!response.access_token) { reject(new Error(response.error_description ?? response.error ?? "Connexion Google annulée.")); return; }
          sessionStorage.setItem(TOKEN_KEY, response.access_token);
          resolve();
        },
        error_callback: () => reject(new Error("Connexion Google interrompue.")),
      });
      client.requestAccessToken({ prompt: "consent" });
    });
  }

  async listCalendars() {
    const token = this.token();
    const current = readState();
    const received: Array<{ id: string; summary: string; backgroundColor?: string; accessRole?: string; primary?: boolean }> = [];
    let pageToken = "";
    do {
      const result: { items?: typeof received; nextPageToken?: string } = await api(`/users/me/calendarList?maxResults=250${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`, token);
      received.push(...(result.items ?? [])); pageToken = result.nextPageToken ?? "";
    } while (pageToken);
    const calendars = received.map((item) => {
      const previous = current.calendars.find((entry) => entry.id === item.id);
      return { id: item.id, name: item.summary, color: item.backgroundColor, accessRole: item.accessRole ?? "reader", primary: Boolean(item.primary), enabled: previous?.enabled ?? false, destination: previous?.destination ?? "Général", syncToken: previous?.syncToken } satisfies GoogleCalendarMapping;
    });
    saveState({ ...current, calendars });
    return calendars;
  }

  async sync(): Promise<{ events: CalendarEvent[]; lastSyncAt: string }> {
    const token = this.token();
    const state = readState();
    const existing = externalCalendarRepository.list().filter((event) => event.provider === "google");
    const byCalendar = new Map<string, CalendarEvent[]>(state.calendars.map((calendar) => [calendar.id, existing.filter((event) => event.externalCalendarId === calendar.id)]));
    for (const calendar of state.calendars.filter((entry) => entry.enabled)) {
      let incremental = Boolean(calendar.syncToken);
      let pageToken = "";
      const changed: CalendarEvent[] = [];
      const deletedIds = new Set<string>();
      try {
        do {
          const params = new URLSearchParams({ maxResults: "2500", singleEvents: "true", showDeleted: "true" });
          if (pageToken) params.set("pageToken", pageToken);
          if (incremental && calendar.syncToken) params.set("syncToken", calendar.syncToken);
          else params.set("timeMin", new Date(Date.now() - 365 * 86400000).toISOString());
          const result: { items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string } = await api(`/calendars/${encodeURIComponent(calendar.id)}/events?${params}`, token);
          for (const item of result.items ?? []) {
            if (item.status === "cancelled") deletedIds.add(item.id);
            else { const event = toCalendarEvent(item, calendar); if (event) changed.push(event); }
          }
          pageToken = result.nextPageToken ?? "";
          if (result.nextSyncToken) calendar.syncToken = result.nextSyncToken;
        } while (pageToken);
      } catch (error) {
        if (incremental && (error as { status?: number }).status === 410) {
          calendar.syncToken = undefined;
          saveState({ ...state, calendars: state.calendars });
          return this.sync();
        }
        throw error;
      }
      const current = incremental ? byCalendar.get(calendar.id) ?? [] : [];
      const updates = new Map(current.map((event) => [event.externalId!, event]));
      for (const event of changed) updates.set(event.externalId!, event);
      for (const id of deletedIds) updates.delete(id);
      byCalendar.set(calendar.id, [...updates.values()]);
    }
    const enabledIds = new Set(state.calendars.filter((entry) => entry.enabled).map((entry) => entry.id));
    const events = [...byCalendar.entries()].flatMap(([id, values]) => enabledIds.has(id) ? values : []);
    const lastSyncAt = new Date().toISOString();
    externalCalendarRepository.replaceProvider("google", events);
    saveState({ ...state, calendars: state.calendars, lastSyncAt });
    return { events, lastSyncAt };
  }

  disconnect(removeImported = false) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token && window.google?.accounts.oauth2) window.google.accounts.oauth2.revoke(token, () => undefined);
    if (removeImported) externalCalendarRepository.removeProvider("google");
  }
}

interface GoogleEvent { id: string; status?: string; summary?: string; description?: string; location?: string; colorId?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string }; created?: string; updated?: string; visibility?: string; organizer?: { email?: string }; }
function toCalendarEvent(item: GoogleEvent, calendar: GoogleCalendarMapping): CalendarEvent | undefined {
  const startAt = item.start?.dateTime ?? item.start?.date;
  const endAt = item.end?.dateTime ?? item.end?.date;
  if (!startAt || !endAt || item.status === "cancelled") return undefined;
  return { id: `google:${calendar.id}:${item.id}`, title: item.summary ?? "Événement Google", type: "Autre", description: item.description ?? "", startAt, endAt, allDay: Boolean(item.start?.date), location: item.location ?? "", address: "", participantIds: [], organizerId: "", status: "Confirmé", color: calendar.color ?? "#4285f4", category: calendar.destination, attachments: [], notes: "", visibility: item.visibility === "private" ? "Privé responsable" : "Public mairie", reminders: [], createdAt: item.created ?? item.updated ?? new Date().toISOString(), updatedAt: item.updated ?? new Date().toISOString(), createdBy: "google", provider: "google", externalId: item.id, externalCalendarId: calendar.id, externalCalendarName: calendar.name, managedExternally: true };
}

export const googleCalendarProvider = new GoogleCalendarProvider();
