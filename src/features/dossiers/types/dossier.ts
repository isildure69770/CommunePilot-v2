export type DossierStatus =
  | "À traiter"
  | "En cours"
  | "En attente"
  | "Terminé";

export type DossierPriority =
  | "Basse"
  | "Normale"
  | "Haute"
  | "Urgente";

export interface Dossier {
  id: number;
  title: string;
  description: string;
  category: string;
  manager: string;
  status: DossierStatus;
  priority: DossierPriority;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}