import type { Dossier } from "../types/dossier";

export const initialDossiers: Dossier[] = [
  {
    id: 1,
    title: "Réfection de la route des Auberges",
    description:
      "Suivi des travaux, devis, planning et échanges avec l’entreprise.",
    category: "Voirie",
    manager: "Bernard Boulocher",
    status: "En cours",
    priority: "Haute",
    deadline: "2026-08-18",
    createdAt: "2026-07-20",
    updatedAt: "2026-08-06",
  },
  {
    id: 2,
    title: "Entretien de la salle des fêtes",
    description:
      "Contrôle du bâtiment, demandes d’intervention et suivi des réparations.",
    category: "Bâtiments",
    manager: "Service technique",
    status: "À traiter",
    priority: "Normale",
    deadline: "2026-08-25",
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
  {
    id: 3,
    title: "Préparation du conseil municipal",
    description:
      "Convocation, ordre du jour, documents préparatoires et procès-verbal.",
    category: "Conseil municipal",
    manager: "Secrétariat",
    status: "En attente",
    priority: "Urgente",
    deadline: "2026-08-12",
    createdAt: "2026-08-03",
    updatedAt: "2026-08-06",
  },
];