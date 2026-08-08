import {
  useEffect,
  useState,
} from "react";

import {
  GeoJSON,
} from "react-leaflet";

import type {
  Feature,
  GeoJsonObject,
} from "geojson";

interface BuildingProperties {
  name?: string;
  building?: string;
  amenity?: string;
}

function getBuildingStyle(
  feature?: Feature,
) {
  const properties =
    feature?.properties as
      | BuildingProperties
      | undefined;

  const building =
    properties?.building ?? "";

  const amenity =
    properties?.amenity ?? "";

  if (
    amenity === "townhall" ||
    amenity === "school"
  ) {
    return {
      color: "#7c3aed",
      weight: 2,
      fillColor: "#a78bfa",
      fillOpacity: 0.45,
    };
  }

  if (
    building === "church" ||
    building === "chapel"
  ) {
    return {
      color: "#b45309",
      weight: 2,
      fillColor: "#f59e0b",
      fillOpacity: 0.45,
    };
  }

  return {
    color: "#475569",
    weight: 1,
    fillColor: "#94a3b8",
    fillOpacity: 0.25,
  };
}

export default function BuildingsLayer() {
  const [
    buildings,
    setBuildings,
  ] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBuildings() {
      try {
        const response = await fetch(
          "/data/montrottier/buildings.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les bâtiments.",
          );
        }

        const data =
          (await response.json()) as GeoJsonObject;

        if (!cancelled) {
          setBuildings(data);
        }
      } catch (error) {
        console.error(
          "Erreur chargement bâtiments :",
          error,
        );
      }
    }

    loadBuildings();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!buildings) {
    return null;
  }

  return (
    <GeoJSON
      data={buildings}
      style={getBuildingStyle}
      onEachFeature={(feature, layer) => {
        const properties =
          feature.properties as BuildingProperties;

        const name =
          properties.name ??
          "Bâtiment sans nom";

        const type =
          properties.building ??
          "Non renseigné";

        const amenity =
          properties.amenity ??
          "—";

        layer.bindPopup(`
          <div>
            <strong>🏢 ${name}</strong><br />
            Type : ${type}<br />
            Équipement : ${amenity}
          </div>
        `);
      }}
    />
  );
}