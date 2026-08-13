import type { CustomMapData, CustomMapLayer, CustomMapSection, CustomMapLayerStatus, InterventionSide } from "../types/customLayer";

export const CUSTOM_MAP_STORAGE_KEY = "communepilot-custom-map-layers";
export const CUSTOM_MAP_CHANGED = "communepilot-custom-map-change";
const EMPTY_DATA: CustomMapData = { version: 2, layers: [], sections: [] };

export function calculateLineLength(coordinates: Array<[number, number]>): number {
  const radius = 6371008.8; let total = 0;
  const rad = (value: number) => value * Math.PI / 180;
  for (let i = 1; i < coordinates.length; i += 1) {
    const [lon1, lat1] = coordinates[i - 1]; const [lon2, lat2] = coordinates[i];
    const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    total += radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total * 10) / 10;
}

function migrate(raw: any): CustomMapData {
  const now = new Date().toISOString();
  const layers: CustomMapLayer[] = (Array.isArray(raw?.layers) ? raw.layers : []).map((layer: any) => ({
    ...layer, kind: layer.kind === "sentiers" ? "autre" : layer.kind, description: layer.description ?? "", active: layer.active ?? true,
    archived: layer.archived ?? false, deletedAt: layer.deletedAt, updatedAt: layer.updatedAt ?? layer.createdAt ?? now, createdAt: layer.createdAt ?? now, history: Array.isArray(layer.history) ? layer.history : [],
  }));
  const status = (value: string): CustomMapLayerStatus => value === "termine" ? "realise" : value === "a-programmer" ? "a-faire" : (["a-faire","en-cours","realise","a-reprendre"].includes(value) ? value as CustomMapLayerStatus : "a-faire");
  const sections: CustomMapSection[] = (Array.isArray(raw?.sections) ? raw.sections : []).map((section: any) => {
    const geometry = section.geometry?.type === "LineString" ? section.geometry : { type: "LineString" as const, coordinates: (section.coordinates ?? []).map(([lat, lon]: [number, number]) => [lon, lat]) };
    const lengthMeters = Number(section.lengthMeters) || calculateLineLength(geometry.coordinates);
    const interventionSide: InterventionSide = section.interventionSide ?? "gauche";
    const linearCoefficient = Number(section.linearCoefficient) || (interventionSide === "deux-cotes" ? 2 : 1);
    return { ...section, geometry, lengthMeters, interventionSide, linearCoefficient, businessLengthMeters: Number(section.businessLengthMeters) || Math.round(lengthMeters * linearCoefficient * 10) / 10,
      sector: section.sector ?? "", status: status(section.status), completionDate: section.completionDate ?? section.date ?? "", notes: section.notes ?? "", assignee: section.assignee ?? "",
      source: section.source ?? "manual", createdAt: section.createdAt ?? now, updatedAt: section.updatedAt ?? section.createdAt ?? now };
  });
  return { version: 2, layers, sections };
}

export function loadCustomMapData(): CustomMapData { try { const stored = localStorage.getItem(CUSTOM_MAP_STORAGE_KEY); return stored ? migrate(JSON.parse(stored)) : EMPTY_DATA; } catch { return EMPTY_DATA; } }
export function saveCustomMapData(data: CustomMapData) { localStorage.setItem(CUSTOM_MAP_STORAGE_KEY, JSON.stringify({ ...data, version: 2 })); window.dispatchEvent(new CustomEvent(CUSTOM_MAP_CHANGED)); }
export const businessLayerRepository = { load: loadCustomMapData, save: saveCustomMapData, subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(CUSTOM_MAP_CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CUSTOM_MAP_CHANGED, callback); }; } };
