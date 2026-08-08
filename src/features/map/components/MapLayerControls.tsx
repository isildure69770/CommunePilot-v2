interface MapLayerControlsProps {
  showBoundary: boolean;
  showRoads: boolean;
  showHamlets: boolean;
  showSignalements: boolean;
  showChantiers: boolean;

  onToggleBoundary: () => void;
  onToggleRoads: () => void;
  onToggleHamlets: () => void;
  onToggleSignalements: () => void;
  onToggleChantiers: () => void;
}

export default function MapLayerControls({
  showBoundary,
  showRoads,
  showHamlets,
  showSignalements,
  showChantiers,
  onToggleBoundary,
  onToggleRoads,
  onToggleHamlets,
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