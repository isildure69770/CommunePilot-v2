import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useNavigate } from "react-router-dom";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

import MapClickHandler from "./MapClickHandler";
import MapDrawingHandler from "./MapDrawingHandler";
import MapLayerControls from "./MapLayerControls";

import CommuneBoundaryLayer from "../../../reference/commune/layers/CommuneBoundaryLayer";
import RoadsLayer from "../../../reference/roads/layers/RoadsLayer";
import HamletsLayer from "../../../reference/hamlets/layers/HamletsLayer";
import BuildingsLayer from "../../../reference/buildings/layers/BuildingsLayer";
import AmenitiesLayer from "../../../reference/amenities/layers/AmenitiesLayer";
import CadastreLayer from "../../../reference/cadastre/layers/CadastreLayer";
import RoadEquipmentLayer from "../../../reference/road-equipment/layers/RoadEquipmentLayer";

import type {
  CommuneMapMarker,
} from "../hooks/useCommuneMap";
import { STATUS_COLORS, STATUS_LABELS, type CustomMapLayer, type CustomMapSection } from "../types/customLayer";

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

interface AgentPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface CommuneMapProps {
  markers: CommuneMapMarker[];

  centerLatitude?: number;
  centerLongitude?: number;

  zoom?: number;
  height?: number;
  compactControls?: boolean;
  showTerrainProblemsInitially?: boolean;
  agentMode?: boolean;
  agentPosition?: AgentPosition | null;
  agentFocusRequest?: number;

  selectedPosition?: SelectedPosition | null;
  customLayers?: CustomMapLayer[];
  customSections?: CustomMapSection[];
  drawingCoordinates?: Array<[number, number]>;
  waypointCoordinates?: Array<[number, number]>;
  drawingColor?: string;
  onDrawingPoint?: (latitude: number, longitude: number) => void;
  onRemoveCustomSection?: (id: string) => void;
  onToggleCustomLayer?: (id: string) => void;

  onMapClick?: (
    latitude: number,
    longitude: number,
    location?: string,
  ) => void;
  onCreateAtPosition?: (kind: "signalement" | "chantier" | "mission") => void;
}

const PRIORITY_COLORS: Record<string, string> = { Faible: "#32945a", Basse: "#32945a", Normale: "#32945a", Haute: "#e08a25", Urgente: "#d6413e" };

function isValidatedStatus(status: string) {
  return ["Terminée", "Terminé", "Traitée", "Résolu", "Classé", "Validé", "Validée", "Réalisé", "Réalisée", "Transformé en mission"].includes(status);
}

function validatedMapIcon() {
  return L.divIcon({ className: "map-validated-marker", html: `<span aria-hidden="true"><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="11"/><path d="m8.5 14 3.5 3.5 7.5-8"/></svg></span>`, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18] });
}

function terrainProblemIcon(priority: string) {
  const color = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Normale;
  const size = priority === "Urgente" ? 32 : 28;
  return L.divIcon({ className: "terrain-problem-marker", html: `<span aria-hidden="true"><svg viewBox="0 0 32 29"><path style="fill:${color}" d="M16 1.5 30.5 27H1.5L16 1.5Z"/><path class="warning-border" d="M16 1.5 30.5 27H1.5L16 1.5Z"/><path class="warning-mark" d="M16 9v9M16 22.5v.2"/></svg></span>`, iconSize: [size, size], iconAnchor: [size - 2, size - 2], popupAnchor: [-size / 2, -size + 2] });
}

function missionAgentIcon(priority: string, status: string) {
  if (isValidatedStatus(status)) return validatedMapIcon();
  const color = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Normale;
  return L.divIcon({ className: "mission-agent-marker", html: `<span style="background:${color}" aria-hidden="true"><svg viewBox="0 0 26 28"><path class="helmet" d="M7 10a6 6 0 0 1 12 0M5 11h16"/><circle cx="13" cy="14" r="3.5"/><path d="M6.5 25c.5-4.5 2.7-6.7 6.5-6.7s6 2.2 6.5 6.7M13 18.5V25"/><path class="vest" d="m9.5 19.2 3.5 3 3.5-3"/></svg></span>`, iconSize: [26, 28], iconAnchor: [13, 14], popupAnchor: [0, -18] });
}

function chantierConeIcon(priority: string, status: string) {
  if (isValidatedStatus(status)) return validatedMapIcon();
  const color = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Normale;
  return L.divIcon({ className: "chantier-cone-marker", html: `<span aria-hidden="true"><svg viewBox="0 0 32 36"><path class="cone" style="fill:${color}" d="M16 2 25 29H7L16 2Z"/><path class="stripe" d="m11.2 16 9.6 0 2 6H9.2l2-6Z"/><path class="base" d="M4 28h24l2 5H2l2-5Z"/></svg></span>`, iconSize: [32, 36], iconAnchor: [4, 33], popupAnchor: [12, -31] });
}

// Mairie de Montrottier — point townhall issu des données OSM locales.
const DEFAULT_LATITUDE = 45.7900455;
const DEFAULT_LONGITUDE = 4.4662948;

function distanceLabel(from: AgentPosition, to: { latitude: number; longitude: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  const meters = 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return meters < 1_000 ? `${Math.round(meters)} m` : `${(meters / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}

function openItinerary(from: AgentPosition, to: { latitude: number; longitude: number }) {
  window.open(`https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=driving`, "_blank", "noopener,noreferrer");
}

function AgentMapFocus({ position, request }: { position: AgentPosition; request: number }) {
  const map = useMap();
  const handledRequest = useRef(0);
  useEffect(() => {
    if (!request || request === handledRequest.current) return;
    handledRequest.current = request;
    map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 16), { duration: .7 });
  }, [map, position.latitude, position.longitude, request]);
  return null;
}

export default function CommuneMap({
  markers,
  centerLatitude = DEFAULT_LATITUDE,
  centerLongitude = DEFAULT_LONGITUDE,
  zoom = 15,
  height = 650,
  compactControls = false,
  showTerrainProblemsInitially = false,
  agentMode = false,
  agentPosition = null,
  agentFocusRequest = 0,
  selectedPosition = null,
  customLayers = [],
  customSections = [],
  drawingCoordinates = [],
  waypointCoordinates = [],
  drawingColor = "#16a34a",
  onDrawingPoint,
  onRemoveCustomSection,
  onToggleCustomLayer,
  onMapClick,
  onCreateAtPosition,
}: CommuneMapProps) {
  const navigate = useNavigate();
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
    showCadastre,
    setShowCadastre,
  ] = useState(false);

  const [
    showRoadEquipment,
    setShowRoadEquipment,
  ] = useState(false);

  const [
    showSignalements,
    setShowSignalements,
  ] = useState(showTerrainProblemsInitially);

  const [
    showChantiers,
    setShowChantiers,
  ] = useState(false);
  const [showMissions, setShowMissions] = useState(showTerrainProblemsInitially);

  function resetToBoundaryOnly() {
    setShowBoundary(true);
    setShowRoads(false);
    setShowHamlets(false);
    setShowBuildings(false);
    setShowAmenities(false);
    setShowCadastre(false);
    setShowRoadEquipment(false);
    setShowSignalements(false);
    setShowChantiers(false);
    setShowMissions(false);
  }

  const visibleMarkers =
    markers.filter((mapMarker) => {
      if (
        mapMarker.type === "signalement" &&
        !(agentMode || showSignalements)
      ) {
        return false;
      }

      if (
        mapMarker.type === "chantier" &&
        !(agentMode || showChantiers)
      ) {
        return false;
      }

      if (
        mapMarker.type === "intervention" &&
        !showAmenities
      ) {
        return false;
      }
      if (mapMarker.type === "mission" && !(agentMode || showMissions)) return false;

      return true;
    });

  return (
    <div className="commune-map-wrapper">
      {!agentMode && <MapLayerControls
        compact={compactControls}
        showBoundary={showBoundary}
        showRoads={showRoads}
        showHamlets={showHamlets}
        showBuildings={showBuildings}
        showAmenities={showAmenities}
        showCadastre={showCadastre}
        showRoadEquipment={showRoadEquipment}
        showSignalements={showSignalements}
        showChantiers={showChantiers}
        showMissions={showMissions}

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

        onToggleCadastre={() =>
          setShowCadastre(
            (currentValue) =>
              !currentValue,
          )
        }

        onToggleRoadEquipment={() =>
          setShowRoadEquipment(
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
        onToggleMissions={() => setShowMissions((currentValue) => !currentValue)}

        customLayers={customLayers.filter((layer) => layer.active && !layer.archived)}
        onToggleCustomLayer={onToggleCustomLayer}

        onReset={resetToBoundaryOnly}
      />}

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
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {agentMode && agentPosition && <>
            <AgentMapFocus position={agentPosition} request={agentFocusRequest}/>
            <CircleMarker center={[agentPosition.latitude, agentPosition.longitude]} radius={11} pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#1760c3", fillOpacity: 1 }} bubblingMouseEvents={false}>
              <Popup><div className="map-popup-content"><strong>📍 Ma position</strong><span>Position GPS de l’agent</span>{agentPosition.accuracy && <span>Précision : environ {Math.round(agentPosition.accuracy)} m</span>}</div></Popup>
            </CircleMarker>
          </>}

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

          {showCadastre && (
            <CadastreLayer />
          )}

          {showAmenities && (
            <AmenitiesLayer />
          )}

          {showRoadEquipment && (
            <RoadEquipmentLayer />
          )}

          {onDrawingPoint ? (
            <MapDrawingHandler onPoint={onDrawingPoint} />
          ) : onMapClick && (
            <MapClickHandler
              onSelect={onMapClick}
            />
          )}

          {customSections.map((section) => {
            const layer = customLayers.find((item) => item.id === section.layerId);
            if (!layer) return null;
            return (
              <Polyline key={section.id} positions={section.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])} pathOptions={{ color: STATUS_COLORS[section.status], weight: 7, opacity: 0.88, dashArray: section.status === "a-faire" ? "10 8" : undefined }}>
                <Popup><div className="map-popup-content"><strong>{section.name}</strong><span>Couche : {layer.name}</span><span>{Math.round(section.lengthMeters).toLocaleString("fr-FR")} m de voie · {Math.round(section.businessLengthMeters).toLocaleString("fr-FR")} ml métier</span><span>Statut : {STATUS_LABELS[section.status]}</span>{section.completionDate && <span>Date : {new Date(`${section.completionDate}T12:00:00`).toLocaleDateString("fr-FR")}</span>}{section.assignee && <span>Réalisé par : {section.assignee}</span>}{section.notes && <p>{section.notes}</p>}<a className="secondary-button compact-button" href={`/voirie/couches-metier?layer=${layer.id}`}>Ouvrir</a>{onRemoveCustomSection && <button className="danger-button" type="button" onClick={() => { if (window.confirm("Supprimer cette portion ?")) onRemoveCustomSection(section.id); }}>Supprimer la portion</button>}</div></Popup>
              </Polyline>
            );
          })}

          {drawingCoordinates.length > 0 && <>
            <Polyline positions={drawingCoordinates} pathOptions={{ color: drawingColor, weight: 8, dashArray: "8 8" }} />
            {drawingCoordinates.map((position, index) => <CircleMarker key={`${position[0]}-${position[1]}-${index}`} center={position} radius={5} pathOptions={{ color: drawingColor, fillColor: "white", fillOpacity: 1 }} />)}
          </>}

          {waypointCoordinates.map((position, index) => <CircleMarker key={`waypoint-${position[0]}-${position[1]}-${index}`} center={position} radius={9} pathOptions={{ color: drawingColor, fillColor: index === 0 ? "#22c55e" : index === waypointCoordinates.length - 1 ? "#ef4444" : "#f59e0b", fillOpacity: 1, weight: 3 }}><Popup>{index === 0 ? "Départ" : index === waypointCoordinates.length - 1 ? "Arrivée" : `Point de passage ${index}`}</Popup></CircleMarker>)}

          {selectedPosition && (
            <Marker
              ref={(instance) => { instance?.openPopup(); }}
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

                  {onCreateAtPosition && <div className="map-popup-actions"><button type="button" onClick={() => onCreateAtPosition("signalement")}>⚠️ Signalement</button><button type="button" onClick={() => onCreateAtPosition("chantier")}>🚧 Chantier</button><button type="button" onClick={() => onCreateAtPosition("mission")}>📋 Mission</button></div>}

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
            (mapMarker) => mapMarker.type === "signalement" ? (
              <Marker key={mapMarker.id} position={[mapMarker.latitude,mapMarker.longitude]} icon={isValidatedStatus(mapMarker.status) ? validatedMapIcon() : terrainProblemIcon(mapMarker.priority)} bubblingMouseEvents={false} riseOnHover>
                <Popup><div className="map-popup-content"><strong>⚠️ {mapMarker.title}</strong><span>📍 {mapMarker.location}</span><span>Type : {mapMarker.sourceKind === "field-alert" ? "Remontée terrain" : "Problème terrain"}</span><span>Statut : {mapMarker.status}</span><span>Priorité : {mapMarker.priority}</span>{agentPosition&&<strong className="map-agent-distance">À {distanceLabel(agentPosition, mapMarker)} de votre position</strong>}{mapMarker.date&&<span>Créée le : {new Date(mapMarker.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>}{mapMarker.description&&<p>{mapMarker.description}</p>}{agentMode&&agentPosition&&<button className="primary-button compact-button" type="button" onClick={() => openItinerary(agentPosition, mapMarker)}>Itinéraire</button>}{!agentMode && mapMarker.sourceKind !== "field-alert" && <button className="primary-button compact-button" type="button" onClick={() => navigate(`/signalements?signalement=${mapMarker.sourceId}`)}>Ouvrir la fiche</button>}</div></Popup>
              </Marker>
            ) : mapMarker.type === "mission" ? (
              <Marker key={mapMarker.id} position={[mapMarker.latitude,mapMarker.longitude]} icon={missionAgentIcon(mapMarker.priority, mapMarker.status)} bubblingMouseEvents={false} riseOnHover><Popup><div className="map-popup-content"><strong>{mapMarker.status === "Terminée" ? "✅" : "👷"} {mapMarker.title}</strong><span>📍 {mapMarker.location}</span><span>Type : Mission agent</span><span>Statut : {mapMarker.status === "Terminée" ? "Réalisée" : mapMarker.status}</span><span>Priorité : {mapMarker.priority}</span>{agentPosition&&<strong className="map-agent-distance">À {distanceLabel(agentPosition, mapMarker)} de votre position</strong>}{mapMarker.description&&<p>{mapMarker.description}</p>}{agentMode&&agentPosition&&<button className="primary-button compact-button" type="button" onClick={() => openItinerary(agentPosition, mapMarker)}>Itinéraire</button>}</div></Popup></Marker>
            ) : mapMarker.type === "chantier" ? (
              <Marker key={mapMarker.id} position={[mapMarker.latitude,mapMarker.longitude]} icon={chantierConeIcon(mapMarker.priority, mapMarker.status)} bubblingMouseEvents={false} riseOnHover><Popup><div className="map-popup-content"><strong>🚧 {mapMarker.title}</strong><span>📍 {mapMarker.location}</span><span>Type : Chantier</span><span>Statut : {mapMarker.status}</span><span>Priorité : {mapMarker.priority}</span>{agentPosition&&<strong className="map-agent-distance">À {distanceLabel(agentPosition, mapMarker)} de votre position</strong>}{mapMarker.description&&<p>{mapMarker.description}</p>}{agentMode&&agentPosition&&<button className="primary-button compact-button" type="button" onClick={() => openItinerary(agentPosition, mapMarker)}>Itinéraire</button>}</div></Popup></Marker>
            ) : (
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
