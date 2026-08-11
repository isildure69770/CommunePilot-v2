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

export function loadRoadEquipmentState(): RoadEquipmentLocalState {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(storedValue) as Partial<RoadEquipmentLocalState>;
    return {
      added: Array.isArray(parsed.added) ? parsed.added : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === "object"
          ? parsed.overrides
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(ROAD_EQUIPMENT_CHANGED_EVENT));
}

export function mergeRoadEquipment(
  osmEquipment: RoadEquipment[],
  state = loadRoadEquipmentState(),
): RoadEquipment[] {
  const deleted = new Set(state.deletedOsmIds);
  const osm = osmEquipment
    .filter((equipment) => !deleted.has(equipment.id))
    .map((equipment) => state.overrides[equipment.id] ?? equipment);

  return [...state.added, ...osm];
}
