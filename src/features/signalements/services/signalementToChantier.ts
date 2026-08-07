import type {
  Signalement,
} from "../types/signalement";

import type {
  Chantier,
} from "../../voirie/types/chantier";

const STORAGE_KEY =
  "communepilot-chantiers";

function loadChantiers(): Chantier[] {
  const storedValue =
    localStorage.getItem(
      STORAGE_KEY,
    );

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(
      storedValue,
    ) as Chantier[];
  } catch {
    return [];
  }
}

function saveChantiers(
  chantiers: Chantier[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      chantiers,
    ),
  );
}

export function createChantierFromSignalement(
  signalement: Signalement,
): Chantier {
  const now =
    new Date().toISOString();

  const newChantier: Chantier = {
    id: Date.now(),

    title:
      signalement.title,

    description:
      `Chantier créé depuis le signalement #${signalement.id}.\n\n${signalement.description}`,

    location:
      signalement.location,

    latitude:
      signalement.latitude,

    longitude:
      signalement.longitude,

    company:
      "À définir",

    manager:
      signalement.manager ||
      "Commission Voirie",

    status:
      "À étudier",

    priority:
      signalement.priority ===
      "Urgente"
        ? "Urgente"
        : signalement.priority ===
            "Haute"
          ? "Haute"
          : "Normale",

    startDate:
      "",

    endDate:
      "",

    estimatedBudget:
      0,

    actualCost:
      0,

    progress:
      0,

    createdAt:
      now,

    updatedAt:
      now,
  };

  const currentChantiers =
    loadChantiers();

  saveChantiers([
    newChantier,
    ...currentChantiers,
  ]);

  return newChantier;
}