import { CircleMarker, Popup } from "react-leaflet";
import { useRoadEquipment } from "../../../features/road-equipment/hooks/useRoadEquipment";
import { getRoadEquipmentAlerts, getRoadEquipmentTotalCost } from "../../../features/road-equipment/services/roadEquipmentTracking";

function getEmoji(category?: string) {
  switch (category) {
    case "Banc": return "🪑";
    case "Barrière / portail": return "🚧";
    case "Corbeille": return "🗑️";
    case "Point déchets": return "♻️";
    case "Point d'eau potable": return "🚰";
    case "Poteau incendie": return "🚒";
    case "Lampadaire": return "💡";
    case "Panneau de signalisation": return "🚦";
    case "Borne": return "📍";
    case "Armoire technique": return "⚡";
    default: return "🔧";
  }
}

export default function RoadEquipmentLayer() {
  const { equipment } = useRoadEquipment();

  return (
    <>
      {equipment.map((item) => {
        const alerts = getRoadEquipmentAlerts(item);
        const isOverdue = alerts.some((alert) => alert.level === "overdue");
        const totalCost = getRoadEquipmentTotalCost(item);
        return (
        <CircleMarker
          key={item.id}
          center={[item.latitude, item.longitude]}
          radius={7}
          pathOptions={{
            weight: 2,
            fillOpacity: 0.85,
            color: isOverdue ? "#b91c1c" : item.origin === "OSM" ? "#2563eb" : "#7c3aed",
            fillColor: isOverdue ? "#ef4444" : alerts.length > 0 ? "#f59e0b" : item.origin === "OSM" ? "#60a5fa" : "#a78bfa",
          }}
        >
          <Popup>
            <div className="map-popup-content">
              <strong>{getEmoji(item.category)} {item.name || item.category}</strong>
              {item.name && <span>Type : {item.category}</span>}
              <span>État : {item.status}</span>
              {item.photo && <img className="map-popup-equipment-photo" src={item.photo} alt={item.name || item.category} />}
              {item.lastInspectionDate && <span>Dernier contrôle : {new Intl.DateTimeFormat("fr-FR").format(new Date(`${item.lastInspectionDate}T12:00:00`))}</span>}
              {item.nextInspectionDate && <span>Prochain contrôle : {new Intl.DateTimeFormat("fr-FR").format(new Date(`${item.nextInspectionDate}T12:00:00`))}</span>}
              {item.nextMaintenanceDate && <span>Prochain entretien : {new Intl.DateTimeFormat("fr-FR").format(new Date(`${item.nextMaintenanceDate}T12:00:00`))}</span>}
              {alerts.map((alert) => <strong key={alert.kind} className={`map-popup-alert alert-${alert.level}`}>{alert.label} {alert.level === "overdue" ? "en retard" : "à venir"}</strong>)}
              {item.maintenanceHistory.length > 0 && <span>{item.maintenanceHistory.length} entretien{item.maintenanceHistory.length > 1 ? "s" : ""} enregistré{item.maintenanceHistory.length > 1 ? "s" : ""}</span>}
              {item.interventions.length > 0 && <span>{item.interventions.length} intervention{item.interventions.length > 1 ? "s" : ""} associée{item.interventions.length > 1 ? "s" : ""}</span>}
              {totalCost > 0 && <span>Coût cumulé : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalCost)}</span>}
              <span>
                Origine : {item.origin === "OSM" ? "Source OSM" : "Ajout CommunePilot"}
              </span>
              {item.osmId && <span>Identifiant OSM : {item.osmId}</span>}
              {item.material && <span>Matériau : {item.material}</span>}
              {item.notes && <p>{item.notes}</p>}
            </div>
          </Popup>
        </CircleMarker>
      )})}
    </>
  );
}
