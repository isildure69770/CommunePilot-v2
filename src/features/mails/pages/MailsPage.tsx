import { useEffect, useMemo, useState } from "react";
import { Archive, Check, CirclePlus, FilePlus2, FolderOpen, Link2, Mail, Paperclip, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { initialDossiers } from "../../dossiers/data/dossiers";
import { loadDossiers, saveDossiers } from "../../dossiers/services/dossierStorage";
import type { Dossier } from "../../dossiers/types/dossier";
import { useMails } from "../hooks/useMails";
import { MAIL_STATUSES, type MailFilters, type MailStatus, type MunicipalMail } from "../types/mail";

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
  const { mails, updateMail } = useMails();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<MailFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(searchParams.get("mail")) || null);
  const [dossiers, setDossiers] = useState<Dossier[]>(() => loadDossiers() ?? initialDossiers);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");
  const [notice, setNotice] = useState("");

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
    updateMail(selected.id, changes);
    if (message) setNotice(message);
  }

  function createFollowUp() {
    if (!selected || !followUpTitle.trim()) return;
    patchSelected({ followUps: [...selected.followUps, { id: crypto.randomUUID(), title: followUpTitle.trim(), dueDate: followUpDueDate || undefined, completed: false, createdAt: new Date().toISOString() }] }, "Action de suivi créée.");
    setFollowUpTitle(""); setFollowUpDueDate("");
  }

  function createDossier() {
    if (!selected) return;
    const now = new Date().toISOString();
    const dossier: Dossier = { id: Date.now(), title: selected.subject, description: selected.summary || selected.preview || selected.content, category: selected.commission || selected.category || "Administratif", manager: "Secrétariat", status: "À traiter", priority: "Normale", deadline: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10), createdAt: now, updatedAt: now };
    const next = [dossier, ...dossiers];
    saveDossiers(next); setDossiers(next); patchSelected({ dossierId: dossier.id }, "Dossier créé et rattaché au mail.");
  }

  return (
    <section className="mails-page">
      <div className="page-heading"><div><span className="eyebrow">Correspondance municipale</span><h2>Mails</h2><p>Centralisez, qualifiez et suivez les messages de la mairie.</p></div><button className="secondary-button" type="button" disabled title="La connexion Gmail/Outlook sera ajoutée via un connecteur sécurisé">Connexion Gmail / Outlook à venir</button></div>

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
        </div>

        <aside className="mail-detail">
          {!selected ? <div className="empty-state"><Mail /><strong>Sélectionnez un mail</strong><span>Son contenu et ses actions apparaîtront ici.</span></div> : <>
            <header><div><span className="eyebrow">Reçu le {formatDate(selected.receivedAt)}</span><h3>{selected.subject}</h3><p>{selected.sender}{selected.senderEmail ? ` · ${selected.senderEmail}` : ""}</p></div><button type="button" className="icon-button mail-detail-close" onClick={() => { setSelectedId(null); setSearchParams({}); }} aria-label="Fermer"><X /></button></header>
            {notice && <div className="mail-notice" role="status">{notice}</div>}
            <section className="mail-detail-section"><h4>Traitement</h4><div className="mail-fields-grid"><label>Statut<select value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as MailStatus })}>{MAIL_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label>Commission<select value={selected.commission ?? ""} onChange={(event) => patchSelected({ commission: event.target.value || undefined })}><option value="">Non classée</option>{commissionOptions.map((commission) => <option key={commission}>{commission}</option>)}</select></label><label>Catégorie<select value={selected.category ?? ""} onChange={(event) => patchSelected({ category: event.target.value || undefined })}><option value="">Non classée</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Dossier<select value={selected.dossierId ?? ""} onChange={(event) => patchSelected({ dossierId: event.target.value ? Number(event.target.value) : undefined })}><option value="">Aucun dossier</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select></label></div><button className="secondary-button compact-button" type="button" onClick={createDossier}><FilePlus2 /> Créer un dossier depuis ce mail</button></section>
            <section className="mail-detail-section"><h4>Message</h4><p className="mail-content">{selected.content || selected.preview}</p></section>
            <section className="mail-detail-section"><h4>Résumé opérationnel</h4><textarea rows={3} value={selected.summary ?? ""} placeholder="Résumé court saisi localement…" onChange={(event) => patchSelected({ summary: event.target.value })} /><small>Champ local utilisateur : aucune IA distante n’est simulée.</small><label>Notes internes<textarea rows={4} value={selected.internalNotes ?? ""} placeholder="Notes visibles uniquement dans CommunePilot…" onChange={(event) => patchSelected({ internalNotes: event.target.value })} /></label></section>
            <section className="mail-detail-section"><h4>Pièces jointes ({selected.attachments.length})</h4>{selected.attachments.length ? <ul className="attachment-list">{selected.attachments.map((attachment) => <li key={attachment.id}><Paperclip /><span><strong>{attachment.name}</strong><small>{attachment.mimeType ?? "Type inconnu"}{attachment.size ? ` · ${Math.ceil(attachment.size / 1024)} Ko` : ""}</small></span>{attachment.url ? <a href={attachment.url} target="_blank" rel="noreferrer">Ouvrir</a> : <em>Non récupérée</em>}</li>)}</ul> : <p className="muted-copy">Aucune pièce jointe disponible dans les données locales.</p>}</section>
            <section className="mail-detail-section"><h4>Actions de suivi</h4><div className="follow-up-form"><input value={followUpTitle} onChange={(event) => setFollowUpTitle(event.target.value)} placeholder="Action à réaliser…" /><input type="date" value={followUpDueDate} onChange={(event) => setFollowUpDueDate(event.target.value)} /><button className="primary-button" type="button" onClick={createFollowUp} disabled={!followUpTitle.trim()}><CirclePlus /> Ajouter</button></div>{selected.followUps.length ? <ul className="follow-up-list">{selected.followUps.map((followUp) => <li key={followUp.id}><input aria-label={`Terminer ${followUp.title}`} type="checkbox" checked={followUp.completed} onChange={() => patchSelected({ followUps: selected.followUps.map((item) => item.id === followUp.id ? { ...item, completed: !item.completed } : item) })} /><span className={followUp.completed ? "completed" : ""}>{followUp.title}{followUp.dueDate && <small>Échéance : {new Date(`${followUp.dueDate}T12:00:00`).toLocaleDateString("fr-FR")}</small>}</span></li>)}</ul> : <p className="muted-copy">Aucune action de suivi.</p>}</section>
            <footer><span><Link2 />{selected.dossierId ? "Rattaché à un dossier" : "Sans dossier"}</span><span><FolderOpen />Source : {selected.source === "local" ? "données locales" : selected.source}</span></footer>
          </>}
        </aside>
      </div>
    </section>
  );
}
