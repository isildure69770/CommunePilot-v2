import type { FeatureCollection, Point } from "geojson";
import type {
  RoadEquipment,
  RoadEquipmentCategory,
} from "../types/roadEquipment";

interface OsmProperties {
  osm_id?: number;
  category?: string;
  name?: string;
  source?: string;
  material?: string;
  backrest?: string;
}

export async function loadOsmRoadEquipment(): Promise<RoadEquipment[]> {
  const response = await fetch("/data/montrottier/road-equipment.geojson");
  if (!response.ok) {
    throw new Error("Impossible de charger les équipements de voirie.");
  }

  const data = (await response.json()) as FeatureCollection<Point, OsmProperties>;
  return data.features.map((feature, index) => {
    const properties = feature.properties ?? {};
    const [longitude, latitude] = feature.geometry.coordinates;
    const osmId = properties.osm_id;

    return {
      id: osmId ? `osm-${osmId}` : `osm-position-${index}`,
      osmId,
      category: (properties.category || "Autre") as RoadEquipmentCategory,
      name: properties.name ?? "",
      status: "En service",
      notes: "",
      photo: "",
      lastInspectionDate: "",
      nextInspectionDate: "",
      nextMaintenanceDate: "",
      maintenanceNotes: "",
      maintenanceHistory: [],
      interventions: [],
      documents: [],
      latitude,
      longitude,
      origin: "OSM",
      sourceDetail: properties.source,
      material: properties.material,
      backrest: properties.backrest,
    };
  });
}
