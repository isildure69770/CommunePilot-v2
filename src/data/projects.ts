import type { Project } from "../types/project";

export const projects: Project[] = [
  {
    id: 1,
    title: "Réfection de la route des Auberges",
    category: "Voirie",
    manager: "Bernard Boulocher",
    status: "En cours",
    priority: "Haute",
    deadline: "18 août 2026",
  },
  {
    id: 2,
    title: "Entretien de la salle des fêtes",
    category: "Bâtiments",
    manager: "Service technique",
    status: "À traiter",
    priority: "Normale",
    deadline: "25 août 2026",
  },
  {
    id: 3,
    title: "Préparation du prochain conseil municipal",
    category: "Conseil municipal",
    manager: "Secrétariat",
    status: "En cours",
    priority: "Haute",
    deadline: "12 août 2026",
  },
  {
    id: 4,
    title: "Mise à jour du plan d'entretien du village",
    category: "Communication",
    manager: "Commission communication",
    status: "Terminé",
    priority: "Basse",
    deadline: "5 août 2026",
  },
];
