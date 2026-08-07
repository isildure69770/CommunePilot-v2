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
];