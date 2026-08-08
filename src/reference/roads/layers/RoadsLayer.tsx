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

interface RoadProperties {
  name?: string;
  highway?: string;
  ref?: string;
  surface?: string;
}

function getRoadStyle(feature?: Feature) {
  const highway =
    (feature?.properties as RoadProperties | undefined)
      ?.highway;

  switch (highway) {
    case "primary":
    case "secondary":
      return {
        color: "#dc2626",
        weight: 5,
        opacity: 0.9,
      };

    case "tertiary":
      return {
        color: "#f59e0b",
        weight: 4,
        opacity: 0.9,
      };

    case "residential":
    case "unclassified":
    case "service":
      return {
        color: "#2563eb",
        weight: 3,
        opacity: 0.8,
      };

    case "track":
      return {
        color: "#92400e",
        weight: 2,
        opacity: 0.8,
        dashArray: "6 5",
      };

    case "path":
    case "footway":
    case "cycleway":
      return {
        color: "#15803d",
        weight: 2,
        opacity: 0.8,
        dashArray: "3 5",
      };

    default:
      return {
        color: "#64748b",
        weight: 2,
        opacity: 0.7,
      };
  }
}

export default function RoadsLayer() {
  const [roads, setRoads] =
    useState<GeoJsonObject | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoads() {
      try {
        const response = await fetch(
          "/data/montrottier/roads.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les routes de Montrottier.",
          );
        }

        const data =
          (await response.json()) as GeoJsonObject;

        if (!cancelled) {
          setRoads(data);
        }
      } catch (error) {
        console.error(
          "Erreur chargement routes GeoJSON :",
          error,
        );
      }
    }

    loadRoads();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!roads) {
    return null;
  }

  return (
    <GeoJSON
      data={roads}
      style={getRoadStyle}
      onEachFeature={(feature, layer) => {
        const properties =
          feature.properties as RoadProperties;

        const name =
          properties.name ?? "Voie sans nom";

        const type =
          properties.highway ?? "Non renseigné";

        const reference =
          properties.ref ?? "—";

        const surface =
          properties.surface ?? "Non renseignée";

        layer.bindPopup(`
          <div>
            <strong>🛣️ ${name}</strong><br />
            Type : ${type}<br />
            Référence : ${reference}<br />
            Revêtement : ${surface}
          </div>
        `);
      }}
    />
  );
}