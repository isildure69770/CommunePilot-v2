import type { MunicipalMail } from "../types/mail";
export interface MailPage { mails: MunicipalMail[]; nextCursor?: string; deltaCursor?: string; }
export interface MailProvider { getMessages(cursor?: string): Promise<MailPage>; getAttachment(messageId: string, attachmentId: string): Promise<Blob>; }
