import "leaflet/dist/leaflet.css";

import { useState } from "react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";
import AmenitiesLayer from "../../../reference/amenities/layers/AmenitiesLayer";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

import MapClickHandler from "./MapClickHandler";
import MapLayerControls from "./MapLayerControls";

import CommuneBoundaryLayer from "../../../reference/commune/layers/CommuneBoundaryLayer";
import RoadsLayer from "../../../reference/roads/layers/RoadsLayer";
import HamletsLayer from "../../../reference/hamlets/layers/HamletsLayer";
import BuildingsLayer from "../../../reference/buildings/layers/BuildingsLayer";

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
  location?: string;
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
    location?: string,
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
  const [
    showBoundary,
    setShowBoundary,
  ] = useState(true);

  const [
    showRoads,
    setShowRoads,
  ] = useState(false);

  const [
    showHamlets,
    setShowHamlets,
  ] = useState(false);

  const [
    showBuildings,
    setShowBuildings,
  ] = useState(false);

  const [
    showAmenities,
    setShowAmenities,
  ] = useState(false);

  const [
    showSignalements,
    setShowSignalements,
  ] = useState(false);

  const [
    showChantiers,
    setShowChantiers,
  ] = useState(false);

  function resetToBoundaryOnly() {
    setShowBoundary(true);
    setShowRoads(false);
    setShowHamlets(false);
    setShowBuildings(false);
    setShowAmenities(false);
    setShowSignalements(false);
    setShowChantiers(false);
  }

  const visibleMarkers =
    markers.filter((mapMarker) => {
      if (
        mapMarker.type === "signalement" &&
        !showSignalements
      ) {
        return false;
      }

      if (
        mapMarker.type === "chantier" &&
        !showChantiers
      ) {
        return false;
      }

      /*
       * Les interventions sont liées aux équipements.
       * Elles sont affichées lorsque la couche
       * "Équipements" est activée.
       */
      if (
        mapMarker.type === "intervention" &&
        !showAmenities
      ) {
        return false;
      }

      return true;
    });

  return (
    <div className="commune-map-wrapper">
      <MapLayerControls
        showBoundary={showBoundary}
        showRoads={showRoads}
        showHamlets={showHamlets}
        showBuildings={showBuildings}
        showAmenities={showAmenities}
        showSignalements={showSignalements}
        showChantiers={showChantiers}

        onToggleBoundary={() =>
          setShowBoundary(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleRoads={() =>
          setShowRoads(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleHamlets={() =>
          setShowHamlets(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleBuildings={() =>
          setShowBuildings(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleAmenities={() =>
          setShowAmenities(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleSignalements={() =>
          setShowSignalements(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleChantiers={() =>
          setShowChantiers(
            (currentValue) =>
              !currentValue,
          )
        }

        onReset={resetToBoundaryOnly}
      />

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

          {showBoundary && (
            <CommuneBoundaryLayer />
          )}

          {showRoads && (
            <RoadsLayer />
          )}

          {showHamlets && (
            <HamletsLayer />
          )}

          {showBuildings && (
            <BuildingsLayer />
          )}

          {showAmenities && (
            <AmenitiesLayer />
          )}

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

                  {selectedPosition.location && (
                    <span>
                      Adresse :{" "}
                      {selectedPosition.location}
                    </span>
                  )}

                  <span>
                    Cliquez sur « Créer un
                    signalement » pour continuer.
                  </span>

                  <span>
                    Latitude :{" "}
                    {selectedPosition.latitude.toFixed(
                      6,
                    )}
                  </span>

                  <span>
                    Longitude :{" "}
                    {selectedPosition.longitude.toFixed(
                      6,
                    )}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          {visibleMarkers.map(
            (mapMarker) => (
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
                      {mapMarker.type ===
                      "chantier"
                        ? "🚧"
                        : mapMarker.type ===
                            "intervention"
                          ? "🔧"
                          : "⚠️"}{" "}
                      {mapMarker.title}
                    </strong>

                    <span>
                      📍 {mapMarker.location}
                    </span>

                    <span>
                      Type :{" "}
                      {mapMarker.type ===
                      "chantier"
                        ? "Chantier"
                        : mapMarker.type ===
                            "intervention"
                          ? "Intervention"
                          : "Signalement"}
                    </span>

                    <span>
                      Statut :{" "}
                      {mapMarker.status}
                    </span>

                    {mapMarker.type ===
                      "intervention" &&
                      mapMarker.date && (
                        <span>
                          Date :{" "}
                          {new Date(
                            `${mapMarker.date}T12:00:00`,
                          ).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                      )}

                    {mapMarker.type !==
                      "intervention" && (
                      <span>
                        Priorité :{" "}
                        {mapMarker.priority}
                      </span>
                    )}

                    {mapMarker.description && (
                      <p>
                        {
                          mapMarker.description
                        }
                      </p>
                    )}

                    {mapMarker.type ===
                      "intervention" &&
                      mapMarker.equipmentId && (
                        <a
                          className="secondary-button"
                          href={`/equipments/${mapMarker.equipmentId}`}
                        >
                          Ouvrir la fiche équipement
                        </a>
                      )}
                  </div>
                </Popup>
              </Marker>
            ),
          )}
        </MapContainer>
      </div>
    </div>
  );
}