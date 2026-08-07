export type ProjectStatus =
  | "À traiter"
  | "En cours"
  | "Terminé";

export type ProjectPriority =
  | "Basse"
  | "Normale"
  | "Haute";

export interface Project {
  id: number;
  title: string;
  category: string;
  manager: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string;
}