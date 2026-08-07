import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow,
});

interface MapClickSelectorProps {
  latitude: number;
  longitude: number;

  onChange: (
    latitude: number,
    longitude: number,
  ) => void;

  title?: string;
  height?: number;
}

interface ClickHandlerProps {
  onChange: (
    latitude: number,
    longitude: number,
  ) => void;
}

function ClickHandler({
  onChange,
}: ClickHandlerProps) {
  useMapEvents({
    click(event) {
      onChange(
        event.latlng.lat,
        event.latlng.lng,
      );
    },
  });

  return null;
}

export default function MapClickSelector({
  latitude,
  longitude,
  onChange,
  title = "Emplacement sélectionné",
  height = 380,
}: MapClickSelectorProps) {
  return (
    <div className="map-click-selector">
      <div className="map-selector-header">
        <div>
          <strong>
            Position sur la carte
          </strong>

          <p>
            Cliquez directement sur la carte
            pour déplacer le marqueur.
          </p>
        </div>

        <div className="map-coordinates">
          <span>
            Lat. {latitude.toFixed(6)}
          </span>

          <span>
            Long. {longitude.toFixed(6)}
          </span>
        </div>
      </div>

      <div
        className="map-selector-map"
        style={{
          height,
        }}
      >
        <MapContainer
          center={[
            latitude,
            longitude,
          ]}
          zoom={16}
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

          <ClickHandler
            onChange={onChange}
          />

          <Marker
            position={[
              latitude,
              longitude,
            ]}
            draggable
            eventHandlers={{
              dragend(event) {
                const currentMarker =
                  event.target;

                const position =
                  currentMarker.getLatLng();

                onChange(
                  position.lat,
                  position.lng,
                );
              },
            }}
          >
            <Popup>
              {title}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <p className="map-selector-help">
        Vous pouvez soit cliquer sur la carte,
        soit déplacer directement le marqueur.
      </p>
    </div>
  );
}