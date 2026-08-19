export const ROAD_EQUIPMENT_CATEGORIES = [
  "Banc",
  "Barrière / portail",
  "Corbeille",
  "Point déchets",
  "Point d'eau potable",
  "Poteau incendie",
  "Lampadaire",
  "Panneau de signalisation",
  "Borne",
  "Armoire technique",
  "Autre",
] as const;

export type RoadEquipmentCategory =
  (typeof ROAD_EQUIPMENT_CATEGORIES)[number];

export type RoadEquipmentOrigin = "OSM" | "CommunePilot";

export interface RoadEquipmentMaintenanceEntry {
  id: string;
  date: string;
  description: string;
  cost?: number;
}

export interface RoadEquipmentIntervention {
  id: string;
  date: string;
  title: string;
  status: "Planifiée" | "En cours" | "Terminée";
  details: string;
  cost?: number;
}

export interface RoadEquipmentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  dataUrl: string;
}

export interface RoadEquipment {
  id: string;
  osmId?: number;
  category: RoadEquipmentCategory;
  name: string;
  status: string;
  notes: string;
  photo?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  maintenanceHistory: RoadEquipmentMaintenanceEntry[];
  interventions: RoadEquipmentIntervention[];
  documents: RoadEquipmentDocument[];
  latitude: number;
  longitude: number;
  origin: RoadEquipmentOrigin;
  sourceDetail?: string;
  material?: string;
  backrest?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RoadEquipmentFormValue = Omit<
  RoadEquipment,
  "id" | "osmId" | "origin" | "sourceDetail" | "createdAt" | "updatedAt"
>;

export interface RoadEquipmentLocalState {
  added: RoadEquipment[];
  overrides: Record<string, RoadEquipment>;
  deletedOsmIds: string[];
}
