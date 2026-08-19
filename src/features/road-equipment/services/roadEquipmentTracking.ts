import type { RoadEquipment } from "../types/roadEquipment";

export interface RoadEquipmentAlert {
  kind: "inspection" | "maintenance";
  label: string;
  date: string;
  level: "overdue" | "soon";
}

const UPCOMING_DAYS = 30;

export function getRoadEquipmentAlerts(
  equipment: RoadEquipment,
  now = new Date(),
): RoadEquipmentAlert[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const soonLimit = new Date(today);
  soonLimit.setDate(soonLimit.getDate() + UPCOMING_DAYS);

  return [
    { kind: "inspection" as const, label: "Contrôle", date: equipment.nextInspectionDate },
    { kind: "maintenance" as const, label: "Entretien", date: equipment.nextMaintenanceDate },
  ].flatMap(({ kind, label, date }) => {
    if (!date) return [];
    const dueDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(dueDate.getTime()) || dueDate > soonLimit) return [];
    return [{ kind, label, date, level: dueDate < today ? "overdue" as const : "soon" as const }];
  });
}

export function getRoadEquipmentTotalCost(equipment: RoadEquipment) {
  return [...equipment.maintenanceHistory, ...equipment.interventions].reduce(
    (total, entry) => total + (Number.isFinite(entry.cost) ? entry.cost ?? 0 : 0),
    0,
  );
}

export function getRoadEquipmentStats(items: RoadEquipment[]) {
  const alerts = items.flatMap((item) => getRoadEquipmentAlerts(item).map((alert) => ({ item, alert })));
  return {
    total: items.length,
    overdue: alerts.filter(({ alert }) => alert.level === "overdue").length,
    soon: alerts.filter(({ alert }) => alert.level === "soon").length,
    totalCost: items.reduce((total, item) => total + getRoadEquipmentTotalCost(item), 0),
    byCategory: Object.entries(items.reduce<Record<string, number>>((result, item) => ({ ...result, [item.category]: (result[item.category] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
    byStatus: Object.entries(items.reduce<Record<string, number>>((result, item) => ({ ...result, [item.status || "Non renseigné"]: (result[item.status || "Non renseigné"] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
  };
}
