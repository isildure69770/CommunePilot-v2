import {
  Building2,
  FlagTriangleRight,
  Grid2X2,
  Layers3,
  MapPinned,
  MapPin,
  Route,
  RotateCcw,
  TriangleAlert,
  Wrench,
} from "lucide-react";

interface MapLayerControlsProps {
  showBoundary: boolean;
  showRoads: boolean;
  showHamlets: boolean;
  showBuildings: boolean;
  showAmenities: boolean;
  showCadastre: boolean;
  showRoadEquipment: boolean;
  showSignalements: boolean;
  showChantiers: boolean;

  onToggleBoundary: () => void;
  onToggleRoads: () => void;
  onToggleHamlets: () => void;
  onToggleBuildings: () => void;
  onToggleAmenities: () => void;
  onToggleCadastre: () => void;
  onToggleRoadEquipment: () => void;
  onToggleSignalements: () => void;
  onToggleChantiers: () => void;

  onReset: () => void;
}

export default function MapLayerControls(
  props: MapLayerControlsProps,
) {
  const layers = [
    {
      label: "Limite communale",
      detail: "Contour de Montrottier",
      active: props.showBoundary,
      toggle: props.onToggleBoundary,
      icon: FlagTriangleRight,
      tone: "boundary",
    },

    {
      label: "Routes",
      detail: "Réseau routier",
      active: props.showRoads,
      toggle: props.onToggleRoads,
      icon: Route,
      tone: "roads",
    },

    {
      label: "Hameaux",
      detail: "Hameaux et lieux-dits",
      active: props.showHamlets,
      toggle: props.onToggleHamlets,
      icon: MapPin,
      tone: "hamlets",
    },

    {
      label: "Bâtiments",
      detail: "Emprises bâties",
      active: props.showBuildings,
      toggle: props.onToggleBuildings,
      icon: Building2,
      tone: "buildings",
    },

    {
      label: "Équipements",
      detail: "Équipements communaux",
      active: props.showAmenities,
      toggle: props.onToggleAmenities,
      icon: MapPinned,
      tone: "amenities",
    },

    {
      label: "Cadastre",
      detail: "Parcelles cadastrales",
      active: props.showCadastre,
      toggle: props.onToggleCadastre,
      icon: Grid2X2,
      tone: "cadastre",
    },

    {
      label: "Équipements voirie",
      detail: "Mobilier et équipements routiers",
      active: props.showRoadEquipment,
      toggle: props.onToggleRoadEquipment,
      icon: Wrench,
      tone: "road-equipment",
    },

    {
      label: "Signalements",
      detail: "Incidents enregistrés",
      active: props.showSignalements,
      toggle: props.onToggleSignalements,
      icon: TriangleAlert,
      tone: "reports",
    },

    {
      label: "Chantiers",
      detail: "Travaux en cours",
      active: props.showChantiers,
      toggle: props.onToggleChantiers,
      icon: Wrench,
      tone: "works",
    },
  ];

  const activeCount =
    layers.filter(
      (layer) => layer.active,
    ).length;

  return (
    <section
      className="map-layer-controls"
      aria-label="Couches cartographiques"
    >
      <div className="map-layer-controls-heading">
        <div className="map-layer-title">
          <span>
            <Layers3 size={19} />
          </span>

          <div>
            <strong>
              Couches de la carte
            </strong>

            <small>
              {activeCount} couche
              {activeCount > 1
                ? "s"
                : ""}{" "}
              affichée
              {activeCount > 1
                ? "s"
                : ""}
            </small>
          </div>
        </div>

        <button
          className="map-reset-button"
          type="button"
          onClick={props.onReset}
          title="Revenir à la limite communale uniquement"
        >
          <RotateCcw size={15} />

          <span>
            Vue initiale
          </span>
        </button>
      </div>

      <div className="map-layer-list">
        {layers.map(
          (layer) => {
            const Icon =
              layer.icon;

            return (
              <button
                key={layer.label}
                className={`map-layer-toggle ${
                  layer.active
                    ? "is-active"
                    : ""
                } layer-${layer.tone}`}
                type="button"
                role="switch"
                aria-checked={
                  layer.active
                }
                onClick={
                  layer.toggle
                }
              >
                <span className="map-layer-icon">
                  <Icon size={17} />
                </span>

                <span className="map-layer-copy">
                  <strong>
                    {layer.label}
                  </strong>

                  <small>
                    {layer.detail}
                  </small>
                </span>

                <span
                  className="map-layer-switch"
                  aria-hidden="true"
                >
                  <span />
                </span>
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}