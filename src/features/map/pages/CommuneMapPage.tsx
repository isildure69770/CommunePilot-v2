import { useState } from "react";

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

interface SelectedPosition {
  latitude: number;
  longitude: number;
  location?: string;
}

export default function CommuneMapPage() {
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
            Visualisez les chantiers et les
            signalements enregistrés dans
            CommunePilot.
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

      <div className="commune-map-statistics">
        <article>
          <span>Total</span>
          <strong>{statistics.total}</strong>
        </article>

        <article>
          <span>Chantiers</span>
          <strong>{statistics.chantiers}</strong>
        </article>

        <article>
          <span>Signalements</span>
          <strong>{statistics.signalements}</strong>
        </article>

        <article>
          <span>Urgents</span>
          <strong>{statistics.urgents}</strong>
        </article>
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

      {selectedPosition && (
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
        selectedPosition={selectedPosition}
        onMapClick={handleMapClick}
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

      <SignalementForm
        isOpen={isSignalementFormOpen}
        signalement={null}
        initialPosition={selectedPosition}
        onClose={closeSignalementForm}
        onSubmit={handleCreateSignalement}
      />
    </section>
  );
}