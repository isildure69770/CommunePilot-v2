import type {
  RoadEquipment,
  RoadEquipmentLocalState,
} from "../types/roadEquipment";

const STORAGE_KEY = "communepilot-road-equipment-v1";
export const ROAD_EQUIPMENT_CHANGED_EVENT =
  "communepilot-road-equipment-changed";

const EMPTY_STATE: RoadEquipmentLocalState = {
  added: [],
  overrides: {},
  deletedOsmIds: [],
};

function normalizeEquipment(equipment: RoadEquipment): RoadEquipment {
  return {
    ...equipment,
    maintenanceHistory: Array.isArray(equipment.maintenanceHistory)
      ? equipment.maintenanceHistory
      : [],
    interventions: Array.isArray(equipment.interventions)
      ? equipment.interventions
      : [],
    documents: Array.isArray(equipment.documents) ? equipment.documents : [],
  };
}

export function loadRoadEquipmentState(): RoadEquipmentLocalState {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(storedValue) as Partial<RoadEquipmentLocalState>;
    return {
      added: Array.isArray(parsed.added)
        ? parsed.added.map(normalizeEquipment)
        : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === "object"
          ? Object.fromEntries(
              Object.entries(parsed.overrides).map(([id, equipment]) => [
                id,
                normalizeEquipment(equipment),
              ]),
            )
          : {},
      deletedOsmIds: Array.isArray(parsed.deletedOsmIds)
        ? parsed.deletedOsmIds
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveRoadEquipmentState(
  state: RoadEquipmentLocalState,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new Error(
        "L’espace de stockage local est insuffisant. Retirez une photo ou un document volumineux, puis réessayez.",
      );
    }
    throw error;
  }
  window.dispatchEvent(new Event(ROAD_EQUIPMENT_CHANGED_EVENT));
}

export function mergeRoadEquipment(
  osmEquipment: RoadEquipment[],
  state = loadRoadEquipmentState(),
): RoadEquipment[] {
  const deleted = new Set(state.deletedOsmIds);
  const osm = osmEquipment
    .filter((equipment) => !deleted.has(equipment.id))
    .map((equipment) =>
      normalizeEquipment(state.overrides[equipment.id] ?? equipment),
    );

  return [...state.added.map(normalizeEquipment), ...osm];
}
