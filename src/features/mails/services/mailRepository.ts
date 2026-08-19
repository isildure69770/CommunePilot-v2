import { sampleMails } from "../data/mails";
import type { MailAttachment, MailStatus, MunicipalMail } from "../types/mail";

export const MAIL_STORAGE_KEY = "communepilot-mails-v2";
const LEGACY_KEYS = ["communepilot-mails", "mails"];
export const MAILS_CHANGED_EVENT = "communepilot:mails-changed";
const DELETED_OUTLOOK_MAILS_KEY = "communepilot-deleted-outlook-mails-v1";

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
    recipients: Array.isArray(raw.recipients) ? raw.recipients : [],
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
    isRead: raw.isRead,
    hasAttachments: raw.hasAttachments ?? attachments.length > 0,
    webUrl: raw.webUrl,
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

function getDeletedOutlookIds(): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DELETED_OUTLOOK_MAILS_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
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
  deleteLocal(id: number): MunicipalMail[] {
    const current = this.getAll();
    const removed = current.find((mail) => mail.id === id);
    if (removed?.source === "outlook" && removed.externalId) {
      const deletedIds = getDeletedOutlookIds();
      deletedIds.add(removed.externalId);
      localStorage.setItem(DELETED_OUTLOOK_MAILS_KEY, JSON.stringify([...deletedIds]));
    }
    const next = current.filter((mail) => mail.id !== id);
    this.saveAll(next);
    return next;
  },
  mergeProviderMails(remoteMails: MunicipalMail[]): MunicipalMail[] {
    const current = this.getAll();
    const deletedOutlookIds = getDeletedOutlookIds();
    const visibleRemoteMails = remoteMails.filter((mail) => !mail.externalId || !deletedOutlookIds.has(mail.externalId));
    const byExternalId = new Map(current.filter((mail) => mail.externalId).map((mail) => [mail.externalId, mail]));
    const incomingIds = new Set(visibleRemoteMails.map((mail) => mail.externalId));
    const mergedRemote = visibleRemoteMails.map((remote) => {
      const local = remote.externalId ? byExternalId.get(remote.externalId) : undefined;
      if (!local) return remote;
      return { ...remote, id: local.id, status: local.status, commission: local.commission, category: local.category, dossierId: local.dossierId, summary: local.summary, internalNotes: local.internalNotes, followUps: local.followUps };
    });
    const untouched = current.filter((mail) => !mail.externalId || !incomingIds.has(mail.externalId));
    const next = [...mergedRemote, ...untouched].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    this.saveAll(next);
    return next;
  },
};

/**
 * Futur point d’intégration Gmail/Outlook : un adaptateur sécurisé convertira
 * les messages du fournisseur en MunicipalMail puis appellera saveAll/update.
 * Aucun jeton, secret ni appel distant ne doit vivre dans ce repository local.
 */
