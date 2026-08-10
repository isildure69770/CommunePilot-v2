export type MailStatus = "À traiter" | "En cours" | "Classé";

export interface MunicipalMail {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  receivedAt: string;
  status: MailStatus;
  commission?: string;
  attachmentCount: number;
}
