import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Archive, ClipboardList, MapPin, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { useIdentity } from "../access/LocalIdentityProvider";
import type { CommuneUser } from "../access/types";
import { loadDossiers } from "../dossiers/services/dossierStorage";
import { initialDossiers } from "../dossiers/data/dossiers";
import type { Dossier } from "../dossiers/types/dossier";
import MapClickSelector from "../map/components/MapClickSelector";
import { searchAddresses, type AddressSuggestion } from "../map/services/addressSearch";
import { reverseGeocode } from "../map/services/reverseGeocoding";
import { isInMontrottier } from "../map/services/montrottier";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { Mission, MissionPriority, MissionStatus } from "./types";
import { useFieldData } from "./useFieldData";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";
import MissionFlowCard, { missionCompletion, missionPhotos } from "./MissionFlowCard";

const DEFAULT_LATITUDE = 45.790833;
const DEFAULT_LONGITUDE = 4.4675;
type MissionFormValue = Omit<Mission, "id" | "createdAt" | "updatedAt" | "reports" | "history" | "problems" | "archivedAt">;
const blankMission = (assigneeIds: string[], category = "Voirie"): MissionFormValue => ({ title: "", description: "", address: "", latitude: undefined, longitude: undefined, priority: "Normale", status: "À faire", dueDate: "", category, dossierId: undefined, assigneeIds, attachments: [] });

export default function MissionsPage() {
  const [params] = useSearchParams();
  const commission = params.get("commission") ?? "";
  const { user, users, can } = useIdentity();
  const { missions, saveMissions, notify } = useFieldData();
  const [editing, setEditing] = useState<Mission | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState<"Actives" | "Terminées" | "Toutes">("Actives");
  const [selectedMissionId, setSelectedMissionId] = useState<string>();
  const dossiers = loadDossiers() ?? initialDossiers;
  const agents = useMemo(() => users.filter((candidate) => candidate.active && candidate.role === "Agent technique"), [users]);
  const visibleMissions = user.role === "Agent technique" ? missions.filter((mission) => mission.assigneeIds.includes(user.id)) : missions;
  const activeMissions = visibleMissions.filter((mission) => !mission.archivedAt);
  const archivedMissions = visibleMissions.filter((mission) => Boolean(mission.archivedAt));
  const canArchive = ["Maire", "Adjoint"].includes(user.role) && can("missions", "update");
  const agentActiveMissions = missions.filter((mission) => mission.assigneeIds.includes(user.id) && !mission.archivedAt && mission.status !== "Terminée" && mission.status !== "Annulée");
  const sharedCompletedMissions = missions.filter((mission) => mission.status === "Terminée" && !mission.archivedAt);
  const agentFlowMissions = agentFilter === "Actives" ? agentActiveMissions : agentFilter === "Terminées" ? sharedCompletedMissions : [...agentActiveMissions, ...sharedCompletedMissions];
  const selectedMission = missions.find((mission) => mission.id === selectedMissionId);

  useEffect(() => { if (params.get("new") === "1") { setEditing(null); setFormOpen(true); } }, [params]);
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  function setArchived(mission: Mission, archived: boolean) {
    const now = new Date().toISOString();
    saveMissions(missions.map((item) => item.id === mission.id ? { ...item, archivedAt: archived ? now : undefined, updatedAt: now, history: [...item.history, { id: makeId("history"), at: now, userId: user.id, label: archived ? "Mission archivée" : "Mission restaurée des archives" }] } : item));
  }

  async function save(value: MissionFormValue) {
    const now = new Date().toISOString();
    try {
      if (editing) {
        const updated: Mission = { ...editing, ...value, updatedAt: now, history: [...editing.history, { id: makeId("history"), at: now, userId: user.id, label: "Mission modifiée" }] };
        await saveMissions(missions.map((item) => item.id === editing.id ? updated : item));
        if (updated.dossierId) dossierActivityRepository.add({ dossierId: updated.dossierId, type: "mission", action: "updated", label: `${user.firstName} a modifié la mission ${updated.title}`, authorId: user.id, missionId: updated.id, timestamp: now });
      } else {
        const mission: Mission = { ...value, id: makeId("mission"), createdAt: now, updatedAt: now, reports: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée" }] };
        await saveMissions([mission, ...missions]);
        if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: "created", label: `${user.firstName} a créé la mission ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
        notify({ userIds: mission.assigneeIds, title: "Nouvelle mission", message: mission.title, link: "/terrain" });
      }
      closeForm();
    } catch (error) { throw error instanceof Error ? error : new Error("La mission n’a pas pu être enregistrée. Réessayez dans quelques instants."); }
  }

  const missionCard = (mission: Mission, archived = false) => <article className={`mission-card terrain-inspired-card${archived ? " is-archived" : ""}`} key={mission.id}>
    <header><span className={`priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span><span className="mission-status">{archived ? "Archivée" : mission.status}</span></header>
    <h3>{mission.title}</h3><p>{mission.description}</p>
    <div className="mission-meta"><span><MapPin size={15}/>{mission.address || "Adresse à préciser"}</span><span>Échéance : {mission.dueDate ? new Date(mission.dueDate).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "non définie"}</span><span>Agents : {mission.assigneeIds.map((id) => users.find((candidate) => candidate.id === id)?.firstName).filter(Boolean).join(", ") || "non affecté"}</span>{mission.dossierId && <span>Dossier #{mission.dossierId}</span>}</div>
    {mission.attachments.length > 0 && <div className="alert-photos">{mission.attachments.map((file) => file.kind === "photo" ? <a href={file.dataUrl} target="_blank" rel="noreferrer" key={file.id}><img src={file.thumbnailDataUrl || file.dataUrl} alt={file.name}/></a> : <a href={file.dataUrl} target="_blank" rel="noreferrer" key={file.id}>{file.name}</a>)}</div>}
    {mission.reports.map((report, index) => <div className="report-card" key={`${report.completedAt}-${index}`}><strong>Compte rendu — {new Date(report.completedAt).toLocaleString("fr-FR")}</strong><p>{report.comment || "Aucune remarque"}</p><span>{report.outcome === "terminée" ? "Intervention terminée" : "Nouvelle intervention nécessaire"} · {report.photos.length} photo(s)</span></div>)}
    <div className="mission-card-actions">{can("missions", "update") && !archived && <button className="secondary-button" type="button" onClick={() => { setEditing(mission); setFormOpen(true); }}><Pencil/>Modifier</button>}{canArchive && mission.status === "Terminée" && !archived && <button className="mission-archive-button" type="button" onClick={() => setArchived(mission, true)}><Archive/>Archiver</button>}{canArchive && archived && <button className="mission-restore-button" type="button" onClick={() => setArchived(mission, false)}><RotateCcw/>Restaurer</button>}</div>
  </article>;

  if (user.role === "Agent technique") return <section className="missions-page agent-missions-page">
    <div className="page-heading"><div><span className="eyebrow">Terrain</span><h2>Mes missions</h2><p>Vos missions actives et l’historique partagé de l’équipe technique.</p></div></div>
    <nav className="mission-flow-filters" aria-label="Filtrer les missions">{(["Actives", "Terminées", "Toutes"] as const).map((filter) => <button type="button" className={agentFilter === filter ? "active" : ""} onClick={() => setAgentFilter(filter)} key={filter}>{filter}<strong>{filter === "Actives" ? agentActiveMissions.length : filter === "Terminées" ? sharedCompletedMissions.length : agentActiveMissions.length + sharedCompletedMissions.length}</strong></button>)}</nav>
    <div className="mission-flow-list">{agentFlowMissions.map((mission) => <MissionFlowCard key={mission.id} mission={mission} users={users} sharedCompletion={mission.status === "Terminée" && !mission.assigneeIds.includes(user.id)} onOpen={() => setSelectedMissionId(mission.id)}/>)}{agentFlowMissions.length === 0 && <div className="empty-state"><ClipboardList/><strong>Aucune mission</strong><span>Aucune mission ne correspond à ce filtre.</span></div>}</div>
    {selectedMission && <AgentMissionSummary mission={selectedMission} users={users} onClose={() => setSelectedMissionId(undefined)}/>}
  </section>;

  return <section className="missions-page">
    <div className="page-heading"><div><span className="eyebrow">Services techniques</span><h2>Missions</h2><p>Planifiez les interventions et consultez les comptes rendus terrain.</p></div>{can("missions", "create") && <button className="primary-button" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={18}/> Nouvelle mission</button>}</div>
    <div className="mission-grid">{activeMissions.map((mission) => missionCard(mission))}{activeMissions.length === 0 && <div className="empty-state"><ClipboardList/><strong>Aucune mission active</strong><span>Les missions archivées restent disponibles ci-dessous.</span></div>}</div>
    {archivedMissions.length > 0 && <details className="mission-archives"><summary><Archive/>Archives ({archivedMissions.length})</summary><div className="mission-grid">{archivedMissions.map((mission) => missionCard(mission, true))}</div></details>}
    {formOpen && <MissionForm mission={editing} users={agents} dossiers={dossiers} initialCategory={commission || "Voirie"} defaultAssigneeIds={agents.map((agent) => agent.id)} onClose={closeForm} onSubmit={save}/>}
  </section>;
}

function AgentMissionSummary({ mission, users, onClose }: { mission: Mission; users: CommuneUser[]; onClose(): void }) {
  const photos = missionPhotos(mission);
  const completion = mission.status === "Terminée" ? missionCompletion(mission, users) : undefined;
  return <div className="modal-backdrop mission-summary-backdrop" onMouseDown={onClose}><div className="modal mission-sheet" role="dialog" aria-modal="true" aria-label={mission.title} onMouseDown={(event) => event.stopPropagation()}><div className="mission-sheet-header"><button className="mission-back-button" type="button" onClick={onClose}>← Retour aux missions</button><span className={`mission-flow-priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span></div><div className="mission-details"><h3>{mission.title}</h3>{mission.status === "Terminée" && <span className="mission-completed-stamp is-detail">TERMINÉE</span>}{photos.length > 0 && <a className="mission-detail-photo" href={photos[0].dataUrl} target="_blank" rel="noreferrer"><img src={photos[0].dataUrl || photos[0].thumbnailDataUrl} alt={photos[0].name}/><span>Agrandir la photo</span></a>}<p className="mission-detail-address"><MapPin/>{mission.address || "Lieu à préciser"}</p><p>{mission.description || "Aucune consigne complémentaire."}</p>{completion && <p className="mission-detail-completion">Terminée par <strong>{completion.agentName}</strong> le {new Date(completion.completedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>}<dl><div><dt>Statut</dt><dd>{mission.status}</dd></div><div><dt>Catégorie</dt><dd>{mission.category}</dd></div><div><dt>Agents affectés</dt><dd>{mission.assigneeIds.map((id) => users.find((candidate) => candidate.id === id)?.firstName).filter(Boolean).join(", ")}</dd></div><div><dt>Priorité</dt><dd>{mission.priority}</dd></div></dl>{mission.reports.map((report, index) => <div className="report-card" key={`${report.completedAt}-${index}`}><strong>Compte rendu — {new Date(report.completedAt).toLocaleString("fr-FR")}</strong><p>{report.comment || "Aucune remarque"}</p></div>)}</div></div></div>;
}

function MissionForm({ mission, users, dossiers, initialCategory, defaultAssigneeIds, onClose, onSubmit }: { mission: Mission | null; users: CommuneUser[]; dossiers: Dossier[]; initialCategory: string; defaultAssigneeIds: string[]; onClose(): void; onSubmit(value: MissionFormValue): Promise<void> }) {
  const [form, setForm] = useState<MissionFormValue>(() => mission ? { ...mission } : blankMission(defaultAssigneeIds, initialCategory));
  const [mapOpen, setMapOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressStatus, setAddressStatus] = useState("");
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const mapSelectionRequest = useRef(0);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);
  useEffect(() => {
    if (!addressFocused || form.address.trim().length < 3) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => setSuggestions(await searchAddresses(form.address, controller.signal)), 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [form.address, addressFocused]);
  const update = <K extends keyof MissionFormValue>(key: K, value: MissionFormValue[K]) => setForm((current) => ({ ...current, [key]: value }));
  const selectSuggestion = (suggestion: AddressSuggestion) => { mapSelectionRequest.current += 1; setForm((current) => ({ ...current, address: suggestion.label, latitude: suggestion.latitude, longitude: suggestion.longitude })); setSuggestions([]); setAddressFocused(false); setMapOpen(true); setAddressStatus("Adresse et point cartographique enregistrés."); };
  const selectOnMap = async (latitude: number, longitude: number) => {
    const request = ++mapSelectionRequest.current;
    setAddressStatus("Vérification de l’emplacement…");
    const inside = await isInMontrottier(latitude, longitude);
    if (request !== mapSelectionRequest.current) return;
    if (inside === false) { setAddressStatus("Emplacement refusé : les missions doivent être localisées à Montrottier. La dernière sélection valide est conservée."); return; }
    const result = await reverseGeocode(latitude, longitude);
    if (request !== mapSelectionRequest.current) return;
    if ((result && !result.isMontrottier) || (inside === null && !result?.isMontrottier)) { setAddressStatus("Emplacement non vérifiable : choisissez un point situé à Montrottier. La dernière sélection valide est conservée."); return; }
    const address = result?.displayName.trim() || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Montrottier`;
    setForm((current) => ({ ...current, latitude, longitude, address }));
    setAddressStatus(result ? "Adresse détectée automatiquement." : "Point enregistré à Montrottier ; adresse exacte introuvable.");
  };
  const addFiles = async (files: FileList | null) => { setFileError(""); try { const attachments = await filesToAttachments(files, "auto"); update("attachments", [...form.attachments, ...attachments]); } catch (error) { setFileError(error instanceof Error ? error.message : "La photo n’a pas pu être préparée."); } };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!form.assigneeIds.length) { setSaveError("Choisissez au moins un agent technique avant d’enregistrer."); return; } setSaveError(""); setSaving(true); try { await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), address: form.address.trim() }); } catch (error) { setSaveError(error instanceof Error ? error.message : "La mission n’a pas pu être enregistrée. Les champs saisis sont conservés."); } finally { setSaving(false); } };
  return <div className="modal-backdrop mission-modal-backdrop" onMouseDown={onClose}><div className="modal mission-modal calendar-event-modal" role="dialog" aria-modal="true" aria-label={mission ? "Modifier la mission" : "Créer une mission"} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Planification terrain</span><h3>{mission ? "Modifier la mission" : "Nouvelle mission"}</h3></div><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer"><X/></button></div><form className="calendar-event-form mission-event-form" onSubmit={submit}>
    <label className="form-wide">Titre<input autoFocus required value={form.title} onChange={(event) => update("title", event.target.value)}/></label>
    <label className="form-wide">Consigne<textarea required rows={3} value={form.description} onChange={(event) => update("description", event.target.value)}/></label>
    <div className="form-wide mission-address-field"><label>Adresse<input value={form.address} autoComplete="off" onFocus={() => setAddressFocused(true)} onBlur={() => window.setTimeout(() => setAddressFocused(false), 150)} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value, latitude: undefined, longitude: undefined }))} placeholder="N° et voie à Montrottier…"/></label>{addressFocused && form.address.trim().length < 3 && <small className="address-help">Saisissez au moins 3 caractères. Seules les adresses de Montrottier sont proposées.</small>}{suggestions.length > 0 && <div className="address-suggestions" role="listbox">{suggestions.map((suggestion) => <button type="button" role="option" key={suggestion.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(suggestion)}><MapPin/><span>{suggestion.label}</span></button>)}</div>}<button className="secondary-button map-select-button" type="button" onClick={() => setMapOpen((current) => !current)}><MapPin/>{mapOpen ? "Masquer la carte" : "Sélectionner sur la carte"}</button>{addressStatus && <small className={`address-status${addressStatus.includes("refusé") || addressStatus.includes("non vérifiable") ? " is-error" : ""}`} role="status">{addressStatus}</small>}</div>
    {mapOpen && <div className="form-wide mission-map"><MapClickSelector latitude={form.latitude ?? DEFAULT_LATITUDE} longitude={form.longitude ?? DEFAULT_LONGITUDE} title={form.title || "Emplacement de la mission"} height={320} onChange={(latitude, longitude) => void selectOnMap(latitude, longitude)}/></div>}
    <label>Priorité<select value={form.priority} onChange={(event) => update("priority", event.target.value as MissionPriority)}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label>
    <label>Statut<select value={form.status} onChange={(event) => update("status", event.target.value as MissionStatus)}><option>À faire</option><option>Prise en compte</option><option>En cours</option><option>Terminée</option><option>Annulée</option></select></label>
    <label>Échéance<input type="datetime-local" value={form.dueDate.slice(0, 16)} onChange={(event) => update("dueDate", event.target.value)}/></label>
    <label>Catégorie<select value={form.category} onChange={(event) => update("category", event.target.value)}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label>
    <fieldset className="form-wide"><legend>Agents techniques</legend><div className="calendar-participants">{users.map((agent) => <label className="toggle-row" key={agent.id}><input type="checkbox" checked={form.assigneeIds.includes(agent.id)} onChange={(event) => update("assigneeIds", event.target.checked ? [...form.assigneeIds, agent.id] : form.assigneeIds.filter((id) => id !== agent.id))}/>{agent.firstName} {agent.lastName}</label>)}</div></fieldset>
    <label>Dossier lié<select value={form.dossierId ?? ""} onChange={(event) => update("dossierId", event.target.value ? Number(event.target.value) : undefined)}><option value="">Aucun</option>{dossiers.map((dossier) => <option value={dossier.id} key={dossier.id}>{dossier.title}</option>)}</select></label>
    <label>Photos et documents<input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={(event) => void addFiles(event.target.files)}/>{fileError && <small className="field-error" role="alert">{fileError}</small>}</label>
    {form.attachments.length > 0 && <div className="form-wide alert-photos">{form.attachments.map((file) => file.kind === "photo" ? <img key={file.id} src={file.thumbnailDataUrl || file.dataUrl} alt={file.name}/> : <span key={file.id}>{file.name}</span>)}</div>}
    {saveError && <p className="form-wide alert-send-error" role="alert">{saveError} Les champs saisis sont conservés.</p>}
    <div className="modal-actions form-wide"><button type="button" className="secondary-button" onClick={onClose}>Annuler</button><button className="primary-button" disabled={!form.assigneeIds.length || saving}>{saving ? "Envoi en cours…" : mission ? "Enregistrer les modifications" : "Créer et notifier"}</button></div>
  </form></div></div>;
}
