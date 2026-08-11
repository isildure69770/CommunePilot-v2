import { sampleMails } from "../data/mails";
import type { MailAttachment, MailStatus, MunicipalMail } from "../types/mail";

export const MAIL_STORAGE_KEY = "communepilot-mails-v2";
const LEGACY_KEYS = ["communepilot-mails", "mails"];
export const MAILS_CHANGED_EVENT = "communepilot:mails-changed";

type LegacyMail = Partial<MunicipalMail> & { attachmentCount?: number; receivedAt?: string };

function isStatus(value: unknown): value is MailStatus {
  return value === "À traiter" || value === "En cours" || value === "Répondu" || value === "Classé";
}

function migrateMail(raw: LegacyMail, index: number): MunicipalMail | null {
  if (!raw || typeof raw !== "object" || !raw.sender || !raw.subject) return null;
  const attachments: MailAttachment[] = Array.isArray(raw.attachments)
    ? raw.attachments.filter((item): item is MailAttachment => Boolean(item?.id && item?.name))
    : [];
  const receivedAt = raw.receivedAt && !Number.isNaN(Date.parse(raw.receivedAt))
    ? raw.receivedAt
    : new Date(Date.now() - index * 60_000).toISOString();
  return {
    id: Number(raw.id) || Date.now() + index,
    externalId: raw.externalId,
    sender: raw.sender,
    senderEmail: raw.senderEmail,
    subject: raw.subject,
    preview: raw.preview ?? "",
    content: raw.content ?? raw.preview ?? "",
    receivedAt,
    status: isStatus(raw.status) ? raw.status : "À traiter",
    commission: raw.commission,
    category: raw.category,
    dossierId: typeof raw.dossierId === "number" ? raw.dossierId : undefined,
    attachments,
    summary: raw.summary,
    internalNotes: raw.internalNotes ?? "",
    followUps: Array.isArray(raw.followUps) ? raw.followUps : [],
    source: raw.source ?? "local",
    updatedAt: raw.updatedAt ?? receivedAt,
  };
}

function parse(raw: string | null): MunicipalMail[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    return value.map((mail, index) => migrateMail(mail as LegacyMail, index)).filter((mail): mail is MunicipalMail => mail !== null);
  } catch {
    return null;
  }
}

export const mailRepository = {
  getAll(): MunicipalMail[] {
    const current = parse(localStorage.getItem(MAIL_STORAGE_KEY));
    if (current) return current;
    for (const key of LEGACY_KEYS) {
      const migrated = parse(localStorage.getItem(key));
      if (migrated) {
        this.saveAll(migrated);
        return migrated;
      }
    }
    this.saveAll(sampleMails);
    return sampleMails;
  },
  saveAll(mails: MunicipalMail[]) {
    localStorage.setItem(MAIL_STORAGE_KEY, JSON.stringify(mails));
    window.dispatchEvent(new CustomEvent(MAILS_CHANGED_EVENT));
  },
  update(id: number, changes: Partial<MunicipalMail>): MunicipalMail[] {
    const next = this.getAll().map((mail) => mail.id === id ? { ...mail, ...changes, id: mail.id, updatedAt: new Date().toISOString() } : mail);
    this.saveAll(next);
    return next;
  },
};

/**
 * Futur point d’intégration Gmail/Outlook : un adaptateur sécurisé convertira
 * les messages du fournisseur en MunicipalMail puis appellera saveAll/update.
 * Aucun jeton, secret ni appel distant ne doit vivre dans ce repository local.
 */
