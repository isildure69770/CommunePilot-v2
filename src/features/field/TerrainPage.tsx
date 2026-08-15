import { useEffect, useState } from "react";
import { AlertTriangle, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, Flag, Info, MapPin, Navigation, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useIdentity } from "../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { FieldAlert, FileAttachment, Mission } from "./types";
import { useFieldData } from "./useFieldData";

const tabs = ["Toutes", "À faire", "Prise en compte", "En cours", "Terminée"] as const;

export default function TerrainPage() {
  const { user, users } = useIdentity();
  const { missions, alerts, saveMissions, saveAlerts, notify } = useFieldData();
  const mine = missions.filter((item) => item.assigneeIds.includes(user.id) && item.status !== "Annulée" && !item.archivedAt);
  const recent = mine.filter((item) => item.status === "Terminée").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Toutes");
  const displayed = tab === "Toutes" ? mine : mine.filter((item) => item.status === tab);
  const [detailsId, setDetailsId] = useState<string>();
  const [reportId, setReportId] = useState<string>();
  const [problemId, setProblemId] = useState<string>();
  const [gallery, setGallery] = useState<{ photos: FileAttachment[]; index: number }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const managers = users.filter((candidate) => ["Maire", "Adjoint", "Agent administratif"].includes(candidate.role)).map((candidate) => candidate.id);
  const replace = (next: Mission) => saveMissions(missions.map((item) => item.id === next.id ? next : item));
  const informManagers = (title: string, message: string, link = "/missions") => notify({ userIds: managers, title, message, link });

  function transition(mission: Mission, status: Mission["status"], label: string) {
    const now = new Date().toISOString();
    replace({ ...mission, status, updatedAt: now, history: [...mission.history, { id: makeId("history"), at: now, userId: user.id, label }] });
    informManagers(label, mission.title, "/voirie");
    if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: status === "En cours" ? "started" : "updated", label: `${user.firstName} : ${label.toLowerCase()} — ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
  }
  async function addPhoto(mission: Mission, files: FileList | null) {
    const additions = await filesToAttachments(files, "photo", "avant");
    replace({ ...mission, attachments: [...mission.attachments, ...additions], updatedAt: new Date().toISOString() });
  }
  function itinerary(mission: Mission) {
    const destination = mission.latitude != null && mission.longitude != null ? `${mission.latitude},${mission.longitude}` : mission.address;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank", "noopener,noreferrer");
  }
  const showGallery = (photos: FileAttachment[], index: number) => setGallery({ photos, index });

  return <section className="terrain-page">
    <header className="terrain-heading"><div><span className="eyebrow">Centre de commande terrain</span><h2>Bonjour {user.firstName}</h2><p>{mine.filter((item) => item.status !== "Terminée").length} mission(s) à réaliser</p></div><button className="new-alert-button" type="button" onClick={() => setSearchParams({ "nouvelle-alerte": "1" })}><AlertTriangle size={17}/> Nouvelle alerte</button></header>
    <nav className="terrain-status-tabs" aria-label="Filtrer les missions">{tabs.map((status) => <button className={tab === status ? "active" : ""} type="button" key={status} onClick={() => setTab(status)}><span>{status}</span><strong>{status === "Toutes" ? mine.length : mine.filter((item) => item.status === status).length}</strong></button>)}</nav>
    <div className="terrain-card-list">{displayed.map((mission) => {
      const photos = [...mission.attachments.filter((file) => file.kind === "photo"), ...mission.reports.flatMap((report) => report.photos)];
      return <article className="terrain-card" key={mission.id}>
        <div className="terrain-card-top"><div className="terrain-card-labels">{mission.priority === "Urgente" && <span className="urgent-dot"><i/>Urgente</span>}<span className="mission-status">{mission.status}</span></div>{mission.dueDate && <time>{new Date(mission.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</time>}</div>
        <h3>{mission.title}</h3><p className="terrain-card-description">{mission.description}</p><p className="terrain-address"><MapPin size={15}/>{mission.address || "Adresse à préciser"}</p>
        {photos.length > 0 && <div className="mission-thumbnails" aria-label={`${photos.length} photo(s)`}>{photos.slice(0, 4).map((photo, index) => <button type="button" key={photo.id} onClick={() => showGallery(photos, index)}><img src={photo.dataUrl} alt={photo.name}/>{index === 3 && photos.length > 4 && <span>+{photos.length - 4}</span>}</button>)}</div>}
        <div className="terrain-quick-actions"><button type="button" onClick={() => setDetailsId(mission.id)}><Info/>Détails</button><label><Camera/>Photo<input type="file" accept="image/*" capture="environment" multiple onChange={(event) => void addPhoto(mission, event.target.files)}/></label><button type="button" onClick={() => itinerary(mission)} disabled={!mission.address && mission.latitude == null}><Navigation/>Itinéraire</button></div>
        <div className="terrain-workflow-actions">
          {mission.status === "À faire" && <button className="workflow-primary" onClick={() => transition(mission, "Prise en compte", "Mission prise en compte")}><Check/>Prendre en compte</button>}
          {mission.status === "Prise en compte" && <button className="workflow-primary" onClick={() => transition(mission, "En cours", "Intervention commencée")}><Play/>Commencer</button>}
          {mission.status === "En cours" && <button className="workflow-primary" onClick={() => setReportId(mission.id)}><CheckCircle2/>Terminer</button>}
          {mission.status !== "Terminée" && <button className="workflow-problem" onClick={() => setProblemId(mission.id)}><Flag/>Signaler un problème</button>}
        </div>
      </article>;
    })}{displayed.length === 0 && <div className="empty-state"><CheckCircle2/><strong>Aucune mission</strong><span>Aucune mission ne correspond à ce filtre.</span></div>}</div>
    <section className="recent-missions" aria-labelledby="recent-missions-title">
      <h3 id="recent-missions-title">Missions récentes</h3>
      {recent.length > 0 ? <div>{recent.map((mission) => <button type="button" key={mission.id} onClick={() => setDetailsId(mission.id)}><CheckCircle2/><span><strong>{mission.title}</strong><small>{mission.address || "Adresse à préciser"}</small></span><time>{new Date(mission.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</time></button>)}</div> : <p>Aucune mission terminée récemment.</p>}
    </section>
    {detailsId && <MissionDetails mission={missions.find((item) => item.id === detailsId)} users={users} onClose={() => setDetailsId(undefined)} onGallery={showGallery}/>}
    {reportId && <FinishForm mission={missions.find((item) => item.id === reportId)} userId={user.id} onClose={() => setReportId(undefined)} onSubmit={(next) => { replace(next); informManagers("Compte rendu reçu", next.title); setReportId(undefined); }}/>}
    {problemId && <MissionProblemForm mission={missions.find((item) => item.id === problemId)} userId={user.id} onClose={() => setProblemId(undefined)} onSubmit={(next) => { replace(next); informManagers("Problème pendant une mission", next.title); setProblemId(undefined); }}/>}
    {searchParams.get("nouvelle-alerte") === "1" && <AlertForm userId={user.id} onClose={() => setSearchParams({})} onSubmit={(alert) => { saveAlerts([alert, ...alerts]); informManagers("Nouvelle alerte terrain", alert.category, "/alertes-terrain"); setSearchParams({}); }}/>}
    {gallery && <PhotoGallery {...gallery} onChange={(index) => setGallery({ ...gallery, index })} onClose={() => setGallery(undefined)}/>}
  </section>;
}

function Modal({ children, onClose, className = "" }: { children: React.ReactNode; onClose(): void; className?: string }) {
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className={`modal terrain-modal ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{children}</div></div>;
}

function AlertForm({ onClose, onSubmit, userId }: { onClose(): void; onSubmit(value: FieldAlert): void; userId: string }) {
  const [form, setForm] = useState({ category: "Voirie" as FieldAlert["category"], priority: "Normale" as FieldAlert["priority"], comment: "", address: "", latitude: undefined as number | undefined, longitude: undefined as number | undefined, photos: [] as FieldAlert["photos"] });
  const [geo, setGeo] = useState("");
  const locate = () => { setGeo("Localisation en cours…"); navigator.geolocation?.getCurrentPosition((position) => { setForm((current) => ({ ...current, latitude: position.coords.latitude, longitude: position.coords.longitude })); setGeo("Position GPS ajoutée"); }, () => setGeo("Localisation refusée ou indisponible.")); };
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="eyebrow">Remontée aux élus</span><h3>Nouvelle alerte</h3></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><X/></button></div><form className="field-form" onSubmit={(event) => { event.preventDefault(); const now = new Date().toISOString(); onSubmit({ ...form, id: makeId("alerte"), status: "Nouveau", createdBy: userId, createdAt: now, updatedAt: now }); }}><p className="form-help">Cette alerte crée un nouveau problème terrain. Elle est distincte d’un problème rencontré pendant une mission.</p><div className="form-row"><label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as FieldAlert["category"] })}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label><label>Urgence<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as FieldAlert["priority"] })}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label></div><label>Description<textarea required rows={4} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Décrivez précisément le problème…"/></label><label>Photo(s)<input type="file" accept="image/*" capture="environment" multiple onChange={async (event) => setForm({ ...form, photos: await filesToAttachments(event.target.files, "photo") })}/></label><label>Adresse<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })}/></label><button type="button" className="secondary-button" onClick={locate}><MapPin/>Utiliser ma position</button>{geo && <small>{geo}</small>}<button className="terrain-submit">Envoyer aux responsables</button></form></Modal>;
}

function FinishForm({ mission, userId, onClose, onSubmit }: { mission?: Mission; userId: string; onClose(): void; onSubmit(value: Mission): void }) {
  const [comment, setComment] = useState(""); const [photos, setPhotos] = useState<FileAttachment[]>([]);
  if (!mission) return null;
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="eyebrow">Compte rendu</span><h3>Terminer la mission</h3></div><button className="icon-button" onClick={onClose}><X/></button></div><form className="field-form" onSubmit={(event) => { event.preventDefault(); const now = new Date().toISOString(); onSubmit({ ...mission, status: "Terminée", updatedAt: now, reports: [...mission.reports, { agentId: userId, completedAt: now, comment, outcome: "terminée", photos }], history: [...mission.history, { id: makeId("history"), at: now, userId, label: "Mission terminée" }] }); }}><label>Compte rendu<textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)}/></label><label>Photos après intervention<input type="file" accept="image/*" capture="environment" multiple onChange={async (event) => setPhotos(await filesToAttachments(event.target.files, "photo", "après"))}/></label><button className="terrain-submit">Valider et terminer</button></form></Modal>;
}

function MissionProblemForm({ mission, userId, onClose, onSubmit }: { mission?: Mission; userId: string; onClose(): void; onSubmit(value: Mission): void }) {
  const [comment, setComment] = useState(""); const [photos, setPhotos] = useState<FileAttachment[]>([]);
  if (!mission) return null;
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="eyebrow">Dans cette mission</span><h3>Signaler un problème</h3></div><button className="icon-button" onClick={onClose}><X/></button></div><form className="field-form" onSubmit={(event) => { event.preventDefault(); const now = new Date().toISOString(); onSubmit({ ...mission, updatedAt: now, problems: [...(mission.problems ?? []), { id: makeId("problem"), agentId: userId, createdAt: now, comment, photos }], history: [...mission.history, { id: makeId("history"), at: now, userId, label: "Problème signalé pendant la mission" }] }); }}><p className="form-help">Ce signalement reste lié à « {mission.title} » et ne crée pas une nouvelle alerte terrain.</p><label>Problème rencontré<textarea required rows={4} value={comment} onChange={(event) => setComment(event.target.value)}/></label><label>Photo(s)<input type="file" accept="image/*" capture="environment" multiple onChange={async (event) => setPhotos(await filesToAttachments(event.target.files, "photo", "problème"))}/></label><button className="terrain-submit">Envoyer au responsable</button></form></Modal>;
}

function MissionDetails({ mission, users, onClose, onGallery }: { mission?: Mission; users: ReturnType<typeof useIdentity>["users"]; onClose(): void; onGallery(photos: FileAttachment[], index: number): void }) {
  if (!mission) return null; const documents = mission.attachments.filter((file) => file.kind !== "photo");
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="eyebrow">Mission</span><h3>{mission.title}</h3></div><button className="icon-button" onClick={onClose}><X/></button></div><div className="mission-details"><p>{mission.description}</p><dl><div><dt>Statut</dt><dd>{mission.status}</dd></div><div><dt>Priorité</dt><dd>{mission.priority}</dd></div><div><dt>Adresse</dt><dd>{mission.address || "À préciser"}</dd></div><div><dt>Agents</dt><dd>{mission.assigneeIds.map((id) => users.find((item) => item.id === id)?.firstName).filter(Boolean).join(", ")}</dd></div></dl>{documents.length > 0 && <div><h4><FileText/>Documents</h4>{documents.map((file) => <a href={file.dataUrl} target="_blank" rel="noreferrer" key={file.id}>{file.name}</a>)}</div>}{(mission.problems ?? []).length > 0 && <div><h4><Flag/>Problèmes signalés</h4>{mission.problems?.map((problem) => <button className="problem-note" type="button" key={problem.id} onClick={() => problem.photos.length && onGallery(problem.photos, 0)}><strong>{new Date(problem.createdAt).toLocaleString("fr-FR")}</strong><span>{problem.comment}</span></button>)}</div>}</div></Modal>;
}

function PhotoGallery({ photos, index, onChange, onClose }: { photos: FileAttachment[]; index: number; onChange(value: number): void; onClose(): void }) {
  const [zoom, setZoom] = useState(1); const move = (next: number) => { onChange((next + photos.length) % photos.length); setZoom(1); };
  useEffect(() => { const keys = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); if (event.key === "ArrowLeft") move(index - 1); if (event.key === "ArrowRight") move(index + 1); }; window.addEventListener("keydown", keys); return () => window.removeEventListener("keydown", keys); });
  const photo = photos[index]; return <div className="photo-gallery" role="dialog" aria-modal="true" aria-label="Galerie photos"><header><span>{index + 1} / {photos.length}</span><div><button onClick={() => setZoom(Math.max(1, zoom - .5))} aria-label="Dézoomer"><ZoomOut/></button><button onClick={() => setZoom(Math.min(3, zoom + .5))} aria-label="Zoomer"><ZoomIn/></button><button onClick={onClose} aria-label="Fermer"><X/></button></div></header><div className="photo-gallery-stage"><img src={photo.dataUrl} alt={photo.name} style={{ transform: `scale(${zoom})` }}/></div>{photos.length > 1 && <><button className="gallery-previous" onClick={() => move(index - 1)} aria-label="Photo précédente"><ChevronLeft/></button><button className="gallery-next" onClick={() => move(index + 1)} aria-label="Photo suivante"><ChevronRight/></button></>}</div>;
}
