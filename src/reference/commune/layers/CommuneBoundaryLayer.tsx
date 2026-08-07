import {
  useEffect,
  useState,
} from "react";

import {
  GeoJSON,
} from "react-leaflet";

import type {
  GeoJsonObject,
} from "geojson";

export default function CommuneBoundaryLayer() {
  const [
    boundary,
    setBoundary,
  ] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBoundary() {
      try {
        const response = await fetch(
          "/data/montrottier/boundary.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger le contour de Montrottier.",
          );
        }

        const data =
          (await response.json()) as GeoJsonObject;

        if (!cancelled) {
          setBoundary(data);
        }
      } catch (error) {
        console.error(
          "Erreur chargement GeoJSON :",
          error,
        );
      }
    }

    loadBoundary();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!boundary) {
    return null;
  }

  return (
    <GeoJSON
      data={boundary}
      style={{
        color: "#2563eb",
        weight: 3,
        opacity: 0.9,
        fillColor: "#3b82f6",
        fillOpacity: 0.06,
      }}
    />
  );
}