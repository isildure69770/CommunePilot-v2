export const MAIL_STATUSES = ["À traiter", "En cours", "Répondu", "Classé"] as const;

export type MailStatus = (typeof MAIL_STATUSES)[number];

export interface MailAttachment {
  id: string;
  name: string;
  size?: number;
  mimeType?: string;
  /** URL locale ou distante fournie par un futur connecteur. Jamais inventée. */
  url?: string;
  isInline?: boolean;
}

export interface MailFollowUp {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface MunicipalMail {
  id: number;
  externalId?: string;
  sender: string;
  senderEmail?: string;
  recipients?: string[];
  subject: string;
  preview: string;
  content: string;
  receivedAt: string;
  status: MailStatus;
  commission?: string;
  category?: string;
  dossierId?: number;
  attachments: MailAttachment[];
  summary?: string;
  internalNotes?: string;
  followUps: MailFollowUp[];
  source: "local" | "gmail" | "outlook";
  isRead?: boolean;
  hasAttachments?: boolean;
  webUrl?: string;
  updatedAt: string;
}

export interface MailFilters {
  search: string;
  status: MailStatus | "Tous";
  commission: string;
  dossierId: number | "Tous" | "Sans dossier";
  hasAttachments: "Tous" | "Avec" | "Sans";
  dateFrom: string;
  dateTo: string;
}
