import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";



interface MapClickSelectorProps {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;

  onChange: (
  latitude: number,
  longitude: number,
  location?: string,
) => void;
}

interface ClickHandlerProps {
  onChange: (
  latitude: number,
  longitude: number,
  location?: string,
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

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => { map.setView([latitude, longitude], map.getZoom()); }, [latitude, longitude, map]);
  return null;
}

export default function MapClickSelector({
  latitude,
  longitude,
  title = "Emplacement sélectionné",
  height = 380,
  onChange,
}: MapClickSelectorProps) {
  return (
    <div className="map-click-selector">
      <div className="map-selector-header">
        <div>
          <strong>
            Position sur la carte
          </strong>

          <p>
            Cliquez sur la carte pour
            choisir l'emplacement.
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

          <Recenter latitude={latitude} longitude={longitude} />

          <Marker
            position={[
              latitude,
              longitude,
            ]}
            draggable
            eventHandlers={{
              dragend(event) {
                const position =
                  event.target.getLatLng();

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
        Tu peux cliquer sur la carte ou déplacer
        directement le marqueur.
      </p>
    </div>
  );
}
