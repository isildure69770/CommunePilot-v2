import { useEffect, useState } from "react";

import CommuneMap from "../components/CommuneMap";

import SignalementForm from "../../signalements/components/SignalementForm";

import {
  useCommuneMap,
} from "../hooks/useCommuneMap";

import {
  useSignalements,
} from "../../signalements/hooks/useSignalements";

import type {
  Signalement,
} from "../../signalements/types/signalement";
import CustomLayerManager from "../components/CustomLayerManager";
import { useCustomMapLayers } from "../hooks/useCustomMapLayers";
import type { CustomMapLayerStatus, InterventionSide } from "../types/customLayer";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { exportLayerGeoJson } from "../services/businessLayerExport";
import { calculateLineLength } from "../services/customLayerStorage";
import { routingConfiguration, routingErrorMessage } from "../services/roadRouting";

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

function MapStatistics({ statistics, compact = false }: { statistics: { total: number; chantiers: number; signalements: number; missions: number; urgents: number }; compact?: boolean }) {
  return <div className={`commune-map-statistics${compact ? " is-agent-compact" : ""}`}>
    {!compact && <article><span>Total</span><strong>{statistics.total}</strong></article>}
    <article><span>Missions</span><strong>{statistics.missions}</strong></article>
    <article><span>Chantiers</span><strong>{statistics.chantiers}</strong></article>
    <article><span>Remontées terrain</span><strong>{statistics.signalements}</strong></article>
    {!compact && <article><span>Urgents</span><strong>{statistics.urgents}</strong></article>}
  </div>;
}

export default function CommuneMapPage() {
  const { user, can } = useIdentity();
  const [agentPosition, setAgentPosition] = useState<AgentPosition | null>(null);
  const [agentLocationStatus, setAgentLocationStatus] = useState<"searching" | "active" | "unavailable">("searching");
  const [agentFocusRequest, setAgentFocusRequest] = useState(0);
  const customMap = useCustomMapLayers(user.id);
  const managedLayers = customMap.layers.filter((layer) => !layer.deletedAt);
  const currentLayers = managedLayers.filter((layer) => !layer.archived);
  const {
    markers,
    statistics,
    refresh,
  } = useCommuneMap();

  const {
    addSignalement,
  } = useSignalements();

  const [
    selectedPosition,
    setSelectedPosition,
  ] = useState<SelectedPosition | null>(
    null,
  );

  const [
    isSignalementFormOpen,
    setIsSignalementFormOpen,
  ] = useState(false);
  const [drawingLayerId, setDrawingLayerId] = useState<string | null>(null);
  const [drawingCoordinates, setDrawingCoordinates] = useState<Array<[number, number]>>([]);
  const [drawingMode, setDrawingMode] = useState<"choice" | "free" | "automatic" | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routing, setRouting] = useState(false);
  const [routingError, setRoutingError] = useState("");
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionStatus, setSectionStatus] = useState<CustomMapLayerStatus>("realise");
  const [sectionDate, setSectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sectionAssignee, setSectionAssignee] = useState("");
  const [sectionNotes, setSectionNotes] = useState("");
  const [sectionSide, setSectionSide] = useState<InterventionSide>("gauche");

  useEffect(() => {
    if (user.role !== "Agent technique") return;
    if (!navigator.geolocation) {
      setAgentLocationStatus("unavailable");
      return;
    }
    setAgentLocationStatus("searching");
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setAgentPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        setAgentLocationStatus("active");
      },
      () => setAgentLocationStatus("unavailable"),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [user.role]);

  const drawingLayer = customMap.layers.find((layer) => layer.id === drawingLayerId);

  function startDrawing(layerId: string) {
    setDrawingLayerId(layerId);
    setDrawingCoordinates([]);
    setRoutePoints([]); setRouteDistance(null); setRoutingError(""); setDrawingMode("choice");
    setSelectedPosition(null);
    setSectionFormOpen(false);
  }

  async function calculateRoute() {
    if (routePoints.length < 2) return;
    if (!routingConfiguration.provider) { setRoutingError(routingConfiguration.message); return; }
    setRouting(true); setRoutingError(""); setDrawingCoordinates([]);
    try { const result = await routingConfiguration.provider.route({ points: routePoints, profile: "driving" }); setDrawingCoordinates(result.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude])); setRouteDistance(result.distanceMeters); }
    catch (error) { setRoutingError(routingErrorMessage(error)); }
    finally { setRouting(false); }
  }

  function cancelDrawing() {
    setDrawingLayerId(null);
    setDrawingCoordinates([]);
    setSectionFormOpen(false);
    setDrawingMode(null); setRoutePoints([]); setRouteDistance(null); setRoutingError("");
  }

  function saveSection(event: React.FormEvent) {
    event.preventDefault();
    if (!drawingLayerId || drawingCoordinates.length < 2 || !sectionName.trim()) return;
    customMap.addSection({ layerId: drawingLayerId, name: sectionName, status: sectionStatus, completionDate: sectionDate, assignee: sectionAssignee, notes: sectionNotes, interventionSide: sectionSide, geometry: { type: "LineString", coordinates: drawingCoordinates.map(([latitude, longitude]) => [longitude, latitude]) }, source: drawingMode === "automatic" ? "routing" : "manual" });
    setSectionName(""); setSectionAssignee(""); setSectionNotes("");
    cancelDrawing();
  }

  function handleMapClick(
    latitude: number,
    longitude: number,
    location?: string,
  ) {
    setSelectedPosition({
      latitude,
      longitude,
      location,
    });
  }

  function openSignalementForm() {
    if (!selectedPosition) {
      return;
    }

    setIsSignalementFormOpen(true);
  }

  function closeSignalementForm() {
    setIsSignalementFormOpen(false);
  }

  function cancelSelectedPosition() {
    setSelectedPosition(null);
    setIsSignalementFormOpen(false);
  }

  function handleCreateSignalement(
    value: Omit<
      Signalement,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    addSignalement(value);

    setIsSignalementFormOpen(false);
    setSelectedPosition(null);

    window.setTimeout(() => {
      refresh();
    }, 50);
  }

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
            Consultez les missions, les chantiers et les remontées terrain enregistrés dans CommunePilot.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={refresh}
        >
          Actualiser la carte
        </button>
      </div>

      {user.role !== "Agent technique" && <MapStatistics statistics={statistics}/>}

      <div className="commune-map-legend">
        <div>
          <span className="legend-dot chantier-dot" />
          Chantiers
        </div>

        <div>
          <span className="legend-dot signalement-dot" />
          Remontées terrain
        </div>

        <div>
          <span className="legend-dot mission-dot" />
          Missions
        </div>
      </div>

      {user.role === "Agent technique" && <div className={`agent-location-status is-${agentLocationStatus}`}><span className="agent-location-dot"/><span>{agentLocationStatus === "active" ? "Ma position est affichée et actualisée" : agentLocationStatus === "searching" ? "Recherche de votre position…" : "Autorisez la localisation dans les réglages du téléphone pour afficher les distances"}</span>{agentLocationStatus === "active" && <button type="button" onClick={() => setAgentFocusRequest((value) => value + 1)}>Voir ma position</button>}</div>}

      {user.role !== "Agent technique" && <CustomLayerManager
        layers={managedLayers}
        sections={customMap.sections}
        drawingLayerId={drawingLayerId}
        onAddLayer={customMap.addLayer}
        onToggleLayer={customMap.toggleLayer}
        onUpdateLayer={customMap.updateLayer}
        onDuplicateLayer={customMap.duplicateLayer}
        onSetLayerArchived={customMap.setLayerArchived}
        onDeleteLayer={customMap.deleteLayer}
        onExportLayer={exportLayerGeoJson}
        onStartDrawing={startDrawing}
        canCreate={can("carte", "create")}
        canEdit={can("carte", "update")}
        canDelete={can("carte", "delete")}
      />}

      {drawingLayer && (
        <div className="drawing-workflow">
          {drawingMode === "choice" && <div className="drawing-mode-choice"><strong>Tracer une portion dans « {drawingLayer.name} »</strong><button className="primary-button" onClick={() => setDrawingMode("free")}>✏️ Tracé libre</button><button className="secondary-button" onClick={() => setDrawingMode("automatic")}>🛣️ Tracé automatique · Suivre une route ou un chemin</button><button className="secondary-button" onClick={cancelDrawing}>Annuler</button></div>}
          {drawingMode === "free" && <div className="map-drawing-toolbar"><div><strong>Tracé libre : {drawingLayer.name}</strong><span>Cliquez successivement sur la carte · {Math.round(calculateLineLength(drawingCoordinates.map(([lat, lon]) => [lon, lat])))} m</span></div><span className="map-drawing-count">{drawingCoordinates.length} point{drawingCoordinates.length > 1 ? "s" : ""}</span><button className="secondary-button" disabled={!drawingCoordinates.length} onClick={() => setDrawingCoordinates((points) => points.slice(0, -1))}>Annuler le dernier point</button><button className="secondary-button" disabled={!drawingCoordinates.length} onClick={() => setDrawingCoordinates([])}>Recommencer</button><button className="secondary-button" onClick={cancelDrawing}>Annuler</button><button className="primary-button" disabled={drawingCoordinates.length < 2} onClick={() => setSectionFormOpen(true)}>Enregistrer</button></div>}
          {drawingMode === "automatic" && <div className="automatic-routing-panel"><div className="routing-steps"><strong className={routePoints.length === 0 ? "active" : "done"}>1 Départ</strong><strong className={routePoints.length === 1 ? "active" : routePoints.length > 1 ? "done" : ""}>2 Arrivée</strong><strong>+ Point de passage</strong></div><p>{routePoints.length < 2 ? `Cliquez pour placer ${routePoints.length ? "l’arrivée" : "le départ"}.` : "Ajoutez éventuellement des points de passage, puis calculez."}</p><div className="routing-actions"><button className="secondary-button" disabled={!routePoints.length} onClick={() => { setRoutePoints((points) => points.slice(0, -1)); setDrawingCoordinates([]); setRouteDistance(null); }}>Modifier les points</button><button className="secondary-button" disabled={!routePoints.length} onClick={() => { setRoutePoints([]); setDrawingCoordinates([]); setRouteDistance(null); }}>Recommencer</button><button className="primary-button" disabled={routePoints.length < 2 || routing} onClick={calculateRoute}>{routing ? "Calcul…" : drawingCoordinates.length ? "Recalculer" : "Calculer"}</button><button className="secondary-button" onClick={cancelDrawing}>Annuler</button><button className="primary-button" disabled={drawingCoordinates.length < 2} onClick={() => setSectionFormOpen(true)}>Enregistrer</button></div>{routeDistance !== null && <strong className="routing-distance">Itinéraire : {routeDistance < 1000 ? `${Math.round(routeDistance)} m` : `${(routeDistance / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km`}</strong>}{routingError && <div className="routing-error"><span>{routingError}</span><button className="primary-button" onClick={() => { setRoutePoints([]); setDrawingCoordinates([]); setRoutingError(""); setDrawingMode("free"); }}>Passer au tracé libre</button></div>}</div>}
        </div>
      )}

      {user.role !== "Agent technique" && selectedPosition && (
        <div className="map-create-panel">
          <div>
            <strong>
              📍 Emplacement sélectionné
            </strong>

            {selectedPosition.location && (
              <span>
                Adresse :{" "}
                {selectedPosition.location}
              </span>
            )}

            <span>
              Latitude :{" "}
              {selectedPosition.latitude.toFixed(6)}
            </span>

            <span>
              Longitude :{" "}
              {selectedPosition.longitude.toFixed(6)}
            </span>
          </div>

          <div className="map-create-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={cancelSelectedPosition}
            >
              Annuler
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={openSignalementForm}
            >
              + Créer un signalement ici
            </button>
          </div>
        </div>
      )}

      <CommuneMap
        markers={markers}
        agentMode={user.role === "Agent technique"}
        agentPosition={user.role === "Agent technique" ? agentPosition : null}
        agentFocusRequest={agentFocusRequest}
        selectedPosition={user.role === "Agent technique" ? null : selectedPosition}
        onMapClick={user.role === "Agent technique" ? undefined : handleMapClick}
        customLayers={user.role === "Agent technique" ? [] : currentLayers}
        customSections={user.role === "Agent technique" ? [] : customMap.visibleSections}
        drawingCoordinates={drawingCoordinates}
        waypointCoordinates={drawingMode === "automatic" ? routePoints : []}
        drawingColor={drawingLayer?.color}
        onDrawingPoint={drawingMode === "free" ? (latitude, longitude) => setDrawingCoordinates((points) => [...points, [latitude, longitude]]) : drawingMode === "automatic" ? (latitude, longitude) => { setRoutePoints((points) => [...points, [latitude, longitude]]); setDrawingCoordinates([]); setRouteDistance(null); setRoutingError(""); } : undefined}
        onRemoveCustomSection={customMap.removeSection}
        onToggleCustomLayer={customMap.toggleLayer}
      />

      {statistics.sansCoordonnees > 0 && (
        <div className="map-warning">
          {statistics.sansCoordonnees} élément
          {statistics.sansCoordonnees > 1
            ? "s"
            : ""}{" "}
          sans coordonnées GPS.
        </div>
      )}

      {markers.length === 0 && (
        <div className="empty-state">
          Aucun chantier ou signalement
          localisé.
        </div>
      )}

      {user.role === "Agent technique" && <MapStatistics statistics={statistics} compact/>}

      <SignalementForm
        isOpen={isSignalementFormOpen}
        signalement={null}
        initialPosition={selectedPosition}
        onClose={closeSignalementForm}
        onSubmit={handleCreateSignalement}
      />

      {sectionFormOpen && drawingLayer && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSectionFormOpen(false); }}>
          <div className="modal custom-section-modal" role="dialog" aria-modal="true" aria-labelledby="custom-section-title">
            <div className="modal-header"><div><span className="eyebrow">{drawingLayer.name}</span><h3 id="custom-section-title">Enregistrer la portion</h3></div><button className="icon-button" type="button" onClick={() => setSectionFormOpen(false)}>×</button></div>
            <form className="custom-section-form" onSubmit={saveSection}>
              <label>Nom de la portion<input value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder="Ex. Chemin de la Renardière" autoFocus required /></label>
              <div className="form-row"><label>État<select value={sectionStatus} onChange={(event) => setSectionStatus(event.target.value as CustomMapLayerStatus)}><option value="realise">Réalisé</option><option value="en-cours">En cours</option><option value="a-faire">À faire</option><option value="a-reprendre">À reprendre</option></select></label><label>Date des travaux<input type="date" value={sectionDate} onChange={(event) => setSectionDate(event.target.value)} /></label></div>
              <label>Côté(s)<select value={sectionSide} onChange={(event) => setSectionSide(event.target.value as InterventionSide)}><option value="gauche">Gauche (×1)</option><option value="droite">Droite (×1)</option><option value="deux-cotes">Deux côtés (×2)</option></select></label>
              <label>Agent ou entreprise<input value={sectionAssignee} onChange={(event) => setSectionAssignee(event.target.value)} placeholder="Nom de l’équipe ou du prestataire" /></label>
              <label>Commentaire<textarea rows={4} value={sectionNotes} onChange={(event) => setSectionNotes(event.target.value)} placeholder="Travaux réalisés, observations…" /></label>
              <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setSectionFormOpen(false)}>Retour au tracé</button><button className="primary-button" type="submit">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
