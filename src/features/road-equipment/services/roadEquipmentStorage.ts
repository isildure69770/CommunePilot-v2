import type {
  RoadEquipment,
  RoadEquipmentLocalState,
} from "../types/roadEquipment";

export const ROAD_EQUIPMENT_STORAGE_KEY = "communepilot-road-equipment-v1";
export const ROAD_EQUIPMENT_BACKUP_VERSION = 1;
export const ROAD_EQUIPMENT_CHANGED_EVENT =
  "communepilot-road-equipment-changed";

const EMPTY_STATE: RoadEquipmentLocalState = {
  added: [],
  overrides: {},
  deletedOsmIds: [],
};

export interface RoadEquipmentStorageAdapter {
  read(): string | null;
  write(value: string): void;
}

const browserStorage: RoadEquipmentStorageAdapter = {
  read: () => localStorage.getItem(ROAD_EQUIPMENT_STORAGE_KEY),
  write: (value) => localStorage.setItem(ROAD_EQUIPMENT_STORAGE_KEY, value),
};

let storageAdapter: RoadEquipmentStorageAdapter = browserStorage;

/** Point d'extension pour une future persistance synchronisée. */
export function configureRoadEquipmentStorage(adapter: RoadEquipmentStorageAdapter) {
  storageAdapter = adapter;
}

function normalizeEquipment(equipment: RoadEquipment): RoadEquipment {
  return {
    ...equipment,
    nextInspectionDate: equipment.nextInspectionDate ?? "",
    nextMaintenanceDate: equipment.nextMaintenanceDate ?? "",
    maintenanceHistory: Array.isArray(equipment.maintenanceHistory)
      ? equipment.maintenanceHistory.map((entry) => ({
          ...entry,
          cost: typeof entry.cost === "number" ? entry.cost : undefined,
        }))
      : [],
    interventions: Array.isArray(equipment.interventions)
      ? equipment.interventions.map((intervention) => ({
          ...intervention,
          cost: typeof intervention.cost === "number" ? intervention.cost : undefined,
        }))
      : [],
    documents: Array.isArray(equipment.documents) ? equipment.documents : [],
  };
}

export function loadRoadEquipmentState(): RoadEquipmentLocalState {
  const storedValue = storageAdapter.read();

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
    storageAdapter.write(JSON.stringify(state));
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

export interface RoadEquipmentBackup {
  module: "communepilot-road-equipment";
  version: number;
  exportedAt: string;
  state: RoadEquipmentLocalState;
}

export function createRoadEquipmentBackup(): RoadEquipmentBackup {
  return {
    module: "communepilot-road-equipment",
    version: ROAD_EQUIPMENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state: loadRoadEquipmentState(),
  };
}

export function restoreRoadEquipmentBackup(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("Sauvegarde invalide.");
  const backup = value as Partial<RoadEquipmentBackup>;
  if (backup.module !== "communepilot-road-equipment" || !backup.state) {
    throw new Error("Ce fichier n’est pas une sauvegarde des équipements de voirie.");
  }
  const state = backup.state as Partial<RoadEquipmentLocalState>;
  saveRoadEquipmentState({
    added: Array.isArray(state.added) ? state.added.map(normalizeEquipment) : [],
    overrides: state.overrides && typeof state.overrides === "object"
      ? Object.fromEntries(Object.entries(state.overrides).map(([id, item]) => [id, normalizeEquipment(item)]))
      : {},
    deletedOsmIds: Array.isArray(state.deletedOsmIds) ? state.deletedOsmIds : [],
  });
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
