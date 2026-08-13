import { useEffect, useMemo, useState } from "react";
import type { Dossier, DossierPriority, DossierStatus, DocumentCategory } from "../../dossiers/types/dossier";
import { DOCUMENT_CATEGORIES } from "../../dossiers/types/dossier";
import { DOSSIER_CATEGORIES } from "../../dossiers/dossierCategories";
import type { MunicipalMail } from "../types/mail";

export interface AttachmentSelection { attachmentId: string; category: DocumentCategory }

interface Props {
  mail: MunicipalMail;
  dossiers: Dossier[];
  busy: boolean;
  error: string;
  initialMode: "new" | "existing";
  canCreate: boolean;
  canFetchAttachments: boolean;
  defaultManager: string;
  onClose(): void;
  onSubmit(value: { mode: "new" | "existing"; dossierId?: number; dossier: Omit<Dossier, "id" | "createdAt" | "updatedAt" | "documents">; selections: AttachmentSelection[] }): void;
}

export default function AddAttachmentsToDossierModal({ mail, dossiers, busy, error, initialMode, canCreate, canFetchAttachments, defaultManager, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<"new" | "existing">(initialMode);
  const [dossierId, setDossierId] = useState<number | undefined>(mail.dossierId ?? dossiers[0]?.id);
  const [title, setTitle] = useState(mail.subject);
  const [description, setDescription] = useState(mail.summary || mail.preview || mail.content);
  const [category, setCategory] = useState(mail.commission || mail.category || "");
  const [manager, setManager] = useState(defaultManager);
  const [status, setStatus] = useState<DossierStatus>("À traiter");
  const [priority, setPriority] = useState<DossierPriority>("Normale");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState(() => new Set(canFetchAttachments ? mail.attachments.filter((item) => !item.isInline).map((item) => item.id) : []));
  const [categories, setCategories] = useState<Record<string, DocumentCategory>>({});
  const selectedCount = selectedIds.size;
  const canSubmit = mode === "existing" ? Boolean(dossierId && selectedCount) : Boolean(title.trim() && description.trim() && manager.trim() && deadline);
  const availableAttachments = useMemo(() => mail.attachments.filter((item) => !item.isInline), [mail.attachments]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape" && !busy) onClose(); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  function toggle(id: string) {
    setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  return <div className="modal-backdrop" onMouseDown={() => !busy && onClose()}>
    <div className="modal mail-dossier-modal" role="dialog" aria-modal="true" aria-labelledby="mail-dossier-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-header"><div><span className="eyebrow">Mail → Dossier → Documents</span><h3 id="mail-dossier-title">{mode === "new" ? "Créer un dossier depuis ce mail" : "Ajouter à un dossier"}</h3></div><button className="icon-button" type="button" disabled={busy} onClick={onClose} aria-label="Fermer">×</button></div>
      <div className="mail-dossier-form">
        <fieldset className="destination-choice"><legend>Destination</legend>{canCreate && <label><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> Nouveau dossier</label>}<label><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Dossier existant</label></fieldset>
        {mode === "new" ? <div className="mail-dossier-fields"><label>Intitulé<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Contexte du mail<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} required /></label><div className="mail-fields-grid"><label>Catégorie<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Sans catégorie</option>{DOSSIER_CATEGORIES.map((item) => <option key={item}>{item}</option>)}{category && !DOSSIER_CATEGORIES.includes(category as (typeof DOSSIER_CATEGORIES)[number]) && <option>{category}</option>}</select></label><label>Responsable<input value={manager} onChange={(event) => setManager(event.target.value)} required /></label><label>Statut<select value={status} onChange={(event) => setStatus(event.target.value as DossierStatus)}><option>À traiter</option><option>En cours</option><option>En attente</option><option>Terminé</option></select></label><label>Priorité<select value={priority} onChange={(event) => setPriority(event.target.value as DossierPriority)}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Échéance<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label></div><small>Les informations sont préremplies à partir du mail et restent modifiables.</small></div> : <label>Dossier<select value={dossierId ?? ""} onChange={(event) => setDossierId(event.target.value ? Number(event.target.value) : undefined)}><option value="">Choisir un dossier…</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select></label>}
        {availableAttachments.length ? <fieldset className={`attachment-picker ${canFetchAttachments ? "" : "attachments-unavailable"}`}><legend>Pièces jointes à enregistrer ({selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""})</legend>{!canFetchAttachments && <p className="attachment-availability-note">Ce mail local ne contient que les informations de la pièce jointe, pas son fichier réel. Le dossier sera créé sans document.</p>}{availableAttachments.map((attachment) => <div className="attachment-picker-row" key={attachment.id}><label><input type="checkbox" disabled={!canFetchAttachments} checked={selectedIds.has(attachment.id)} onChange={() => toggle(attachment.id)} /><span><strong>{attachment.name}</strong><small>{attachment.mimeType ?? "Type inconnu"}{attachment.size ? ` · ${Math.ceil(attachment.size / 1024)} Ko` : ""}{!canFetchAttachments && " · Contenu indisponible"}</small></span></label><select aria-label={`Catégorie de ${attachment.name}`} disabled={!canFetchAttachments || !selectedIds.has(attachment.id)} value={categories[attachment.id] ?? "Autre"} onChange={(event) => setCategories({ ...categories, [attachment.id]: event.target.value as DocumentCategory })}>{DOCUMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>)}</fieldset> : <p className="muted-copy">Ce mail ne contient aucune pièce jointe. Le dossier sera créé sans document.</p>}
        {error && <p className="mail-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Annuler</button><button className="primary-button" type="button" disabled={busy || !canSubmit} onClick={() => onSubmit({ mode, dossierId, dossier: { title: title.trim(), description: description.trim(), category, manager: manager.trim(), status, priority, deadline }, selections: [...selectedIds].map((attachmentId) => ({ attachmentId, category: categories[attachmentId] ?? "Autre" })) })}>{busy ? "Récupération et enregistrement…" : mode === "new" ? "Créer et rattacher le dossier" : `Ajouter ${selectedCount} document${selectedCount > 1 ? "s" : ""}`}</button></div>
      </div>
    </div>
  </div>;
}
