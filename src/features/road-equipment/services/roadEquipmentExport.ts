import type { RoadEquipment } from "../types/roadEquipment";
import { getRoadEquipmentAlerts, getRoadEquipmentTotalCost } from "./roadEquipmentTracking";

function csvCell(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export function roadEquipmentToCsv(items: RoadEquipment[]) {
  const headers = ["Identifiant", "Nom", "Type", "État", "Source", "Latitude", "Longitude", "Dernier contrôle", "Prochain contrôle", "Prochain entretien", "Alertes", "Coût cumulé (€)"];
  const rows = items.map((item) => [
    item.id, item.name, item.category, item.status, item.origin, item.latitude, item.longitude,
    item.lastInspectionDate ?? "", item.nextInspectionDate ?? "", item.nextMaintenanceDate ?? "",
    getRoadEquipmentAlerts(item).map((alert) => `${alert.label} ${alert.level === "overdue" ? "en retard" : "proche"}`).join("; "),
    getRoadEquipmentTotalCost(item).toFixed(2),
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n")}`;
}

export function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
