import { useEffect, useMemo, useState } from "react";
import { businessLayerRepository, calculateLineLength } from "../services/customLayerStorage";
import type { CustomMapLayer, CustomMapLayerKind, CustomMapLayerStatus, CustomMapSection, InterventionSide, LayerHistoryEntry, LineStringGeometry } from "../types/customLayer";

const DEFAULT_COLORS: Record<CustomMapLayerKind, string> = { eparage: "#d97706", fauchage: "#548b45", salage: "#4b82a8", "curage-fosses": "#7c6f64", balayage: "#6b7280", "refection-chaussee": "#48586a", controle: "#7467a8", autre: "#687386" };
const history = (action: LayerHistoryEntry["action"], label: string, sectionId?: string, userId?: string): LayerHistoryEntry => ({ id: crypto.randomUUID(), at: new Date().toISOString(), action, label, sectionId, userId });

export function useCustomMapLayers(userId?: string) {
  const [data, setData] = useState(businessLayerRepository.load);
  useEffect(() => businessLayerRepository.subscribe(() => setData(businessLayerRepository.load())), []);
  const update = (next: typeof data) => { setData(next); businessLayerRepository.save(next); };
  const updateLayerHistory = (layers: CustomMapLayer[], id: string, entry: LayerHistoryEntry) => layers.map(layer => layer.id === id ? { ...layer, updatedAt: entry.at, history: [entry, ...layer.history] } : layer);

  function addLayer(value: { name: string; kind: CustomMapLayerKind; color?: string; year?: number; description?: string }) {
    const now = new Date().toISOString(); const entry = history("creation", `Couche « ${value.name.trim()} » créée`, undefined, userId);
    const layer: CustomMapLayer = { id: crypto.randomUUID(), name: value.name.trim(), kind: value.kind, year: value.year, description: value.description?.trim() ?? "", color: value.color || DEFAULT_COLORS[value.kind], visible: true, active: true, archived: false, createdAt: now, updatedAt: now, history: [entry] };
    update({ ...data, layers: [...data.layers, layer] }); return layer;
  }
  function updateLayer(id: string, values: Partial<Pick<CustomMapLayer,"name"|"kind"|"year"|"description"|"color"|"active"|"archived">>) {
    const current = data.layers.find(layer => layer.id === id); if (!current) return;
    const archiveChanged = values.archived !== undefined && values.archived !== current.archived;
    const entry = history(archiveChanged ? (values.archived ? "archivage" : "reactivation") : "modification", archiveChanged ? (values.archived ? "Couche archivée et paramètres modifiés" : "Couche réactivée et paramètres modifiés") : "Paramètres de la couche modifiés", undefined, userId);
    update({ ...data, layers: updateLayerHistory(data.layers.map(layer => layer.id === id ? { ...layer, ...values, visible: values.archived ? false : layer.visible } : layer), id, entry) });
  }
  function toggleLayer(id: string) { update({ ...data, layers: data.layers.map(layer => layer.id === id ? { ...layer, visible: !layer.visible } : layer) }); }
  function setLayerArchived(id: string, archived: boolean) {
    const entry = history(archived ? "archivage" : "reactivation", archived ? "Couche archivée" : "Couche réactivée", undefined, userId);
    update({ ...data, layers: data.layers.map(layer => layer.id === id ? { ...layer, archived, active: !archived, visible: archived ? false : layer.visible, updatedAt: entry.at, history: [entry, ...layer.history] } : layer) });
  }
  function duplicateLayer(id: string, options?: { name?: string; copySections?: boolean }) {
    const source = data.layers.find(layer => layer.id === id); if (!source) return;
    const now = new Date().toISOString(); const duplicateId = crypto.randomUUID(); const name = options?.name?.trim() || `${source.name} — copie`;
    const copiedSections = options?.copySections ? data.sections.filter(section => section.layerId === id).map(section => ({ ...section, id: crypto.randomUUID(), layerId: duplicateId, missionId: undefined, dossierId: undefined, createdAt: now, updatedAt: now })) : [];
    const duplicate: CustomMapLayer = { ...source, id: duplicateId, name, visible: true, active: true, archived: false, deletedAt: undefined, createdAt: now, updatedAt: now, history: [history("duplication", `Couche créée à partir de « ${source.name} »${copiedSections.length ? ` avec ${copiedSections.length} portion(s)` : " sans copier les portions"}`, undefined, userId)] };
    const sourceEntry = history("duplication", `Couche dupliquée vers « ${name} »`, undefined, userId);
    update({ ...data, layers: [...updateLayerHistory(data.layers, id, sourceEntry), duplicate], sections: [...data.sections, ...copiedSections] }); return duplicate;
  }
  function deleteLayer(id: string) {
    const layer = data.layers.find(item => item.id === id); if (!layer) return false;
    const removedSections = data.sections.filter(section => section.layerId === id).length;
    const entry = history("suppression", `Couche supprimée définitivement avec ${removedSections} portion(s)`, undefined, userId);
    update({ layers: data.layers.map(item => item.id === id ? { ...item, active: false, archived: true, visible: false, deletedAt: entry.at, updatedAt: entry.at, history: [entry, ...item.history] } : item), sections: data.sections.filter(section => section.layerId !== id), version: data.version }); return true;
  }
  function addSection(value: { layerId: string; name: string; sector?: string; status: CustomMapLayerStatus; completionDate?: string; assignee?: string; notes?: string; geometry: LineStringGeometry; interventionSide: InterventionSide; dossierId?: number; missionId?: string; source?: CustomMapSection["source"]; sourceProperties?: Record<string, unknown> }) {
    const now = new Date().toISOString(); const lengthMeters = calculateLineLength(value.geometry.coordinates); const linearCoefficient = value.interventionSide === "deux-cotes" ? 2 : 1;
    const section: CustomMapSection = { ...value, id: crypto.randomUUID(), name: value.name.trim(), sector: value.sector?.trim() ?? "", lengthMeters, linearCoefficient, businessLengthMeters: Math.round(lengthMeters * linearCoefficient * 10) / 10, completionDate: value.completionDate ?? "", assignee: value.assignee ?? "", notes: value.notes ?? "", source: value.source ?? "manual", createdAt: now, updatedAt: now };
    update({ ...data, layers: updateLayerHistory(data.layers, value.layerId, history(value.source === "uMap" || value.source === "geojson" ? "import" : "creation", `Portion « ${section.name} » ajoutée`, section.id, userId)), sections: [...data.sections, section] }); return section;
  }
  function updateSection(id: string, values: Partial<Omit<CustomMapSection,"id"|"layerId"|"createdAt">>) { const old = data.sections.find(s => s.id === id); if (!old) return; const geometry = values.geometry ?? old.geometry; const lengthMeters = calculateLineLength(geometry.coordinates); const interventionSide = values.interventionSide ?? old.interventionSide; const linearCoefficient = interventionSide === "deux-cotes" ? 2 : (values.linearCoefficient ?? 1); const statusChanged = values.status && values.status !== old.status; const updated = { ...old, ...values, geometry, lengthMeters, interventionSide, linearCoefficient, businessLengthMeters: Math.round(lengthMeters * linearCoefficient * 10) / 10, updatedAt: new Date().toISOString() }; update({ ...data, layers: updateLayerHistory(data.layers, old.layerId, history(statusChanged ? "statut" : "modification", statusChanged ? `Statut de « ${old.name} » modifié` : `Portion « ${old.name} » modifiée`, id, userId)), sections: data.sections.map(s => s.id === id ? updated : s) }); }
  function removeSection(id: string) { const old = data.sections.find(s => s.id === id); if (!old) return; update({ ...data, layers: updateLayerHistory(data.layers, old.layerId, history("suppression", `Portion « ${old.name} » supprimée`, id, userId)), sections: data.sections.filter(section => section.id !== id) }); }
  const visibleSections = useMemo(() => { const visible = new Set(data.layers.filter(layer => layer.visible && layer.active && !layer.archived && !layer.deletedAt).map(layer => layer.id)); return data.sections.filter(section => visible.has(section.layerId)); }, [data]);
  return { ...data, visibleSections, addLayer, updateLayer, toggleLayer, setLayerArchived, duplicateLayer, deleteLayer, addSection, updateSection, removeSection };
}
