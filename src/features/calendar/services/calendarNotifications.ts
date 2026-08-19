import { makeId, notificationRepository } from "../../field/repository";
import { calendarRepository } from "./calendarRepository";

export function processCalendarReminders(events = calendarRepository.list(), now = new Date()) {
  const notifications = notificationRepository.list(); let changed = false;
  const updated = events.map((event) => ({ ...event, reminders: event.reminders.map((reminder) => {
    if (reminder.notifiedAt || event.status === "Annulé") return reminder;
    const due = new Date(event.startAt).getTime() - reminder.minutesBefore * 60_000;
    if (due > now.getTime() || new Date(event.startAt).getTime() < now.getTime() - 86_400_000) return reminder;
    notifications.unshift({ id: makeId("notif"), userIds: [...new Set([event.organizerId, ...event.participantIds].filter(Boolean))], title: `Rappel · ${event.title}`, message: event.allDay ? "Événement aujourd’hui" : new Date(event.startAt).toLocaleString("fr-FR"), link: `/calendrier?event=${event.id}`, createdAt: now.toISOString(), readBy: [] });
    changed = true; return { ...reminder, notifiedAt: now.toISOString() };
  }) }));
  if (changed) { updated.forEach((event) => calendarRepository.save(event)); notificationRepository.save(notifications); }
  return changed;
}
