import type { CalendarItem } from "../types";

const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsDate = (value: string, allDay: boolean) => allDay ? value.slice(0, 10).replaceAll("-", "") : new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function download(content: string, type: string, name: string) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }

export function exportIcs(items: CalendarItem[], name = "agenda-communal.ics") {
  const body = items.map((item) => ["BEGIN:VEVENT", `UID:${escapeIcs(item.id)}@communepilot.local`, `DTSTAMP:${icsDate(new Date().toISOString(), false)}`, `${item.allDay ? "DTSTART;VALUE=DATE" : "DTSTART"}:${icsDate(item.startAt, item.allDay)}`, `${item.allDay ? "DTEND;VALUE=DATE" : "DTEND"}:${icsDate(item.endAt, item.allDay)}`, `SUMMARY:${escapeIcs(item.title)}`, `DESCRIPTION:${escapeIcs(item.description)}`, `LOCATION:${escapeIcs([item.location, item.address].filter(Boolean).join(" — "))}`, "END:VEVENT"].join("\r\n")).join("\r\n");
  download(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CommunePilot//Calendrier municipal//FR\r\nCALSCALE:GREGORIAN\r\n${body}\r\nEND:VCALENDAR\r\n`, "text/calendar;charset=utf-8", name);
}

export function exportCsv(items: CalendarItem[]) {
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [["Titre", "Type", "Début", "Fin", "Journée entière", "Lieu", "Statut", "Catégorie", "Source"], ...items.map((item) => [item.title, item.type, item.startAt, item.endAt, item.allDay ? "Oui" : "Non", item.location || item.address, item.status, item.category, item.source])];
  download(`\uFEFF${rows.map((row) => row.map(quote).join(";")).join("\n")}`, "text/csv;charset=utf-8", "agenda-communal.csv");
}
