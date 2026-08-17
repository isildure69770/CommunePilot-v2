import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Archive, ClipboardList, MapPin, Plus, RotateCcw } from "lucide-react";
import { useIdentity } from "../access/LocalIdentityProvider";
import { loadDossiers } from "../dossiers/services/dossierStorage";
import { initialDossiers } from "../dossiers/data/dossiers";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { Mission, MissionPriority, MissionStatus } from "./types";
import { useFieldData } from "./useFieldData";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";

const empty = { title: "", description: "", address: "", priority: "Normale" as MissionPriority, status: "À faire" as MissionStatus, dueDate: "", category: "Voirie", dossierId: "", assigneeIds: ["u-tech"] as string[], attachments: [] as Mission["attachments"] };

export default function MissionsPage() {
  const [params] = useSearchParams();
  const commission = params.get("commission") ?? "";
  const { user, users, can } = useIdentity();
  const { missions, saveMissions, notify } = useFieldData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => ({ ...empty, category: commission || empty.category }));
  const dossiers = loadDossiers() ?? initialDossiers;
  const agents = users.filter((candidate) => candidate.active && candidate.role === "Agent technique");
  const visibleMissions = user.role === "Agent technique" ? missions.filter((mission) => mission.assigneeIds.includes(user.id)) : missions;
  const activeMissions = visibleMissions.filter((mission) => !mission.archivedAt);
  const archivedMissions = visibleMissions.filter((mission) => Boolean(mission.archivedAt));
  const canArchive = ["Maire", "Adjoint"].includes(user.role) && can("missions", "update");

  useEffect(() => {
    if (commission) setForm((current) => ({ ...current, category: commission }));
    if (params.get("new") === "1") setOpen(true);
  }, [commission, params]);

  function setArchived(mission: Mission, archived: boolean) {
    const now = new Date().toISOString();
    saveMissions(missions.map((item) => item.id === mission.id ? { ...item, archivedAt: archived ? now : undefined, updatedAt: now, history: [...item.history, { id: makeId("history"), at: now, userId: user.id, label: archived ? "Mission archivée" : "Mission restaurée des archives" }] } : item));
  }

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { window.alert("Renseignez le titre et la consigne."); return; }
    if (!form.assigneeIds.length) { window.alert("Choisissez au moins un agent technique avant d’enregistrer."); return; }
    const now = new Date().toISOString();
    const mission: Mission = { ...form, title: form.title.trim(), description: form.description.trim(), id: makeId("mission"), dossierId: form.dossierId ? Number(form.dossierId) : undefined, createdAt: now, updatedAt: now, reports: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée" }] };
    try {
      saveMissions([mission, ...missions]);
      if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: "created", label: `${user.firstName} a créé la mission ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
      notify({ userIds: mission.assigneeIds, title: "Nouvelle mission", message: mission.title, link: "/terrain" });
      setForm(empty); setOpen(false);
    } catch { window.alert("Impossible d’enregistrer : le stockage local du navigateur est probablement plein. Retirez les pièces jointes volumineuses puis réessayez."); }
  }

  const missionCard = (mission: Mission, archived = false) => <article className={`mission-card${archived ? " is-archived" : ""}`} key={mission.id}>
    <header><span className={`priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span><span>{archived ? "Archivée" : mission.status}</span></header>
    <h3>{mission.title}</h3><p>{mission.description}</p>
    <div className="mission-meta"><span><MapPin size={15}/>{mission.address || "Adresse à préciser"}</span><span>Échéance : {mission.dueDate || "non définie"}</span><span>Agents : {mission.assigneeIds.map((id) => users.find((candidate) => candidate.id === id)?.firstName).filter(Boolean).join(", ") || "non affecté"}</span>{mission.dossierId && <span>Dossier #{mission.dossierId}</span>}</div>
    {mission.attachments.length > 0 && <div className="alert-photos">{mission.attachments.map((file) => file.kind === "photo" ? <a href={file.dataUrl} target="_blank" rel="noreferrer" key={file.id}><img src={file.thumbnailDataUrl || file.dataUrl} alt={file.name}/></a> : <a href={file.dataUrl} target="_blank" rel="noreferrer" key={file.id}>{file.name}</a>)}</div>}
    {mission.reports.map((report, index) => <div className="report-card" key={`${report.completedAt}-${index}`}><strong>Compte rendu — {new Date(report.completedAt).toLocaleString("fr-FR")}</strong><p>{report.comment || "Aucune remarque"}</p><span>{report.outcome === "terminée" ? "Intervention terminée" : "Nouvelle intervention nécessaire"} · {report.photos.length} photo(s)</span>{report.photos.length > 0 && <div className="alert-photos">{report.photos.map((photo) => <a href={photo.dataUrl} target="_blank" rel="noreferrer" key={photo.id}><img src={photo.thumbnailDataUrl || photo.dataUrl} alt={photo.name}/></a>)}</div>}</div>)}
    {canArchive && mission.status === "Terminée" && !archived && <button className="mission-archive-button" type="button" onClick={() => setArchived(mission, true)}><Archive/>Archiver la mission</button>}
    {canArchive && archived && <button className="mission-restore-button" type="button" onClick={() => setArchived(mission, false)}><RotateCcw/>Restaurer la mission</button>}
  </article>;

  return <section>
    <div className="page-heading"><div><span className="eyebrow">Services techniques</span><h2>Missions</h2><p>Planifiez les interventions et consultez les comptes rendus terrain.</p></div>{user.role !== "Agent technique" && can("missions", "create") && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={18}/> Nouvelle mission</button>}</div>
    <div className="mission-grid">{activeMissions.map((mission) => missionCard(mission))}{activeMissions.length === 0 && <div className="empty-state"><ClipboardList/><strong>Aucune mission active</strong><span>Les missions archivées restent disponibles ci-dessous.</span></div>}</div>
    {archivedMissions.length > 0 && <details className="mission-archives"><summary><Archive/>Archives ({archivedMissions.length})</summary><div className="mission-grid">{archivedMissions.map((mission) => missionCard(mission, true))}</div></details>}
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><div className="modal mission-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Planification</span><h3>Créer une mission</h3></div><button className="icon-button" onClick={() => setOpen(false)}>×</button></div><form className="field-form" onSubmit={create}><label>Titre<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label><label>Consigne<textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label><label>Adresse<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })}/></label><div className="form-row"><label>Priorité<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as MissionPriority })}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Échéance<input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })}/></label></div><label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label><fieldset><legend>Agents techniques</legend>{agents.map((agent) => <label className="toggle-row" key={agent.id}><input type="checkbox" checked={form.assigneeIds.includes(agent.id)} onChange={(event) => setForm({ ...form, assigneeIds: event.target.checked ? [...form.assigneeIds, agent.id] : form.assigneeIds.filter((id) => id !== agent.id) })}/>{agent.firstName} {agent.lastName}</label>)}</fieldset><label>Dossier lié<select value={form.dossierId} onChange={(event) => setForm({ ...form, dossierId: event.target.value })}><option value="">Aucun</option>{dossiers.map((dossier) => <option value={dossier.id} key={dossier.id}>{dossier.title}</option>)}</select></label><label>Photos et documents<input type="file" multiple onChange={async (event) => setForm({ ...form, attachments: [...form.attachments, ...await filesToAttachments(event.target.files, "document")] })}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Annuler</button><button className="primary-button" disabled={!form.assigneeIds.length}>Créer et notifier</button></div></form></div></div>}
  </section>;
}
