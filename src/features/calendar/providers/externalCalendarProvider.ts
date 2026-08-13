import type { CalendarEvent } from "../types";

export interface CalendarProvider {
  readonly id: "microsoft-graph" | "google";
  readonly enabled: boolean;
  importEvents(): Promise<CalendarEvent[]>;
  exportEvent?(event: CalendarEvent): Promise<void>;
}

export type ExternalCalendarProvider = CalendarProvider;

export const disabledMicrosoftCalendarProvider: CalendarProvider = {
  id: "microsoft-graph", enabled: false,
  async importEvents() { throw new Error("Synchronisation Outlook désactivée : consentement Calendar.Read requis."); },
  async exportEvent() { throw new Error("Synchronisation Outlook désactivée : consentement Calendars.ReadWrite requis."); },
};
