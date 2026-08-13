export const BUSINESS_LAYER_KINDS = ["eparage", "fauchage", "salage", "curage-fosses", "balayage", "refection-chaussee", "controle", "autre"] as const;
export type CustomMapLayerKind = (typeof BUSINESS_LAYER_KINDS)[number];
export type CustomMapLayerStatus = "a-faire" | "en-cours" | "realise" | "a-reprendre";
export type InterventionSide = "gauche" | "droite" | "deux-cotes";

export interface LineStringGeometry { type: "LineString"; coordinates: Array<[number, number]>; }
export interface LayerHistoryEntry { id: string; at: string; userId?: string; action: "creation" | "modification" | "suppression" | "statut" | "import" | "archivage" | "reactivation" | "duplication"; label: string; sectionId?: string; }

export interface CustomMapLayer {
  id: string; name: string; kind: CustomMapLayerKind; year?: number; description: string;
  color: string; visible: boolean; active: boolean; archived: boolean;
  deletedAt?: string;
  createdAt: string; updatedAt: string; history: LayerHistoryEntry[];
}

export interface CustomMapSection {
  id: string; layerId: string; name: string; sector: string; geometry: LineStringGeometry;
  lengthMeters: number; interventionSide: InterventionSide; linearCoefficient: number; businessLengthMeters: number;
  status: CustomMapLayerStatus; completionDate: string; notes: string; assignee: string;
  dossierId?: number; missionId?: string; source: "manual" | "uMap" | "geojson" | "routing";
  sourceProperties?: Record<string, unknown>; createdAt: string; updatedAt: string;
}

export interface CustomMapData { version: 2; layers: CustomMapLayer[]; sections: CustomMapSection[]; }

export const BUSINESS_KIND_LABELS: Record<CustomMapLayerKind, string> = {
  eparage: "Éparage", fauchage: "Fauchage", salage: "Salage", "curage-fosses": "Curage des fossés",
  balayage: "Balayage", "refection-chaussee": "Réfection de chaussée", controle: "Contrôle", autre: "Autre",
};
export const STATUS_LABELS: Record<CustomMapLayerStatus, string> = { "a-faire": "À faire", "en-cours": "En cours", realise: "Réalisé", "a-reprendre": "À reprendre" };
export const STATUS_COLORS: Record<CustomMapLayerStatus, string> = { "a-faire": "#d97706", "en-cours": "#ca8a04", realise: "#23855b", "a-reprendre": "#c2413b" };
