import type { Signalement } from "../types/signalement";

export const initialSignalements: Signalement[] = [
  {
    id: 1,
    title: "Nid-de-poule route des Auberges",
    description:
      "Dégradation de la chaussée avec un nid-de-poule important sur la voie.",
    category: "Voirie",
    status: "À traiter",
    priority: "Haute",
    location: "Route des Auberges",
    latitude: 45.790833,
    longitude: 4.4675,
    reporter: "Mairie",
    manager: "Commission Voirie",
    createdAt: "2026-08-06T08:30:00.000Z",
    updatedAt: "2026-08-06T08:30:00.000Z",
  },
  {
    id: 2,
    title: "Lampadaire en panne",
    description:
      "Un lampadaire ne fonctionne plus dans le centre du village.",
    category: "Éclairage public",
    status: "En cours",
    priority: "Normale",
    location: "Centre-bourg",
    latitude: 45.7912,
    longitude: 4.4681,
    reporter: "Habitant",
    manager: "Service technique",
    createdAt: "2026-08-05T17:00:00.000Z",
    updatedAt: "2026-08-06T09:00:00.000Z",
  },
  {
    id: 3,
    title: "Branche dangereuse",
    description:
      "Une grosse branche menace de tomber sur le chemin.",
    category: "Espaces verts",
    status: "Nouveau",
    priority: "Urgente",
    location: "Chemin du Moulin",
    latitude: 45.7899,
    longitude: 4.4666,
    reporter: "Agent communal",
    manager: "Service technique",
    createdAt: "2026-08-07T06:00:00.000Z",
    updatedAt: "2026-08-07T06:00:00.000Z",
  },
];