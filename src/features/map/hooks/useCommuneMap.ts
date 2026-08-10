import { useEffect, useMemo, useState } from "react";

import type { Chantier } from "../../voirie/types/chantier";
import type { Signalement } from "../../signalements/types/signalement";
import type {
  EquipmentIntervention,
} from "../../equipments/services/equipmentInterventions";

const CHANTIERS_STORAGE_KEY = "communepilot-chantiers";
const SIGNALEMENTS_STORAGE_KEY = "communepilot-signalements";

function loadChantiers(): Chantier[] {
  const stored = localStorage.getItem(CHANTIERS_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as Chantier[];
  } catch {
    return [];
  }
}

function loadSignalements(): Signalement[] {
  const stored = localStorage.getItem(SIGNALEMENTS_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as Signalement[];
  } catch {
    return [];
  }
}

function hasValidCoordinates(
  latitude: unknown,
  longitude: unknown,
): latitude is number {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export interface CommuneMapMarker {
  id: string;

  sourceId:
    | number
    | string;

  type:
    | "chantier"
    | "signalement"
    | "intervention";

  title: string;
  location: string;

  latitude: number;
  longitude: number;

  status: string;
  priority: string;

  description: string;

  equipmentId?: string;
  date?: string;
}

export function useCommuneMap() {
  const [chantiers, setChantiers] =
    useState<Chantier[]>([]);

  const [signalements, setSignalements] =
    useState<Signalement[]>([]);

  const [
    interventionMarkers,
    setInterventionMarkers,
  ] = useState<CommuneMapMarker[]>([]);

  async function loadInterventionMarkers() {
    try {
      const response = await fetch(
        "/data/montrottier/amenities.geojson",
      );

      if (!response.ok) {
        setInterventionMarkers([]);
        return;
      }

      const amenities =
        (await response.json()) as {
          features: Array<{
            properties?: {
              osm_id?: number;
              name?: string;
            };

            geometry?: {
              type?: string;
              coordinates?: number[];
            };
          }>;
        };

      const nextMarkers: CommuneMapMarker[] = [];

      amenities.features.forEach((feature) => {
        const osmId =
          feature.properties?.osm_id;

        const coordinates =
          feature.geometry?.coordinates;

        if (
          osmId === undefined ||
          !coordinates ||
          coordinates.length < 2
        ) {
          return;
        }

        const [
          longitude,
          latitude,
        ] = coordinates;

        if (
          !hasValidCoordinates(
            latitude,
            longitude,
          )
        ) {
          return;
        }

        const equipmentId =
          String(osmId);

        const stored =
          localStorage.getItem(
            `equipment-interventions-${equipmentId}`,
          );

        if (!stored) {
          return;
        }

        try {
          const interventions =
            JSON.parse(
              stored,
            ) as EquipmentIntervention[];

          interventions.forEach(
            (intervention) => {
              nextMarkers.push({
                id:
                  `intervention-${equipmentId}-${intervention.id}`,

                sourceId:
                  intervention.id,

                type:
                  "intervention",

                title:
                  intervention.title,

                location:
                  feature.properties?.name?.trim() ||
                  "Équipement communal",

                latitude,
                longitude,

                status:
                  intervention.status,

                priority:
                  "Normale",

                description:
                  intervention.description,

                equipmentId,

                date:
                  intervention.date,
              });
            },
          );
        } catch {
          // Ignore une donnée locale invalide.
        }
      });

      setInterventionMarkers(
        nextMarkers,
      );
    } catch (error) {
      console.error(
        "Erreur chargement interventions carte :",
        error,
      );

      setInterventionMarkers([]);
    }
  }

  function refresh() {
    setChantiers(
      loadChantiers(),
    );

    setSignalements(
      loadSignalements(),
    );

    void loadInterventionMarkers();
  }

  useEffect(() => {
    refresh();

    function handleStorage() {
      refresh();
    }

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  const markers =
    useMemo<CommuneMapMarker[]>(
      () => {
        const chantierMarkers =
          chantiers
            .filter((chantier) =>
              hasValidCoordinates(
                chantier.latitude,
                chantier.longitude,
              ),
            )
            .map(
              (
                chantier,
              ): CommuneMapMarker => ({
                id: `chantier-${chantier.id}`,

                sourceId:
                  chantier.id,

                type:
                  "chantier",

                title:
                  chantier.title,

                location:
                  chantier.location,

                latitude:
                  chantier.latitude,

                longitude:
                  chantier.longitude,

                status:
                  chantier.status,

                priority:
                  chantier.priority,

                description:
                  chantier.description,
              }),
            );

        const signalementMarkers =
          signalements
            .filter((signalement) =>
              hasValidCoordinates(
                signalement.latitude,
                signalement.longitude,
              ),
            )
            .map(
              (
                signalement,
              ): CommuneMapMarker => ({
                id: `signalement-${signalement.id}`,

                sourceId:
                  signalement.id,

                type:
                  "signalement",

                title:
                  signalement.title,

                location:
                  signalement.location,

                latitude:
                  signalement.latitude,

                longitude:
                  signalement.longitude,

                status:
                  signalement.status,

                priority:
                  signalement.priority,

                description:
                  signalement.description,
              }),
            );

        return [
          ...chantierMarkers,
          ...signalementMarkers,
          ...interventionMarkers,
        ];
      },
      [
        chantiers,
        signalements,
        interventionMarkers,
      ],
    );

  const statistics =
    useMemo(() => {
      return {
        total:
          markers.length,

        chantiers:
          chantiers.length,

        signalements:
          signalements.length,

        urgents:
          markers.filter(
            (marker) =>
              marker.priority ===
              "Urgente",
          ).length,

        sansCoordonnees:
          chantiers.length +
          signalements.length -
          markers.filter(
            (marker) =>
              marker.type !==
              "intervention",
          ).length,
      };
    }, [
      markers,
      chantiers,
      signalements,
    ]);

  return {
    chantiers,
    signalements,

    markers,
    statistics,

    refresh,
  };
}