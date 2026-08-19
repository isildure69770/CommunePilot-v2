import { useEffect, useRef, useState } from "react";
import { Layers3, MoreVertical, Plus, Route } from "lucide-react";
import { BUSINESS_KIND_LABELS, BUSINESS_LAYER_KINDS, type CustomMapLayer, type CustomMapLayerKind, type CustomMapSection } from "../types/customLayer";

type LayerForm = Pick<CustomMapLayer, "name" | "kind" | "description" | "color" | "active" | "archived"> & { year: number };
type Modal = { mode: "edit" | "duplicate" | "delete"; layer: CustomMapLayer } | null;

interface Props {
  layers: CustomMapLayer[];
  sections: CustomMapSection[];
  drawingLayerId: string | null;
  onAddLayer: (value: { name: string; kind: CustomMapLayerKind; color?: string }) => void;
  onUpdateLayer: (id: string, value: LayerForm) => void;
  onDuplicateLayer: (id: string, options: { name: string; copySections: boolean }) => void;
  onToggleLayer: (id: string) => void;
  onSetLayerArchived: (id: string, archived: boolean) => void;
  onDeleteLayer: (id: string) => boolean;
  onExportLayer: (layer: CustomMapLayer, sections: CustomMapSection[]) => void;
  onStartDrawing: (id: string) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const formFromLayer = (layer: CustomMapLayer, duplicate = false): LayerForm => ({
  name: duplicate ? `${layer.name} — copie` : layer.name,
  kind: layer.kind,
  year: layer.year ?? new Date().getFullYear(),
  description: layer.description,
  color: layer.color,
  active: duplicate ? true : layer.active,
  archived: duplicate ? false : layer.archived,
});

export default function CustomLayerManager(props: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CustomMapLayerKind>("eparage");
  const [color, setColor] = useState("#16a34a");
  const [menuLayerId, setMenuLayerId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [layerForm, setLayerForm] = useState<LayerForm | null>(null);
  const [copySections, setCopySections] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuLayerId) return;
    const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuLayerId(null); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuLayerId(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", closeOnEscape); };
  }, [menuLayerId]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    props.onAddLayer({ name, kind, color });
    setName("");
    setOpen(false);
  }

  function openModal(mode: "edit" | "duplicate" | "delete", layer: CustomMapLayer) {
    setModal({ mode, layer });
    setMenuLayerId(null);
    setCopySections(false);
    setDeleteConfirmation("");
    setLayerForm(mode === "delete" ? null : formFromLayer(layer, mode === "duplicate"));
  }

  function submitLayer(event: React.FormEvent) {
    event.preventDefault();
    if (!modal || !layerForm || !layerForm.name.trim()) return;
    if (modal.mode === "edit") props.onUpdateLayer(modal.layer.id, layerForm);
    if (modal.mode === "duplicate") props.onDuplicateLayer(modal.layer.id, { name: layerForm.name, copySections });
    setModal(null);
  }

  return (
    <section className="custom-layer-manager">
      <header>
        <div><Layers3 size={20} /><div><strong>Mes couches de travaux</strong><small>Éparage, sentiers nettoyés et campagnes annuelles</small></div></div>
        {props.canCreate && <button className="primary-button compact-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}><Plus size={16} /> Créer une couche</button>}
      </header>

      {open && (
        <form className="custom-layer-form" onSubmit={submit}>
          <label>Nom de la couche<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Éparage 2026" autoFocus /></label>
          <label>Type<select value={kind} onChange={(event) => setKind(event.target.value as CustomMapLayerKind)}>{BUSINESS_LAYER_KINDS.map(value => <option key={value} value={value}>{BUSINESS_KIND_LABELS[value]}</option>)}</select></label>
          <label>Couleur<input className="custom-layer-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      )}

      {props.layers.length === 0 ? <p className="custom-layer-empty">Créez une première couche, puis tracez les portions réalisées directement sur la carte.</p> : (
        <div className="custom-layer-list">
          {props.layers.map((layer) => {
            const layerSections = props.sections.filter((section) => section.layerId === layer.id);
            const count = layerSections.length;
            const menuOpen = menuLayerId === layer.id;
            return <article key={layer.id} className={`${props.drawingLayerId === layer.id ? "is-drawing " : ""}${layer.archived ? "is-archived" : ""}`.trim()}>
              <button className="custom-layer-visibility" type="button" role="switch" aria-checked={layer.visible} disabled={layer.archived} onClick={() => props.onToggleLayer(layer.id)}><span style={{ background: layer.color }} /><div><strong>{layer.name}</strong><small>{count} portion{count > 1 ? "s" : ""} enregistrée{count > 1 ? "s" : ""}{layer.archived ? " · Archivée" : ""}</small></div><em>{layer.archived ? "Archivée" : layer.visible ? "Visible" : "Masquée"}</em></button>
              {props.canEdit && !layer.archived && <button className="secondary-button compact-button" type="button" onClick={() => props.onStartDrawing(layer.id)}><Route size={15} /> Tracer une portion</button>}
              <div className="custom-layer-actions" ref={menuOpen ? menuRef : undefined}>
                <button className="icon-button custom-layer-menu-button" type="button" aria-label={`Actions pour ${layer.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuLayerId(menuOpen ? null : layer.id)}><MoreVertical size={20} /></button>
                {menuOpen && <div className="custom-layer-actions-menu" role="menu" aria-label={`Actions pour ${layer.name}`}>
                  {props.canEdit && <button role="menuitem" type="button" onClick={() => openModal("edit", layer)}>Modifier</button>}
                  {props.canCreate && <button role="menuitem" type="button" onClick={() => openModal("duplicate", layer)}>Dupliquer</button>}
                  {props.canEdit && <button role="menuitem" type="button" onClick={() => { if (!layer.archived && !window.confirm(`Archiver « ${layer.name} » ? Les ${count} portion(s) et tout l’historique seront conservés.`)) return; props.onSetLayerArchived(layer.id, !layer.archived); setMenuLayerId(null); }}>{layer.archived ? "Réactiver" : "Archiver"}</button>}
                  <button role="menuitem" type="button" onClick={() => { props.onExportLayer(layer, layerSections); setMenuLayerId(null); }}>Exporter</button>
                  {props.canDelete && <button className="danger" role="menuitem" type="button" onClick={() => openModal("delete", layer)}>Supprimer</button>}
                </div>}
              </div>
            </article>;
          })}
        </div>
      )}

      {modal && modal.mode !== "delete" && layerForm && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="map-layer-modal-title"><div className="modal-header"><h3 id="map-layer-modal-title">{modal.mode === "edit" ? "Modifier la couche" : "Dupliquer la couche"}</h3><button className="icon-button" type="button" aria-label="Fermer" onClick={() => setModal(null)}>×</button></div><form className="field-form" onSubmit={submitLayer}><label>Nom<input required value={layerForm.name} onChange={(event) => setLayerForm({ ...layerForm, name: event.target.value })} /></label><div className="form-row"><label>Type métier<select value={layerForm.kind} onChange={(event) => setLayerForm({ ...layerForm, kind: event.target.value as CustomMapLayerKind })}>{BUSINESS_LAYER_KINDS.map((value) => <option value={value} key={value}>{BUSINESS_KIND_LABELS[value]}</option>)}</select></label><label>Année / campagne<input type="number" value={layerForm.year} onChange={(event) => setLayerForm({ ...layerForm, year: Number(event.target.value) })} /></label></div><label>Description<textarea value={layerForm.description} onChange={(event) => setLayerForm({ ...layerForm, description: event.target.value })} /></label><label>Couleur<input className="custom-layer-color" type="color" value={layerForm.color} onChange={(event) => setLayerForm({ ...layerForm, color: event.target.value })} /></label>{modal.mode === "duplicate" && <label className="copy-sections-option"><input type="checkbox" checked={copySections} onChange={(event) => setCopySections(event.target.checked)} /><span><strong>Copier aussi les {props.sections.filter((section) => section.layerId === modal.layer.id).length} portion(s)</strong><small>Désactivé par défaut. Les copies seront indépendantes et sans lien mission/dossier.</small></span></label>}<div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Annuler</button><button className="primary-button" type="submit">{modal.mode === "edit" ? "Enregistrer" : "Dupliquer"}</button></div></form></div></div>}

      {modal?.mode === "delete" && (() => { const linkedSections = props.sections.filter((section) => section.layerId === modal.layer.id); const missions = new Set(linkedSections.map((section) => section.missionId).filter(Boolean)); const dossiers = new Set(linkedSections.map((section) => section.dossierId).filter(Boolean)); return <div className="modal-backdrop" role="presentation"><div className="modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="map-layer-delete-title"><div className="modal-header"><div><span className="eyebrow">Suppression définitive</span><h3 id="map-layer-delete-title">Supprimer « {modal.layer.name} »</h3></div><button className="icon-button" type="button" aria-label="Fermer" onClick={() => setModal(null)}>×</button></div><div className="delete-impact"><strong>Impact détecté</strong><ul><li>{linkedSections.length} portion(s) supprimée(s)</li><li>{missions.size} mission(s) conservée(s)</li><li>{dossiers.size} dossier(s) conservé(s)</li><li>{modal.layer.history.length} entrée(s) d’historique</li></ul></div><div className="blocking-notice"><strong>Cette action est irréversible.</strong><span>Pour conserver le calque et ses portions, utilisez plutôt « Archiver ».</span></div><label>Pour confirmer, saisissez exactement <strong>{modal.layer.name}</strong><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => props.onExportLayer(modal.layer, linkedSections)}>Exporter</button><button className="secondary-button" type="button" onClick={() => setModal(null)}>Annuler</button><button className="danger-button" type="button" disabled={deleteConfirmation !== modal.layer.name} onClick={() => { if (props.onDeleteLayer(modal.layer.id)) setModal(null); }}>Supprimer le calque et ses portions</button></div></div></div>; })()}
    </section>
  );
}
