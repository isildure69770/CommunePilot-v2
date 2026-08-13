import type { CommuneUser } from "../../access/types";
import type { Dossier } from "../../dossiers/types/dossier";
import type { Mission } from "../../field/types";
import type { RoadEquipment } from "../../road-equipment/types/roadEquipment";
import type { CalendarEvent, CalendarItem } from "../types";

const endAfter = (start: string, minutes = 60) => new Date(new Date(start).getTime() + minutes * 60_000).toISOString();
const base = (id: string, title: string, startAt: string): Pick<CalendarItem, "id"|"sourceId"|"title"|"startAt"|"endAt"|"allDay"|"location"|"address"|"attachments"|"notes"|"createdAt"|"updatedAt"|"readOnly"> => ({ id, sourceId: id, title, startAt, endAt: endAfter(startAt), allDay: !startAt.includes("T"), location: "", address: "", attachments: [], notes: "", createdAt: startAt, updatedAt: startAt, readOnly: true });

export function buildCalendarItems(events: CalendarEvent[], missions: Mission[], dossiers: Dossier[], equipment: RoadEquipment[]): CalendarItem[] {
  const manual: CalendarItem[] = events.map((event) => ({ ...event, source: event.provider ?? "manual", sourceId: event.externalId ?? event.id, readOnly: Boolean(event.managedExternally) }));
  const missionItems: CalendarItem[] = missions.filter((m) => m.dueDate).map((m) => ({ ...base(`mission:${m.id}`, m.title, m.dueDate), source: "mission", sourceId: m.id, type: "Intervention", description: m.description, address: m.address, participantIds: m.assigneeIds, organizerId: "", status: m.status === "Terminée" ? "Terminé" : m.status === "Annulée" ? "Annulé" : "Planifié", color: "#2f80c1", category: m.category, dossierId: m.dossierId, missionId: m.id, visibility: "Restreint participants" }));
  const dossierItems: CalendarItem[] = dossiers.filter((d) => d.deadline).map((d) => ({ ...base(`dossier:${d.id}`, `Échéance — ${d.title}`, `${d.deadline}T09:00:00`), source: "dossier", sourceId: String(d.id), type: "Échéance", description: d.description, participantIds: [], organizerId: "", status: d.status === "Terminé" ? "Terminé" : "Planifié", color: "#8b6bc6", category: d.category, dossierId: d.id, visibility: "Public mairie" }));
  const equipmentItems: CalendarItem[] = equipment.flatMap((item) => [["inspection", "Contrôle", item.nextInspectionDate], ["maintenance", "Entretien", item.nextMaintenanceDate]].flatMap(([kind, label, date]) => date ? [{ ...base(`equipment:${item.id}:${kind}`, `${label} — ${item.name || item.category}`, `${date}T09:00:00`), source: "equipment" as const, sourceId: item.id, type: "Échéance" as const, description: item.maintenanceNotes ?? "", participantIds: [], organizerId: "", status: "Planifié" as const, color: "#36a06f", category: "Voirie", visibility: "Public mairie" as const }] : []));
  return [...manual, ...missionItems, ...dossierItems, ...equipmentItems].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function canSeeCalendarItem(item: CalendarItem, user: CommuneUser) {
  if (user.role === "Maire") return true;
  if (item.source === "google" || item.source === "microsoft-graph") {
    if (item.visibility === "Privé responsable") return item.organizerId === user.id;
    if (item.visibility === "Restreint participants") return item.participantIds.includes(user.id) || item.organizerId === user.id;
    return true;
  }
  if (user.role === "Agent technique") return item.source === "mission" ? item.participantIds.includes(user.id) : item.source === "manual" && (item.participantIds.includes(user.id) || item.organizerId === user.id);
  if (item.visibility === "Privé responsable") return item.organizerId === user.id;
  if (item.visibility === "Restreint participants") return item.organizerId === user.id || item.participantIds.includes(user.id) || user.role === "Adjoint" || user.role === "Agent administratif";
  return true;
}
