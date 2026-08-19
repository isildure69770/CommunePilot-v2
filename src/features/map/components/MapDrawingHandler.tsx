import { useMapEvents } from "react-leaflet";

export default function MapDrawingHandler({ onPoint }: { onPoint: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click(event) { onPoint(event.latlng.lat, event.latlng.lng); } });
  return null;
}
