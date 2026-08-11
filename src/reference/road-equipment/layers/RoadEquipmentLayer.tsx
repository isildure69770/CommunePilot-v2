import { CircleMarker, Popup } from "react-leaflet";
import { useRoadEquipment } from "../../../features/road-equipment/hooks/useRoadEquipment";

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
      {equipment.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.latitude, item.longitude]}
          radius={7}
          pathOptions={{
            weight: 2,
            fillOpacity: 0.85,
            color: item.origin === "OSM" ? "#2563eb" : "#7c3aed",
            fillColor: item.origin === "OSM" ? "#60a5fa" : "#a78bfa",
          }}
        >
          <Popup>
            <div className="map-popup-content">
              <strong>{getEmoji(item.category)} {item.name || item.category}</strong>
              {item.name && <span>Type : {item.category}</span>}
              <span>État : {item.status}</span>
              {item.photo && <img className="map-popup-equipment-photo" src={item.photo} alt={item.name || item.category} />}
              {item.lastInspectionDate && <span>Dernier contrôle : {new Intl.DateTimeFormat("fr-FR").format(new Date(`${item.lastInspectionDate}T12:00:00`))}</span>}
              {item.maintenanceHistory.length > 0 && <span>{item.maintenanceHistory.length} entretien{item.maintenanceHistory.length > 1 ? "s" : ""} enregistré{item.maintenanceHistory.length > 1 ? "s" : ""}</span>}
              {item.interventions.length > 0 && <span>{item.interventions.length} intervention{item.interventions.length > 1 ? "s" : ""} associée{item.interventions.length > 1 ? "s" : ""}</span>}
              <span>
                Origine : {item.origin === "OSM" ? "Source OSM" : "Ajout CommunePilot"}
              </span>
              {item.osmId && <span>Identifiant OSM : {item.osmId}</span>}
              {item.material && <span>Matériau : {item.material}</span>}
              {item.notes && <p>{item.notes}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
