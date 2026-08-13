import { useEffect, useMemo, useState } from "react";
import { Archive, Check, CirclePlus, Download, FilePlus2, FolderOpen, Link2, LogOut, Mail, Paperclip, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { initialDossiers } from "../../dossiers/data/dossiers";
import { deleteDocumentBlob, saveDocumentBlob } from "../../dossiers/services/dossierDocumentStorage";
import { loadDossiers, saveDossiers } from "../../dossiers/services/dossierStorage";
import type { Dossier, DossierDocument } from "../../dossiers/types/dossier";
import AddAttachmentsToDossierModal, { type AttachmentSelection } from "../components/AddAttachmentsToDossierModal";
import { useMails } from "../hooks/useMails";
import { MAIL_STATUSES, type MailFilters, type MailStatus, type MunicipalMail } from "../types/mail";
import { useMicrosoftAuth } from "../auth/MicrosoftAuthProvider";
import { useMailSync } from "../providers/MailSyncProvider";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../../dossiers/services/dossierActivityRepository";

const emptyFilters: MailFilters = { search: "", status: "Tous", commission: "Toutes", dossierId: "Tous", hasAttachments: "Tous", dateFrom: "", dateTo: "" };
const commissions = ["Voirie", "Travaux", "Vie locale", "Finances", "Bâtiments", "Conseil municipal"];
const categories = ["Subventions", "Intervention", "Réservation", "Comptabilité", "Administratif", "Autre"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: MailStatus) {
  return `status-${status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-")}`;
}

export default function MailsPage() {
  const { mails, updateMail, deleteMail } = useMails();
  const { can, user } = useIdentity();
  const { configured, account, loading: authLoading, error: authError, connect, disconnect } = useMicrosoftAuth();
  const { syncing, error: syncError, hasMore, lastSyncedAt, sync, loadMore, fetchAttachment, downloadAttachment } = useMailSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<MailFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(searchParams.get("mail")) || null);
  const [dossiers, setDossiers] = useState<Dossier[]>(() => loadDossiers() ?? initialDossiers);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");
  const [notice, setNotice] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addingDocuments, setAddingDocuments] = useState(false);
  const [addError, setAddError] = useState("");

  const selected = mails.find((mail) => mail.id === selectedId) ?? null;
  const commissionOptions = useMemo(() => Array.from(new Set([...commissions, ...mails.map((mail) => mail.commission).filter(Boolean) as string[]])).sort(), [mails]);
  const filteredMails = useMemo(() => mails.filter((mail) => {
    const query = filters.search.trim().toLowerCase();
    const searchable = `${mail.sender} ${mail.senderEmail ?? ""} ${mail.subject} ${mail.preview} ${mail.content}`.toLowerCase();
    const day = mail.receivedAt.slice(0, 10);
    return (!query || searchable.includes(query))
      && (filters.status === "Tous" || mail.status === filters.status)
      && (filters.commission === "Toutes" || mail.commission === filters.commission)
      && (filters.dossierId === "Tous" || (filters.dossierId === "Sans dossier" ? !mail.dossierId : mail.dossierId === filters.dossierId))
      && (filters.hasAttachments === "Tous" || (filters.hasAttachments === "Avec" ? mail.attachments.length > 0 : mail.attachments.length === 0))
      && (!filters.dateFrom || day >= filters.dateFrom) && (!filters.dateTo || day <= filters.dateTo);
  }), [filters, mails]);

  useEffect(() => {
    const requestedId = Number(searchParams.get("mail"));
    if (requestedId && mails.some((mail) => mail.id === requestedId)) setSelectedId(requestedId);
  }, [mails, searchParams]);

  function chooseMail(mail: MunicipalMail) {
    setSelectedId(mail.id);
    setSearchParams({ mail: String(mail.id) });
    setNotice("");
  }

  function patchSelected(changes: Partial<MunicipalMail>, message?: string) {
    if (!selected) return;
    if (changes.dossierId && changes.dossierId !== selected.dossierId) dossierActivityRepository.add({ dossierId: changes.dossierId, type: "mail", action: "linked", label: `Mail « ${selected.subject} » rattaché`, authorId: user.id, mailId: selected.id });
    updateMail(selected.id, changes);
    if (message) setNotice(message);
  }

  function createFollowUp() {
    if (!selected || !followUpTitle.trim()) return;
    patchSelected({ followUps: [...selected.followUps, { id: crypto.randomUUID(), title: followUpTitle.trim(), dueDate: followUpDueDate || undefined, completed: false, createdAt: new Date().toISOString() }] }, "Action de suivi créée.");
    setFollowUpTitle(""); setFollowUpDueDate("");
  }

  function handleDeleteMail() {
    if (!selected || !can("mails", "delete")) return;
    const isOutlook = selected.source === "outlook";
    const confirmation = isOutlook
      ? `Retirer « ${selected.subject} » de CommunePilot ?\n\nLe message restera dans Outlook. Les documents déjà ajoutés à un dossier seront conservés.`
      : `Supprimer « ${selected.subject} » de CommunePilot ?\n\nLes documents déjà ajoutés à un dossier seront conservés.`;
    if (!window.confirm(confirmation)) return;
    deleteMail(selected.id);
    setSelectedId(null);
    setSearchParams({});
    setNotice("");
  }

  async function addAttachments(value: { mode: "new" | "existing"; dossierId?: number; title: string; description: string; selections: AttachmentSelection[] }) {
    if (!selected?.externalId || selected.source !== "outlook") return;
    setAddingDocuments(true); setAddError("");
    const now = new Date().toISOString();
    const targetId = value.mode === "new" ? Date.now() : value.dossierId;
    const target = value.mode === "new" ? undefined : dossiers.find((item) => item.id === targetId);
    if (!targetId || (value.mode === "existing" && !target)) { setAddError("Le dossier sélectionné n’existe plus."); setAddingDocuments(false); return; }
    const existingDocuments = target?.documents ?? [];
    const duplicates = value.selections.filter(({ attachmentId }) => existingDocuments.some((document) => document.sourceMailExternalId === selected.externalId && document.attachmentId === attachmentId));
    if (duplicates.length) { setAddError(`${duplicates.length > 1 ? "Ces pièces jointes sont déjà présentes" : "Cette pièce jointe est déjà présente"} dans ce dossier.`); setAddingDocuments(false); return; }
    const storedKeys: string[] = [];
    try {
      const documents: DossierDocument[] = [];
      for (const selection of value.selections) {
        const attachment = selected.attachments.find((item) => item.id === selection.attachmentId);
        if (!attachment) throw new Error("Une pièce jointe sélectionnée n’est plus disponible.");
        const blob = await fetchAttachment(selected.externalId, attachment.id);
        if (!(blob instanceof Blob)) throw new Error(`Microsoft Graph n’a fourni aucun contenu pour « ${attachment.name} ».`);
        const documentId = crypto.randomUUID(); const blobKey = `dossier-${targetId}-${documentId}`;
        await saveDocumentBlob(blobKey, blob); storedKeys.push(blobKey);
        documents.push({ id: documentId, originalName: attachment.name, category: selection.category, mimeType: attachment.mimeType || blob.type || undefined, size: attachment.size ?? blob.size, addedAt: now, source: "mail", sourceMailId: selected.id, sourceMailExternalId: selected.externalId, sourceMailSubject: selected.subject, sourceMailSender: selected.sender, sourceMailSenderEmail: selected.senderEmail, sourceMailReceivedAt: selected.receivedAt, attachmentId: attachment.id, blobKey });
      }
      const dossier: Dossier = target ? { ...target, documents: [...existingDocuments, ...documents], updatedAt: now } : { id: targetId, title: value.title, description: value.description, category: selected.commission || selected.category || "Administratif", manager: "Secrétariat", status: "À traiter", priority: "Normale", deadline: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10), createdAt: now, updatedAt: now, documents };
      const next = target ? dossiers.map((item) => item.id === targetId ? dossier : item) : [dossier, ...dossiers];
      saveDossiers(next); setDossiers(next); patchSelected({ dossierId: targetId }); setAddModalOpen(false);
      if (!target) dossierActivityRepository.add({ dossierId: targetId, type: "dossier", action: "created", label: `Dossier créé depuis le mail « ${selected.subject} »`, authorId: user.id, mailId: selected.id, timestamp: now });
      documents.forEach((document) => dossierActivityRepository.add({ dossierId: targetId, type: "document", action: "added", label: `Document ${document.originalName} ajouté`, authorId: user.id, documentId: document.id, mailId: selected.id, timestamp: now }));
      setNotice(`${documents.length} document${documents.length > 1 ? "s ont" : " a"} été ajouté${documents.length > 1 ? "s" : ""} au dossier « ${dossier.title} ».`);
    } catch (reason) {
      await Promise.allSettled(storedKeys.map(deleteDocumentBlob));
      setAddError(reason instanceof Error ? reason.message : "Les pièces jointes n’ont pas pu être ajoutées.");
    } finally { setAddingDocuments(false); }
  }

  return (
    <section className="mails-page">
      <div className="page-heading"><div><span className="eyebrow">Correspondance municipale</span><h2>Mails</h2><p>Centralisez, qualifiez et suivez les messages de la mairie.</p></div></div>

      <section className={`microsoft-connection ${account ? "connected" : ""}`} aria-label="Connexion Microsoft">
        <div><strong>{account ? "Outlook / Hotmail connecté" : "Mode local"}</strong><span>{account ? account.username : configured ? "Connectez un compte Microsoft pour synchroniser sa boîte de réception." : "Configuration Microsoft absente. Les mails locaux restent disponibles."}</span>{lastSyncedAt && <small>Dernière synchronisation : {formatDate(lastSyncedAt)}</small>}</div>
        <div className="microsoft-actions">
          {account ? <><button className="secondary-button" type="button" disabled={syncing} onClick={() => void sync().catch(() => undefined)}><RefreshCw /> {syncing ? "Synchronisation…" : "Synchroniser"}</button><button className="secondary-button" type="button" disabled={authLoading} onClick={() => void disconnect().catch(() => undefined)}><LogOut /> Déconnecter</button></> : <button className="primary-button" type="button" disabled={!configured || authLoading} onClick={() => void connect().catch(() => undefined)}>{authLoading ? "Connexion…" : "Connecter Outlook/Hotmail"}</button>}
        </div>
        {(authError || syncError) && <p className="mail-error" role="alert">{authError || syncError}</p>}
      </section>

      <div className="mail-statistics">
        <article><Mail /><span>Messages</span><strong>{mails.length}</strong></article>
        <article><Archive /><span>À traiter</span><strong>{mails.filter((mail) => mail.status === "À traiter").length}</strong></article>
        <article><Check /><span>En cours</span><strong>{mails.filter((mail) => mail.status === "En cours").length}</strong></article>
        <article><Paperclip /><span>Pièces jointes</span><strong>{mails.reduce((total, mail) => total + mail.attachments.length, 0)}</strong></article>
      </div>

      <div className="mail-filter-panel">
        <label className="search-bar"><Search size={17} /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Expéditeur, objet ou contenu…" /></label>
        <select aria-label="Statut" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as MailFilters["status"] })}><option>Tous</option>{MAIL_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <select aria-label="Commission" value={filters.commission} onChange={(event) => setFilters({ ...filters, commission: event.target.value })}><option>Toutes</option>{commissionOptions.map((commission) => <option key={commission}>{commission}</option>)}</select>
        <select aria-label="Dossier" value={filters.dossierId} onChange={(event) => setFilters({ ...filters, dossierId: event.target.value === "Tous" || event.target.value === "Sans dossier" ? event.target.value : Number(event.target.value) })}><option>Tous</option><option>Sans dossier</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select>
        <select aria-label="Pièces jointes" value={filters.hasAttachments} onChange={(event) => setFilters({ ...filters, hasAttachments: event.target.value as MailFilters["hasAttachments"] })}><option>Tous</option><option>Avec</option><option>Sans</option></select>
        <label className="date-filter">Du<input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
        <label className="date-filter">Au<input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
        <button className="secondary-button" type="button" onClick={() => setFilters(emptyFilters)}>Réinitialiser</button>
      </div>

      <div className="mail-workspace">
        <div className="mail-list" aria-label={`${filteredMails.length} mails affichés`}>
          {filteredMails.map((mail) => <button type="button" className={`mail-card ${selected?.id === mail.id ? "selected" : ""}`} key={mail.id} onClick={() => chooseMail(mail)}>
            <span className="mail-avatar">{mail.sender.slice(0, 2).toUpperCase()}</span><span className="mail-card-content"><span className="mail-card-heading"><strong>{mail.sender}</strong><time>{formatDate(mail.receivedAt)}</time></span><span className="mail-card-subject">{mail.subject}</span><span className="mail-preview">{mail.preview}</span><span className="mail-meta"><span className={`mail-status ${statusClass(mail.status)}`}>{mail.status}</span>{mail.commission && <span>{mail.commission}</span>}{mail.attachments.length > 0 && <span><Paperclip size={14} /> {mail.attachments.length}</span>}</span></span>
          </button>)}
          {filteredMails.length === 0 && <div className="empty-state"><Mail /><strong>Aucun mail trouvé</strong><span>Modifiez ou réinitialisez les filtres.</span></div>}
          {account && hasMore && <button className="secondary-button load-more-mails" type="button" disabled={syncing} onClick={() => void loadMore().catch(() => undefined)}>{syncing ? "Chargement…" : "Charger plus"}</button>}
        </div>

        <aside className="mail-detail">
          {!selected ? <div className="empty-state"><Mail /><strong>Sélectionnez un mail</strong><span>Son contenu et ses actions apparaîtront ici.</span></div> : <>
            <header><div><span className="eyebrow">Reçu le {formatDate(selected.receivedAt)}</span><h3>{selected.subject}</h3><p>{selected.sender}{selected.senderEmail ? ` · ${selected.senderEmail}` : ""}</p></div><div className="mail-detail-header-actions">{can("mails", "delete") && <button type="button" className="danger-button compact-button" onClick={handleDeleteMail} title={selected.source === "outlook" ? "Retirer de CommunePilot (le message reste dans Outlook)" : "Supprimer ce mail"}><Trash2 /> Supprimer</button>}<button type="button" className="icon-button mail-detail-close" onClick={() => { setSelectedId(null); setSearchParams({}); }} aria-label="Fermer"><X /></button></div></header>
            {notice && <div className="mail-notice" role="status">{notice}</div>}
            <section className="mail-detail-section"><h4>Traitement</h4><div className="mail-fields-grid"><label>Statut<select value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as MailStatus })}>{MAIL_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label>Commission<select value={selected.commission ?? ""} onChange={(event) => patchSelected({ commission: event.target.value || undefined })}><option value="">Non classée</option>{commissionOptions.map((commission) => <option key={commission}>{commission}</option>)}</select></label><label>Catégorie<select value={selected.category ?? ""} onChange={(event) => patchSelected({ category: event.target.value || undefined })}><option value="">Non classée</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Dossier<select value={selected.dossierId ?? ""} onChange={(event) => patchSelected({ dossierId: event.target.value ? Number(event.target.value) : undefined })}><option value="">Aucun dossier</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select></label></div>{selected.attachments.some((item) => !item.isInline) && <button className="primary-button compact-button" type="button" disabled={selected.source !== "outlook" || !selected.externalId || !account} onClick={() => { setAddError(""); setAddModalOpen(true); }}><FilePlus2 /> Ajouter à un dossier</button>}{selected.attachments.length > 0 && (!account || selected.source !== "outlook") && <small>Connectez le compte Outlook source pour récupérer le contenu réel des pièces jointes.</small>}</section>
            <section className="mail-detail-section"><h4>Message</h4><p className="mail-content">{selected.content || selected.preview}</p></section>
            <section className="mail-detail-section"><h4>Résumé opérationnel</h4><textarea rows={3} value={selected.summary ?? ""} placeholder="Résumé court saisi localement…" onChange={(event) => patchSelected({ summary: event.target.value })} /><small>Champ local utilisateur : aucune IA distante n’est simulée.</small><label>Notes internes<textarea rows={4} value={selected.internalNotes ?? ""} placeholder="Notes visibles uniquement dans CommunePilot…" onChange={(event) => patchSelected({ internalNotes: event.target.value })} /></label></section>
            <section className="mail-detail-section"><h4>Pièces jointes ({selected.attachments.length})</h4>{selected.attachments.length ? <ul className="attachment-list">{selected.attachments.map((attachment) => <li key={attachment.id}><Paperclip /><span><strong>{attachment.name}</strong><small>{attachment.mimeType ?? "Type inconnu"}{attachment.size ? ` · ${Math.ceil(attachment.size / 1024)} Ko` : ""}</small></span>{selected.source === "outlook" && selected.externalId && account ? <button className="text-link" type="button" onClick={() => void downloadAttachment(selected.externalId!, attachment.id, attachment.name).catch(() => undefined)}><Download /> Télécharger</button> : attachment.url ? <a href={attachment.url} target="_blank" rel="noreferrer">Ouvrir</a> : <em>Non récupérée</em>}</li>)}</ul> : <p className="muted-copy">Aucune pièce jointe disponible.</p>}</section>
            <section className="mail-detail-section"><h4>Actions de suivi</h4><div className="follow-up-form"><input value={followUpTitle} onChange={(event) => setFollowUpTitle(event.target.value)} placeholder="Action à réaliser…" /><input type="date" value={followUpDueDate} onChange={(event) => setFollowUpDueDate(event.target.value)} /><button className="primary-button" type="button" onClick={createFollowUp} disabled={!followUpTitle.trim()}><CirclePlus /> Ajouter</button></div>{selected.followUps.length ? <ul className="follow-up-list">{selected.followUps.map((followUp) => <li key={followUp.id}><input aria-label={`Terminer ${followUp.title}`} type="checkbox" checked={followUp.completed} onChange={() => patchSelected({ followUps: selected.followUps.map((item) => item.id === followUp.id ? { ...item, completed: !item.completed } : item) })} /><span className={followUp.completed ? "completed" : ""}>{followUp.title}{followUp.dueDate && <small>Échéance : {new Date(`${followUp.dueDate}T12:00:00`).toLocaleDateString("fr-FR")}</small>}</span></li>)}</ul> : <p className="muted-copy">Aucune action de suivi.</p>}</section>
            <footer><span><Link2 />{selected.dossierId ? "Rattaché à un dossier" : "Sans dossier"}</span><span><FolderOpen />Source : {selected.source === "local" ? "données locales" : selected.source}</span></footer>
          </>}
        </aside>
      </div>
      {selected && addModalOpen && <AddAttachmentsToDossierModal mail={selected} dossiers={dossiers} busy={addingDocuments} error={addError} onClose={() => { if (!addingDocuments) { setAddModalOpen(false); setAddError(""); } }} onSubmit={(value) => void addAttachments(value)} />}
    </section>
  );
}
