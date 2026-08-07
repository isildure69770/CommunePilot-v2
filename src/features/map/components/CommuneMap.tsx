import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

import MapClickHandler from "./MapClickHandler";

import type {
  CommuneMapMarker,
} from "../hooks/useCommuneMap";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow,
});

interface SelectedPosition {
  latitude: number;
  longitude: number;
}

interface CommuneMapProps {
  markers: CommuneMapMarker[];

  centerLatitude?: number;
  centerLongitude?: number;

  zoom?: number;
  height?: number;

  selectedPosition?: SelectedPosition | null;

  onMapClick?: (
    latitude: number,
    longitude: number,
  ) => void;
}

const DEFAULT_LATITUDE = 45.790833;
const DEFAULT_LONGITUDE = 4.4675;

export default function CommuneMap({
  markers,
  centerLatitude = DEFAULT_LATITUDE,
  centerLongitude = DEFAULT_LONGITUDE,
  zoom = 15,
  height = 650,
  selectedPosition = null,
  onMapClick,
}: CommuneMapProps) {
  return (
    <div
      className="commune-map-container"
      style={{
        height,
      }}
    >
      <MapContainer
        center={[
          centerLatitude,
          centerLongitude,
        ]}
        zoom={zoom}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onMapClick && (
  <MapClickHandler
    onSelect={onMapClick}
  />
)}
        {selectedPosition && (
          <Marker
            position={[
              selectedPosition.latitude,
              selectedPosition.longitude,
            ]}
          >
            <Popup>
              <div className="map-popup-content">
                <strong>
                  📍 Nouvel emplacement
                </strong>

                <span>
                  Cliquez sur « Créer un signalement »
                  pour continuer.
                </span>

                <span>
                  Latitude :{" "}
                  {selectedPosition.latitude.toFixed(6)}
                </span>

                <span>
                  Longitude :{" "}
                  {selectedPosition.longitude.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {markers.map((mapMarker) => (
          <Marker
            key={mapMarker.id}
            position={[
              mapMarker.latitude,
              mapMarker.longitude,
            ]}
          >
            <Popup>
              <div className="map-popup-content">
                <strong>
                  {mapMarker.type === "chantier"
                    ? "🚧"
                    : "⚠️"}{" "}
                  {mapMarker.title}
                </strong>

                <span>
                  📍 {mapMarker.location}
                </span>

                <span>
                  Type :{" "}
                  {mapMarker.type === "chantier"
                    ? "Chantier"
                    : "Signalement"}
                </span>

                <span>
                  Statut : {mapMarker.status}
                </span>

                <span>
                  Priorité : {mapMarker.priority}
                </span>

                {mapMarker.description && (
                  <p>
                    {mapMarker.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}