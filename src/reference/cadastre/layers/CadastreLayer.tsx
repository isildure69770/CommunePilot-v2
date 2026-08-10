import {
  useEffect,
  useState,
} from "react";

import {
  GeoJSON,
 
} from "react-leaflet";

import type {
  FeatureCollection,
  Geometry,
} from "geojson";

interface ParcelProperties {
  id?: string;
  commune?: string;
  prefixe?: string;
  section?: string;
  numero?: string;
  contenance?: number;
  arpente?: boolean;
  created?: string;
  updated?: string;
}

export default function CadastreLayer() {
  const [
    data,
    setData,
  ] = useState<FeatureCollection<
    Geometry,
    ParcelProperties
  > | null>(null);

  useEffect(() => {
    async function loadCadastre() {
      try {
        const response = await fetch(
          "/data/montrottier/parcelles.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger le cadastre.",
          );
        }

        const geojson =
          (await response.json()) as FeatureCollection<
            Geometry,
            ParcelProperties
          >;

        setData(
          geojson,
        );
      } catch (error) {
        console.error(
          "Erreur chargement cadastre :",
          error,
        );
      }
    }

    void loadCadastre();
  }, []);

  if (!data) {
    return null;
  }

  return (
    <GeoJSON
      data={data}
      style={() => ({
        color: "#8a5a2b",
        weight: 1,
        fillColor: "#d8b07a",
        fillOpacity: 0.08,
      })}
      onEachFeature={(
        feature,
        layer,
      ) => {
        const properties =
          feature.properties as ParcelProperties;

        const section =
          properties.section ?? "?";

        const numero =
          properties.numero ?? "?";

        const contenance =
          properties.contenance;

        const popup = document.createElement(
          "div",
        );

        popup.innerHTML = `
          <strong>Parcelle ${section} ${numero}</strong>
          ${
            contenance !== undefined
              ? `<br />Contenance : ${contenance.toLocaleString("fr-FR")} m²`
              : ""
          }
          ${
            properties.id
              ? `<br />Référence : ${properties.id}`
              : ""
          }
        `;

        layer.bindPopup(
          popup,
        );
      }}
    />
  );
}