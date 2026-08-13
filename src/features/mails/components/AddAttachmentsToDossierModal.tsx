import { useEffect, useMemo, useState } from "react";
import type { Dossier, DocumentCategory } from "../../dossiers/types/dossier";
import { DOCUMENT_CATEGORIES } from "../../dossiers/types/dossier";
import type { MunicipalMail } from "../types/mail";

export interface AttachmentSelection { attachmentId: string; category: DocumentCategory }

interface Props {
  mail: MunicipalMail;
  dossiers: Dossier[];
  busy: boolean;
  error: string;
  onClose(): void;
  onSubmit(value: { mode: "new" | "existing"; dossierId?: number; title: string; description: string; selections: AttachmentSelection[] }): void;
}

export default function AddAttachmentsToDossierModal({ mail, dossiers, busy, error, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [dossierId, setDossierId] = useState<number | undefined>(mail.dossierId ?? dossiers[0]?.id);
  const [title, setTitle] = useState(mail.subject);
  const [description, setDescription] = useState(mail.summary || mail.preview || mail.content);
  const [selectedIds, setSelectedIds] = useState(() => new Set(mail.attachments.filter((item) => !item.isInline).map((item) => item.id)));
  const [categories, setCategories] = useState<Record<string, DocumentCategory>>({});
  const selectedCount = selectedIds.size;
  const canSubmit = selectedCount > 0 && (mode === "existing" ? Boolean(dossierId) : Boolean(title.trim() && description.trim()));
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
      <div className="modal-header"><div><span className="eyebrow">Mail → Dossier → Documents</span><h3 id="mail-dossier-title">Ajouter à un dossier</h3></div><button className="icon-button" type="button" disabled={busy} onClick={onClose} aria-label="Fermer">×</button></div>
      <div className="mail-dossier-form">
        <fieldset className="destination-choice"><legend>Destination</legend><label><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> Nouveau dossier</label><label><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Dossier existant</label></fieldset>
        {mode === "new" ? <div className="mail-dossier-fields"><label>Intitulé<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Contexte du mail<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} required /></label><small>Ces informations préremplissent le nouveau dossier et restent modifiables.</small></div> : <label>Dossier<select value={dossierId ?? ""} onChange={(event) => setDossierId(event.target.value ? Number(event.target.value) : undefined)}><option value="">Choisir un dossier…</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select></label>}
        <fieldset className="attachment-picker"><legend>Pièces jointes ({selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""})</legend>{availableAttachments.map((attachment) => <div className="attachment-picker-row" key={attachment.id}><label><input type="checkbox" checked={selectedIds.has(attachment.id)} onChange={() => toggle(attachment.id)} /><span><strong>{attachment.name}</strong><small>{attachment.mimeType ?? "Type inconnu"}{attachment.size ? ` · ${Math.ceil(attachment.size / 1024)} Ko` : ""}</small></span></label><select aria-label={`Catégorie de ${attachment.name}`} disabled={!selectedIds.has(attachment.id)} value={categories[attachment.id] ?? "Autre"} onChange={(event) => setCategories({ ...categories, [attachment.id]: event.target.value as DocumentCategory })}>{DOCUMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>)}</fieldset>
        {error && <p className="mail-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Annuler</button><button className="primary-button" type="button" disabled={busy || !canSubmit} onClick={() => onSubmit({ mode, dossierId, title: title.trim(), description: description.trim(), selections: [...selectedIds].map((attachmentId) => ({ attachmentId, category: categories[attachmentId] ?? "Autre" })) })}>{busy ? "Récupération et enregistrement…" : `Ajouter ${selectedCount} document${selectedCount > 1 ? "s" : ""}`}</button></div>
      </div>
    </div>
  </div>;
}
