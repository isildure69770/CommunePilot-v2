import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { MapPin } from "lucide-react";
import type { Mission } from "./types";

function RefreshMap() {
  const map = useMap();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize(false));
    return () => window.cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

export default function MissionLocationPreview({ mission }: { mission: Mission }) {
  if (mission.latitude == null || mission.longitude == null) return <p className="mission-detail-address"><MapPin/>{mission.address || "Lieu à préciser"}</p>;
  const center: [number, number] = [mission.latitude, mission.longitude];
  return <div className="mission-detail-map" aria-label={`Aperçu du lieu de la mission à ${mission.address || "Montrottier"}`}>
    <MapContainer center={center} zoom={16} zoomControl={false} attributionControl={false} dragging={false} touchZoom={false} doubleClickZoom={false} scrollWheelZoom={false} boxZoom={false} keyboard={false}>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <CircleMarker center={center} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#df3936", fillOpacity: 1 }}/>
      <RefreshMap/>
    </MapContainer>
    <span><MapPin/>{mission.address || "Position GPS à Montrottier"}</span>
  </div>;
}
