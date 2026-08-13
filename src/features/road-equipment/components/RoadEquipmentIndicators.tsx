import { AlertTriangle, CalendarCheck, ClipboardClock, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useRoadEquipment } from "../hooks/useRoadEquipment";
import { getRoadEquipmentAlerts } from "../services/roadEquipmentTracking";

export default function RoadEquipmentIndicators() {
  const { equipment, loading } = useRoadEquipment();
  const indicators = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: equipment.length,
      toCheck: equipment.filter((item) => getRoadEquipmentAlerts(item).some((alert) => alert.kind === "inspection")).length,
      lateInterventions: equipment.reduce((total, item) => total + item.interventions.filter((intervention) => intervention.status !== "Terminée" && Boolean(intervention.date) && intervention.date < today).length, 0),
      poorCondition: equipment.filter((item) => /(mauvais|dégrad|hors service|non conforme|à réparer)/i.test(item.status)).length,
    };
  }, [equipment]);

  return <section className="voirie-equipment-indicators" aria-label="Indicateurs du patrimoine voirie">
    <article><MapPin /><span><strong>{loading ? "—" : indicators.total}</strong><small>Équipements</small></span></article>
    <article><CalendarCheck /><span><strong>{loading ? "—" : indicators.toCheck}</strong><small>À contrôler</small></span></article>
    <article className="indicator-warning"><ClipboardClock /><span><strong>{loading ? "—" : indicators.lateInterventions}</strong><small>Interventions en retard</small></span></article>
    <article className="indicator-danger"><AlertTriangle /><span><strong>{loading ? "—" : indicators.poorCondition}</strong><small>Mauvais état / conformité</small></span></article>
  </section>;
}
