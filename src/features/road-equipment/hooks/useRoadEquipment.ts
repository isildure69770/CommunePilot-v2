import { useCallback, useEffect, useState } from "react";
import { loadOsmRoadEquipment } from "../services/roadEquipmentRepository";
import {
  loadRoadEquipmentState,
  mergeRoadEquipment,
  ROAD_EQUIPMENT_CHANGED_EVENT,
  saveRoadEquipmentState,
} from "../services/roadEquipmentStorage";
import type {
  RoadEquipment,
  RoadEquipmentFormValue,
} from "../types/roadEquipment";

export function useRoadEquipment() {
  const [equipment, setEquipment] = useState<RoadEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const osmEquipment = await loadOsmRoadEquipment();
      setEquipment(mergeRoadEquipment(osmEquipment));
      setError("");
    } catch (caughtError) {
      console.error("Erreur chargement équipements voirie :", caughtError);
      setError("Le référentiel des équipements n’a pas pu être chargé.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(ROAD_EQUIPMENT_CHANGED_EVENT, refresh);
    return () =>
      window.removeEventListener(ROAD_EQUIPMENT_CHANGED_EVENT, refresh);
  }, [refresh]);

  function addEquipment(value: RoadEquipmentFormValue) {
    const state = loadRoadEquipmentState();
    const now = new Date().toISOString();
    const created: RoadEquipment = {
      ...value,
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      origin: "CommunePilot",
      createdAt: now,
      updatedAt: now,
    };
    saveRoadEquipmentState({ ...state, added: [created, ...state.added] });
  }

  function updateEquipment(current: RoadEquipment, value: RoadEquipmentFormValue) {
    const state = loadRoadEquipmentState();
    const updated: RoadEquipment = {
      ...current,
      ...value,
      updatedAt: new Date().toISOString(),
    };

    if (current.origin === "OSM") {
      saveRoadEquipmentState({
        ...state,
        overrides: { ...state.overrides, [current.id]: updated },
      });
    } else {
      saveRoadEquipmentState({
        ...state,
        added: state.added.map((item) =>
          item.id === current.id ? updated : item,
        ),
      });
    }
  }

  function deleteEquipment(current: RoadEquipment) {
    const state = loadRoadEquipmentState();
    if (current.origin === "OSM") {
      const { [current.id]: _removed, ...overrides } = state.overrides;
      saveRoadEquipmentState({
        ...state,
        overrides,
        deletedOsmIds: Array.from(
          new Set([...state.deletedOsmIds, current.id]),
        ),
      });
    } else {
      saveRoadEquipmentState({
        ...state,
        added: state.added.filter((item) => item.id !== current.id),
      });
    }
  }

  return { equipment, loading, error, addEquipment, updateEquipment, deleteEquipment };
}
