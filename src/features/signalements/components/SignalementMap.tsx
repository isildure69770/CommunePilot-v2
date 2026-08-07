import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

interface SignalementMapProps {
  latitude: number;
  longitude: number;
  title: string;
  location: string;
  height?: number;
}

export default function SignalementMap({
  latitude,
  longitude,
  title,
  location,
  height = 360,
}: SignalementMapProps) {
  return (
    <div className="signalement-map">
      <MapContainer
        center={[
          latitude,
          longitude,
        ]}
        zoom={16}
        scrollWheelZoom
        style={{
          height,
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            latitude,
            longitude,
          ]}
          icon={markerIcon}
        >
          <Popup>
            <strong>
              {title}
            </strong>

            <br />

            {location}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}