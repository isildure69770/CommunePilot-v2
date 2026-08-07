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

import { initialChantiers } from "../../voirie/data/chantiers";
import { initialSignalements } from "../../signalements/data/signalements";



delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow,
});

const CENTER_LATITUDE = 45.790833;
const CENTER_LONGITUDE = 4.4675;

export default function CommuneMapPage() {
  return (
    <section className="commune-map-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Centre de commande
          </span>

          <h2>
            Carte de la commune
          </h2>

          <p>
            Visualisez les chantiers et les signalements
            sur une seule carte.
          </p>
        </div>
      </div>

      <div className="commune-map-legend">
        <div>
          <span className="legend-dot chantier-dot" />
          Chantiers
        </div>

        <div>
          <span className="legend-dot signalement-dot" />
          Signalements
        </div>
      </div>

      <div className="commune-map-container">
        <MapContainer
          center={[
            CENTER_LATITUDE,
            CENTER_LONGITUDE,
          ]}
          zoom={15}
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

          {initialChantiers.map((chantier) => (
            <Marker
              key={`chantier-${chantier.id}`}
              position={[
                chantier.latitude,
                chantier.longitude,
              ]}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>
                    🚧 {chantier.title}
                  </strong>

                  <span>
                    {chantier.location}
                  </span>

                  <span>
                    Statut : {chantier.status}
                  </span>

                  <span>
                    Avancement : {chantier.progress} %
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {initialSignalements.map((signalement) => (
            <Marker
              key={`signalement-${signalement.id}`}
              position={[
                signalement.latitude,
                signalement.longitude,
              ]}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>
                    ⚠️ {signalement.title}
                  </strong>

                  <span>
                    {signalement.location}
                  </span>

                  <span>
                    Statut : {signalement.status}
                  </span>

                  <span>
                    Priorité : {signalement.priority}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}