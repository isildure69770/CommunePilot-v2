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

export const DOCUMENT_CATEGORIES = ["Devis", "Facture", "Plan", "Courrier", "Photo", "Contrat", "Autre"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface DossierDocument {
  id: string;
  originalName: string;
  category: DocumentCategory;
  mimeType?: string;
  size?: number;
  addedAt: string;
  source: "mail" | "local";
  sourceMailId?: number;
  sourceMailExternalId?: string;
  sourceMailSubject?: string;
  sourceMailSender?: string;
  sourceMailSenderEmail?: string;
  sourceMailReceivedAt?: string;
  attachmentId?: string;
  blobKey: string;
}

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
  documents?: DossierDocument[];
}
