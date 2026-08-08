import {
  useEffect,
  useState,
} from "react";

import {
  GeoJSON,
} from "react-leaflet";

import L from "leaflet";

import type {
  FeatureCollection,
  Point,
} from "geojson";

interface HamletProperties {
  osm_id?: number;
  name?: string;
  place?: string;
}

export default function HamletsLayer() {
  const [hamlets, setHamlets] =
    useState<FeatureCollection<
      Point,
      HamletProperties
    > | null>(null);

  useEffect(() => {
    async function loadHamlets() {
      try {
        const response = await fetch(
          "/data/montrottier/hamlets.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les hameaux.",
          );
        }

        const data =
          (await response.json()) as FeatureCollection<
            Point,
            HamletProperties
          >;

        setHamlets(data);
      } catch (error) {
        console.error(
          "Erreur chargement hameaux :",
          error,
        );
      }
    }

    loadHamlets();
  }, []);

  if (!hamlets) {
    return null;
  }

  return (
    <GeoJSON
      data={hamlets}
      pointToLayer={(feature, latlng) => {
        const name =
          feature.properties?.name ??
          "Lieu-dit";

        const place =
          feature.properties?.place ??
          "";

        const icon = L.divIcon({
          className: "hamlet-label",
          html: `<span>${name}</span>`,
          iconSize: undefined,
        });

        const marker = L.marker(
          latlng,
          { icon },
        );

        marker.bindPopup(`
          <div>
            <strong>📍 ${name}</strong><br />
            Type OSM : ${place || "Non renseigné"}
          </div>
        `);

        return marker;
      }}
    />
  );
}