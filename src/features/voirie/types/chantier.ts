export type ChantierStatus =
  | "À étudier"
  | "Planifié"
  | "En cours"
  | "Suspendu"
  | "Terminé";

export type ChantierPriority =
  | "Basse"
  | "Normale"
  | "Haute"
  | "Urgente";

export interface Chantier {
  id: number;
  title: string;
  description: string;
  location: string;
  company: string;
  manager: string;
  status: ChantierStatus;
  priority: ChantierPriority;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  actualCost: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}