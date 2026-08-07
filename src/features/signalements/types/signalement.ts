export type SignalementCategory =
  | "Voirie"
  | "Bâtiment"
  | "Espaces verts"
  | "Éclairage public"
  | "Eau"
  | "Déchets"
  | "Sécurité"
  | "Mobilier urbain"
  | "Divers";

export type SignalementStatus =
  | "Nouveau"
  | "À traiter"
  | "En cours"
  | "En attente"
  | "Résolu"
  | "Classé";

export type SignalementPriority =
  | "Faible"
  | "Normale"
  | "Haute"
  | "Urgente";

export interface Signalement {
  id: number;
  title: string;
  description: string;

  category: SignalementCategory;
  status: SignalementStatus;
  priority: SignalementPriority;

  location: string;
  latitude: number;
  longitude: number;

  reporter: string;
  manager: string;

  createdAt: string;
  updatedAt: string;

  resolvedAt?: string;

  convertedToChantierId?: number;
}