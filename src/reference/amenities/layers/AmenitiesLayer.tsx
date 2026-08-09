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

interface AmenityProperties {
  osm_id?: number;
  name?: string;
  amenity?: string;
  building?: string;
  historic?: string;
  heritage?: string;
  ref_mhs?: string;
  start_date?: string;
  wikidata?: string;
}

function translateAmenity(
  value?: string,
) {
  switch (value) {
    case "townhall":
      return "Mairie";

    case "school":
      return "École";

      case "historic_building":
  return "Bâtiment historique";

    case "public_building":
    return "Bâtiment public";

    case "kindergarten":
      return "École maternelle";

    case "library":
      return "Bibliothèque";

    case "cinema":
      return "Cinéma";

    case "parking":
      return "Parking";

    case "grave_yard":
      return "Cimetière";

    case "recycling":
      return "Point de recyclage";

    case "car_pooling":
      return "Aire de covoiturage";

    case "place_of_worship":
      return "Lieu de culte";

    case "post_office":
      return "Bureau de poste";

    default:
      return value ?? "Équipement";
  }
}

function getAmenityIcon(
  amenity?: string,
) {
  switch (amenity) {
    case "townhall":
      return "🏛️";

    case "school":
    case "kindergarten":
      return "🏫";

case "historic_building":
  return "🏛️";

case "public_building":
  return "🏢";

    case "library":
      return "📚";

    case "cinema":
      return "🎬";

    case "parking":
      return "🅿️";

    case "grave_yard":
      return "⚰️";

    case "recycling":
      return "♻️";

    case "car_pooling":
      return "🚗";

    case "place_of_worship":
      return "⛪";

    case "post_office":
      return "📮";

    default:
      return "📍";
  }
}

export default function AmenitiesLayer() {
  const [
    amenities,
    setAmenities,
  ] = useState<FeatureCollection<
    Point,
    AmenityProperties
  > | null>(null);

  useEffect(() => {
    async function loadAmenities() {
      try {
        const response = await fetch(
          "/data/montrottier/amenities.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les équipements.",
          );
        }

        const data =
          (await response.json()) as FeatureCollection<
            Point,
            AmenityProperties
          >;

        setAmenities(data);
      } catch (error) {
        console.error(
          "Erreur chargement équipements :",
          error,
        );
      }
    }

    loadAmenities();
  }, []);

  if (!amenities) {
    return null;
  }

  return (
    <GeoJSON
      data={amenities}
      pointToLayer={(feature, latlng) => {
        const properties =
          feature.properties;

        const name =
          properties?.name?.trim() ||
          translateAmenity(
            properties?.amenity,
          );

        const amenity =
          translateAmenity(
            properties?.amenity,
          );

        const icon =
          getAmenityIcon(
            properties?.amenity,
          );

        const markerIcon = L.divIcon({
          className: "amenity-marker",
          html: `
            <div class="amenity-marker-content">
              <span>${icon}</span>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(
          latlng,
          {
            icon: markerIcon,
          },
        );

      

const heritageInfo = [
  properties?.historic
    ? `Historique : ${properties.historic}`
    : null,

  properties?.heritage
    ? `Protection patrimoniale : ${properties.heritage}`
    : null,

  properties?.ref_mhs
    ? `Référence Monument historique : ${properties.ref_mhs}`
    : null,

  properties?.start_date
    ? `Datation : ${properties.start_date}`
    : null,
]
  .filter(Boolean)
  .join("<br />");

marker.bindPopup(`
  <div>
    <strong>
      ${icon} ${name}
    </strong>

    <br />
    Type : ${amenity}

    ${
      heritageInfo
        ? `<br /><br />${heritageInfo}`
        : ""
    }

    <br /><br />

    <a
      href="/equipments/${properties?.osm_id ?? 0}"
      style="
        display:inline-block;
        padding:6px 10px;
        border-radius:6px;
        background:#16365d;
        color:white;
        text-decoration:none;
        font-weight:600;
      "
    >
      Ouvrir la fiche
    </a>
  </div>
`);

        return marker;
      }}
    />
  );
}