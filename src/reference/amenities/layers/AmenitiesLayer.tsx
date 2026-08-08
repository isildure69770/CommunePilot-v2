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
}

function translateAmenity(
  value?: string,
) {
  switch (value) {
    case "townhall":
      return "Mairie";

    case "school":
      return "École";

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

        marker.bindPopup(`
          <div>
            <strong>
              ${icon} ${name}
            </strong>
            <br />
            Type : ${amenity}
          </div>
        `);

        return marker;
      }}
    />
  );
}