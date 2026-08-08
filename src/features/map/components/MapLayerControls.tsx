interface MapLayerControlsProps {
  showBoundary: boolean;
  showRoads: boolean;
  showHamlets: boolean;
  showBuildings: boolean;
  showAmenities: boolean;
  showSignalements: boolean;
  showChantiers: boolean;

  onToggleBoundary: () => void;
  onToggleRoads: () => void;
  onToggleHamlets: () => void;
  onToggleBuildings: () => void;
  onToggleAmenities: () => void;
  onToggleSignalements: () => void;
  onToggleChantiers: () => void;
}

export default function MapLayerControls({
  showBoundary,
  showRoads,
  showHamlets,
  showBuildings,
  showAmenities,
  showSignalements,
  showChantiers,
  onToggleBoundary,
  onToggleRoads,
  onToggleHamlets,
  onToggleBuildings,
  onToggleAmenities,
  onToggleSignalements,
  onToggleChantiers,
}: MapLayerControlsProps) {
  return (
    <div className="map-layer-controls">
      <strong>
        Couches cartographiques
      </strong>

      <label>
        <input
          type="checkbox"
          checked={showBoundary}
          onChange={onToggleBoundary}
        />
        Limite communale
      </label>

      <label>
        <input
          type="checkbox"
          checked={showRoads}
          onChange={onToggleRoads}
        />
        Routes
      </label>

      <label>
        <input
          type="checkbox"
          checked={showHamlets}
          onChange={onToggleHamlets}
        />
        Hameaux / lieux-dits
      </label>

      <label>
        <input
          type="checkbox"
          checked={showBuildings}
          onChange={onToggleBuildings}
        />
        Bâtiments
      </label>

      <label>
        <input
          type="checkbox"
          checked={showAmenities}
          onChange={onToggleAmenities}
        />
        Équipements communaux
      </label>

      <label>
        <input
          type="checkbox"
          checked={showSignalements}
          onChange={onToggleSignalements}
        />
        Signalements
      </label>

      <label>
        <input
          type="checkbox"
          checked={showChantiers}
          onChange={onToggleChantiers}
        />
        Chantiers
      </label>
    </div>
  );
}