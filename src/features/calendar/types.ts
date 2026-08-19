export const EVENT_TYPES = ["Conseil municipal", "Commission", "Réunion", "Rendez-vous", "Manifestation", "Intervention", "Échéance", "Autre"] as const;
export type CalendarEventType = (typeof EVENT_TYPES)[number];
export type CalendarEventStatus = "Planifié" | "Confirmé" | "Annulé" | "Terminé";
export type EventVisibility = "Public mairie" | "Restreint participants" | "Privé responsable";
export type ReminderPreset = "0" | "15" | "60" | "1440" | "10080" | "custom";

export interface CalendarAttachment { id: string; label: string; url: string; }
export interface CalendarReminder { id: string; minutesBefore: number; notifiedAt?: string; }
export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  description: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location: string;
  address: string;
  participantIds: string[];
  organizerId: string;
  status: CalendarEventStatus;
  color: string;
  category: string;
  dossierId?: number;
  missionId?: string;
  attachments: CalendarAttachment[];
  notes: string;
  visibility: EventVisibility;
  reminders: CalendarReminder[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  provider?: "google" | "microsoft-graph";
  externalId?: string;
  externalCalendarId?: string;
  externalCalendarName?: string;
  managedExternally?: boolean;
}

export type CalendarSource = "manual" | "mission" | "dossier" | "equipment" | "google" | "microsoft-graph";
export interface CalendarItem extends Omit<CalendarEvent, "reminders" | "createdBy"> {
  source: CalendarSource;
  sourceId: string;
  reminders?: CalendarReminder[];
  createdBy?: string;
  readOnly: boolean;
}

export interface CalendarAuditEntry {
  id: string;
  eventId: string;
  timestamp: string;
  authorId: string;
  action: "created" | "updated" | "deleted" | "linked" | "exported";
  label: string;
}
