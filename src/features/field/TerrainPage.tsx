import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock3, FileText, Flag, History, Info, Map, MapPin, Navigation, Play, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useIdentity } from "../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { FieldAlert, FileAttachment, Mission } from "./types";
import { useFieldData } from "./useFieldData";
import { reverseGeocode } from "../map/services/reverseGeocoding";

const tabs = ["Toutes", "À faire", "En cours", "Terminées"] as const;

function matchesTab(mission: Mission, tab: (typeof tabs)[number]) {
  if (tab === "Toutes") return true;
  if (tab === "À faire") return mission.status === "À faire" || mission.status === "Prise en compte";
  if (tab === "Terminées") return mission.status === "Terminée";
  return mission.status === tab;
}

function durationLabel(mission: Mission) {
  if (!mission.dueDate) return "Non définie";
  const elapsed = new Date(mission.dueDate).getTime() - new Date(mission.createdAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed <= 0) return "À échéance";
  const hours = Math.max(1, Math.round(elapsed / 3_600_000));
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} jour${days > 1 ? "s" : ""}`;
}

function photoPreview(photo: FileAttachment) {
  return photo.thumbnailDataUrl || photo.dataUrl;
}

export default function TerrainPage() {
  const { user, users, can } = useIdentity();
  const { missions, alerts, saveMissions, saveAlerts, notify } = useFieldData();
  const mine = missions.filter((item) => item.assigneeIds.includes(user.id) && item.status !== "Annulée" && !item.archivedAt);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Toutes");
  const displayed = mine.filter((item) => matchesTab(item, tab));
  const sharedAlerts = [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [section, setSection] = useState<"missions" | "alerts">("missions");
  const [detailsId, setDetailsId] = useState<string>();
  const [reportId, setReportId] = useState<string>();
  const [problemId, setProblemId] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] = useState<FieldAlert>();
  const [alertsHubOpen, setAlertsHubOpen] = useState(false);
  const [alertsHubTab, setAlertsHubTab] = useState<"active" | "history">("active");
  const [alertDetailsId, setAlertDetailsId] = useState<string>();
  const [gallery, setGallery] = useState<{ photos: FileAttachment[]; index: number }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const managers = users.filter((candidate) => ["Maire", "Adjoint", "Agent administratif"].includes(candidate.role)).map((candidate) => candidate.id);
  const replace = (next: Mission) => saveMissions(missions.map((item) => item.id === next.id ? next : item));
  const informManagers = (title: string, message: string, link = "/missions") => notify({ userIds: managers, title, message, link });
  const updateAlert = (id: string, patch: Partial<FieldAlert>) => saveAlerts(alerts.map((alert) => alert.id === id ? { ...alert, ...patch, updatedAt: new Date().toISOString() } : alert));
  const takeAlert = (alert: FieldAlert) => {
    const now = new Date().toISOString();
    updateAlert(alert.id, { status: "Pris en compte", handledBy: user.id, handledAt: now });
    notify({ userIds: [alert.createdBy], title: "Alerte prise en charge", message: `${user.firstName} traite votre alerte ${alert.category}.`, link: "/terrain" });
  };
  const completeAlert = (alert: FieldAlert) => {
    updateAlert(alert.id, { status: "Traitée", completedAt: new Date().toISOString() });
    notify({ userIds: [alert.createdBy, ...managers], title: "Alerte traitée", message: `${user.firstName} a traité l’alerte ${alert.category}.`, link: "/alertes-terrain" });
  };
  const deleteAlert = (alert: FieldAlert) => {
    if (alert.createdBy !== user.id && !can("signalements", "delete")) return;
    const now = new Date().toISOString();
    updateAlert(alert.id, { status: "Supprimée", deletedAt: now, deletedBy: user.id });
    notify({ userIds: managers, title: "Fiche alerte supprimée", message: `${user.firstName} a supprimé une alerte ${alert.category}.`, link: "/alertes-terrain" });
    setDeleteCandidate(undefined);
  };

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

  const activeCount = mine.filter((item) => item.status !== "Terminée").length;
  const urgentCount = mine.filter((item) => item.status !== "Terminée" && item.priority === "Urgente").length;
  const nextMission = [...mine].filter((item) => item.status !== "Terminée").sort((a, b) => {
    const priority = { Urgente: 0, Haute: 1, Normale: 2, Basse: 3 };
    return priority[a.priority] - priority[b.priority] || (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
  })[0];
  const nextPhotos = nextMission ? [...nextMission.attachments.filter((file) => file.kind === "photo"), ...nextMission.reports.flatMap((report) => report.photos)] : [];
  const finishedAlertStatuses: FieldAlert["status"][] = ["Traitée", "Transformé en mission", "Classé", "Supprimée"];
  const activeAlerts = sharedAlerts.filter((alert) => !finishedAlertStatuses.includes(alert.status));
  const finishedAlerts = sharedAlerts.filter((alert) => finishedAlertStatuses.includes(alert.status));
  const selectedAlert = alerts.find((alert) => alert.id === alertDetailsId);

  return <section className="terrain-page">
    <header className="agent-home-heading"><div><h2>Bonjour {user.firstName} <span aria-hidden="true">👋</span></h2><p>Agent technique</p></div><Link to="/notifications" aria-label="Notifications"><Bell/><strong>{urgentCount || sharedAlerts.filter((alert) => alert.status === "Nouveau").length || 0}</strong></Link></header>
    <section className="agent-day-summary" aria-label="Synthèse du jour"><div><small>Aujourd’hui</small><strong>{activeCount} mission{activeCount > 1 ? "s" : ""}</strong></div><i/><div><strong>{urgentCount}</strong><small>urgente{urgentCount > 1 ? "s" : ""}</small></div></section>
    <nav className="agent-primary-nav" aria-label="Actions principales"><Link to="/missions"><ClipboardList/><span>Mes missions</span></Link><button type="button" onClick={() => setAlertsHubOpen(true)}><AlertTriangle/><span>Mes alertes</span></button><Link to="/carte"><Map/><span>Carte</span></Link><Link to="/calendrier"><Clock3/><span>Agenda</span></Link></nav>
    <button className="agent-alert-history-link" type="button" onClick={() => setAlertsHubOpen(true)}><span><History/><strong>Alertes de tous les agents</strong><small>{activeAlerts.length} active{activeAlerts.length > 1 ? "s" : ""} · {finishedAlerts.length} terminée{finishedAlerts.length > 1 ? "s" : ""}</small></span><ChevronRight/></button>
    <div className="agent-section-title"><span>{section === "missions" ? "Prochaine mission prioritaire" : "Suivi de mes signalements"}</span>{section === "alerts" && <button type="button" onClick={() => setSection("missions")}><ChevronLeft/> Retour aux missions</button>}</div>
    {section === "missions" && <>
    {nextMission && <article className="agent-priority-card">
      <button className="agent-priority-visual" type="button" onClick={() => nextPhotos.length && showGallery(nextPhotos, 0)}>{nextPhotos[0] ? <img src={photoPreview(nextPhotos[0])} alt={nextPhotos[0].name}/> : <span><MapPin/></span>}<em className={`priority-${nextMission.priority.toLowerCase()}`}>{nextMission.priority}</em></button>
      <button className="agent-priority-copy" type="button" onClick={() => setDetailsId(nextMission.id)}><strong>{nextMission.title}</strong><span>{nextMission.address || "Adresse à préciser"}</span><small><MapPin/> {nextMission.latitude != null ? "Position GPS disponible" : durationLabel(nextMission)}</small><ChevronRight/></button>
    </article>}
    {!nextMission && <div className="agent-empty-mission"><CheckCircle2/><strong>Aucune mission aujourd’hui</strong><span>Votre feuille de route est à jour.</span></div>}
    {nextMission && <div className="agent-home-actions">
      {nextMission.status === "À faire" && <button className="agent-action-start" onClick={() => transition(nextMission, "Prise en compte", "Mission prise en compte")}><Check/>Prendre en compte</button>}
      {nextMission.status === "Prise en compte" && <button className="agent-action-start" onClick={() => transition(nextMission, "En cours", "Intervention commencée")}><Play/>Commencer</button>}
      {nextMission.status === "En cours" && <button className="agent-action-start" onClick={() => setReportId(nextMission.id)}><CheckCircle2/>Terminer</button>}
      <button className="agent-action-route" onClick={() => itinerary(nextMission)} disabled={!nextMission.address && nextMission.latitude == null}><Navigation/>Itinéraire</button>
      <button className="agent-action-problem" onClick={() => setProblemId(nextMission.id)}><Camera/>Signaler un problème</button>
    </div>}
    <details className="agent-all-missions"><summary>Voir toutes mes missions ({activeCount})</summary>
    <nav className="terrain-status-tabs" aria-label="Filtrer les missions">{tabs.map((status) => <button className={tab === status ? "active" : ""} type="button" key={status} onClick={() => setTab(status)}><span>{status}</span><strong>{mine.filter((item) => matchesTab(item, status)).length}</strong></button>)}</nav>
    <div className="terrain-card-list">{displayed.map((mission) => {
      const photos = [...mission.attachments.filter((file) => file.kind === "photo"), ...mission.reports.flatMap((report) => report.photos)];
      const creatorId = mission.history[0]?.userId;
      const creator = users.find((candidate) => candidate.id === creatorId);
      return <article className="terrain-card" key={mission.id}>
        <div className="terrain-card-top"><div className="terrain-card-labels"><span className={`priority-pill priority-${mission.priority.toLowerCase()}`}><i/>{mission.priority}</span><span className="mission-status">{mission.status}</span></div><span className="mission-duration"><Clock3/>{durationLabel(mission)}</span></div>
        <h3>{mission.title}</h3><p className="terrain-card-description">{mission.description}</p><p className="terrain-address"><MapPin size={15}/>{mission.address || "Adresse à préciser"}</p>
        {photos.length > 0 && <div className="mission-thumbnails" aria-label={`${photos.length} photo(s)`}>{photos.slice(0, 4).map((photo, index) => <button type="button" key={photo.id} onClick={() => showGallery(photos, index)}><img src={photoPreview(photo)} alt={photo.name}/>{index === 3 && photos.length > 4 && <span>+{photos.length - 4}</span>}</button>)}</div>}
        <dl className="terrain-card-facts"><div><dt>Créée par</dt><dd>{creator ? `${creator.firstName} ${creator.lastName}` : "Équipe municipale"}</dd></div><div><dt>Priorité</dt><dd>{mission.priority}</dd></div><div><dt>Type</dt><dd>{mission.category || "Intervention"}</dd></div></dl>
        <div className="terrain-quick-actions"><button type="button" onClick={() => setDetailsId(mission.id)}><Info/>Détails</button><label><Camera/>Photo<input type="file" accept="image/*" capture="environment" multiple onChange={(event) => void addPhoto(mission, event.target.files)}/></label><button type="button" onClick={() => itinerary(mission)} disabled={!mission.address && mission.latitude == null}><Navigation/>Itinéraire</button></div>
        <div className="terrain-workflow-actions">
          {mission.status === "À faire" && <button className="workflow-primary" onClick={() => transition(mission, "Prise en compte", "Mission prise en compte")}><Check/>Prendre en compte</button>}
          {mission.status === "Prise en compte" && <button className="workflow-primary" onClick={() => transition(mission, "En cours", "Intervention commencée")}><Play/>Commencer</button>}
          {mission.status === "En cours" && <button className="workflow-primary" onClick={() => setReportId(mission.id)}><CheckCircle2/>Terminer</button>}
          {mission.status !== "Terminée" && <button className="workflow-problem" onClick={() => setProblemId(mission.id)}><Flag/>Signaler un problème</button>}
        </div>
      </article>;
    })}{displayed.length === 0 && <div className="empty-state"><CheckCircle2/><strong>Aucune mission</strong><span>Aucune mission ne correspond à ce filtre.</span></div>}</div></details></>}
    {section === "alerts" && <section className="terrain-alerts-view agent-alert-history"><header><div><span className="eyebrow">File terrain partagée</span><h3>Alertes de tous les agents</h3><p>Consultez et traitez les signalements de toute l’équipe.</p></div><button type="button" onClick={() => setSearchParams({ "nouvelle-alerte": "1" })}><AlertTriangle/> Nouvelle alerte</button></header>{sharedAlerts.length > 0 ? <div>{sharedAlerts.map((alert) => { const author = users.find((candidate) => candidate.id === alert.createdBy); const handler = users.find((candidate) => candidate.id === alert.handledBy); const deleter = users.find((candidate) => candidate.id === alert.deletedBy); const isDeleted = alert.status === "Supprimée"; const canComplete = alert.status === "Pris en compte" && alert.handledBy === user.id; const canDeleteAlert = !isDeleted && (alert.createdBy === user.id || can("signalements", "delete")); const priority = alert.priority || "Normale"; const photos = alert.photos || []; const createdAt = alert.createdAt ? new Date(alert.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "Date inconnue"; return <article className={isDeleted ? "is-deleted" : ""} key={alert.id}><span className={`alert-priority priority-${priority.toLowerCase()}`}>{priority}</span><div className="alert-history-heading"><strong>{alert.category || "Autre"}</strong><em>{alert.status || "Nouveau"}</em></div><time>{createdAt}</time><p>{alert.comment || "Aucune description"}</p><small><MapPin/>{alert.address || (alert.latitude != null ? "Position GPS transmise" : "Localisation non précisée")}</small><span className="alert-history-author">Créée par {author ? `${author.firstName} ${author.lastName}` : "un agent"}{handler && ` · Prise par ${handler.firstName}`}</span>{photos.length > 0 && <div className="alert-history-photos">{photos.slice(0, 4).map((photo, index) => <button type="button" key={photo.id} onClick={() => showGallery(photos, index)}><img src={photoPreview(photo)} alt={photo.name}/></button>)}</div>}{(!alert.status || alert.status === "Nouveau") && <button className="alert-take-button" type="button" onClick={() => takeAlert(alert)}><Check/>Prendre en charge</button>}{canComplete && <button className="alert-complete-button" type="button" onClick={() => completeAlert(alert)}><CheckCircle2/>Marquer comme traitée</button>}{alert.status === "Pris en compte" && alert.handledBy !== user.id && <span className="alert-history-locked">Déjà prise en charge par {handler?.firstName || "un autre agent"}</span>}{alert.missionId && <span className="alert-history-linked"><CheckCircle2/> Transformée en mission</span>}{isDeleted && <span className="alert-history-deleted"><Trash2/> Supprimée le {new Date(alert.deletedAt || alert.updatedAt).toLocaleString("fr-FR")} par {deleter?.firstName || "un utilisateur autorisé"}</span>}{canDeleteAlert && <button className="alert-delete-button" type="button" onClick={() => setDeleteCandidate(alert)}><Trash2/>Supprimer la fiche</button>}</article>; })}</div> : <div className="empty-state"><AlertTriangle/><strong>Aucune alerte envoyée</strong><span>Utilisez le bouton « Nouvelle alerte » pour prévenir les élus.</span></div>}</section>}
    {alertsHubOpen && <Modal onClose={() => setAlertsHubOpen(false)} className="agent-alerts-hub"><div className="modal-header"><div><span className="eyebrow">Terrain</span><h3>Mes alertes</h3></div><button className="icon-button" type="button" onClick={() => setAlertsHubOpen(false)} aria-label="Fermer"><X/></button></div><nav className="alerts-hub-tabs"><button className="create-alert-tab" type="button" onClick={() => { setAlertsHubOpen(false); setSearchParams({ "nouvelle-alerte": "1" }); }}><AlertTriangle/>Créer une alerte</button><button className={alertsHubTab === "active" ? "active" : ""} type="button" onClick={() => setAlertsHubTab("active")}>Actives <strong>{activeAlerts.length}</strong></button><button className={alertsHubTab === "history" ? "active" : ""} type="button" onClick={() => setAlertsHubTab("history")}>Historique <strong>{finishedAlerts.length}</strong></button></nav><div className="alerts-hub-list">{(alertsHubTab === "active" ? activeAlerts : finishedAlerts).map((alert) => { const author = users.find((candidate) => candidate.id === alert.createdBy); return <button type="button" key={alert.id} onClick={() => { setAlertDetailsId(alert.id); setAlertsHubOpen(false); }}><span className={`alerts-hub-icon priority-${(alert.priority || "Normale").toLowerCase()}`}><AlertTriangle/></span><span><strong>{alert.category || "Alerte terrain"}</strong><small>Créée par {author ? `${author.firstName} ${author.lastName}` : "un agent"}</small><time>{new Date(alert.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</time></span><em>{alert.status || "Nouveau"}</em><ChevronRight/></button>; })}{(alertsHubTab === "active" ? activeAlerts : finishedAlerts).length === 0 && <div className="agent-empty-mission"><CheckCircle2/><strong>Aucune alerte</strong><span>{alertsHubTab === "active" ? "Aucune alerte active." : "Aucune alerte terminée dans l’historique."}</span></div>}</div></Modal>}
    {selectedAlert && <Modal onClose={() => setAlertDetailsId(undefined)} className="agent-alert-detail"><div className="modal-header"><div><span className="eyebrow">Fiche alerte</span><h3>{selectedAlert.category}</h3></div><button className="icon-button" type="button" onClick={() => setAlertDetailsId(undefined)} aria-label="Fermer"><X/></button></div><div className="alert-detail-status"><strong>{selectedAlert.status}</strong><time>{new Date(selectedAlert.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</time></div>{(selectedAlert.photos || []).length > 0 && <div className="alert-history-photos">{selectedAlert.photos.map((photo, index) => <button type="button" key={photo.id} onClick={() => showGallery(selectedAlert.photos, index)}><img src={photoPreview(photo)} alt={photo.name}/></button>)}</div>}<dl className="alert-detail-facts"><div><dt>Créée par</dt><dd>{users.find((candidate) => candidate.id === selectedAlert.createdBy)?.firstName || "Agent"}</dd></div><div><dt>Priorité</dt><dd>{selectedAlert.priority}</dd></div><div><dt>Adresse</dt><dd>{selectedAlert.address || "Non précisée"}</dd></div></dl><p>{selectedAlert.comment || "Aucune description"}</p>{selectedAlert.status === "Nouveau" && <button className="alert-take-button" type="button" onClick={() => { takeAlert(selectedAlert); setAlertDetailsId(undefined); }}><Check/>Prendre en charge</button>}{selectedAlert.status === "Pris en compte" && selectedAlert.handledBy === user.id && <button className="alert-complete-button" type="button" onClick={() => { completeAlert(selectedAlert); setAlertDetailsId(undefined); }}><CheckCircle2/>Marquer comme traitée</button>}</Modal>}
    {detailsId && <MissionDetails mission={missions.find((item) => item.id === detailsId)} users={users} onClose={() => setDetailsId(undefined)} onGallery={showGallery}/>}
    {reportId && <FinishForm mission={missions.find((item) => item.id === reportId)} userId={user.id} onClose={() => setReportId(undefined)} onSubmit={(next) => { replace(next); informManagers("Compte rendu reçu", next.title); setReportId(undefined); }}/>}
    {problemId && <MissionProblemForm mission={missions.find((item) => item.id === problemId)} userId={user.id} onClose={() => setProblemId(undefined)} onSubmit={(next) => { replace(next); informManagers("Problème pendant une mission", next.title); setProblemId(undefined); }}/>}
    {searchParams.get("nouvelle-alerte") === "1" && <AlertForm
      userId={user.id}
      onClose={() => setSearchParams({})}
      onSubmit={async (alert) => { await saveAlerts([alert, ...alerts]); informManagers("Nouvelle alerte terrain", alert.category, "/alertes-terrain"); setSearchParams({}); }}
    />}
    {deleteCandidate && <Modal onClose={() => setDeleteCandidate(undefined)} className="delete-alert-confirmation"><div className="modal-header"><div><span className="eyebrow">Confirmation</span><h3>Supprimer cette fiche ?</h3></div><button className="icon-button" type="button" onClick={() => setDeleteCandidate(undefined)} aria-label="Fermer"><X/></button></div><div className="delete-alert-summary"><Trash2/><p>La fiche « {deleteCandidate.category} » restera dans l’historique avec la date et le nom de la personne qui l’a supprimée.</p></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setDeleteCandidate(undefined)}>Annuler</button><button className="danger-button" type="button" onClick={() => deleteAlert(deleteCandidate)}><Trash2/>Confirmer la suppression</button></div></Modal>}
    {gallery && <PhotoGallery {...gallery} onChange={(index) => setGallery({ ...gallery, index })} onClose={() => setGallery(undefined)}/>}
  </section>;
}

function Modal({ children, onClose, className = "" }: { children: React.ReactNode; onClose(): void; className?: string }) {
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className={`modal terrain-modal ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{children}</div></div>;
}

function AlertForm({ onClose, onSubmit, userId }: { onClose(): void; onSubmit(value: FieldAlert): Promise<void>; userId: string }) {
  const [form, setForm] = useState({ category: "Voirie" as FieldAlert["category"], priority: "Normale" as FieldAlert["priority"], comment: "", address: "", latitude: undefined as number | undefined, longitude: undefined as number | undefined, photos: [] as FieldAlert["photos"] });
  const [geo, setGeo] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sendError, setSendError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [sending, setSending] = useState(false);
  const locate = () => {
    setGeo("Localisation en cours…");
    if (!navigator.geolocation) {
      setGeo("Localisation indisponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setForm((current) => ({ ...current, address: fallback, latitude, longitude }));
      setGeo("Position trouvée, recherche de l’adresse…");
      const result = await reverseGeocode(latitude, longitude);
      const address = result?.displayName.trim() || fallback;
      setForm((current) => ({ ...current, address, latitude, longitude }));
      setGeo(result?.displayName ? "Adresse détectée automatiquement." : "Adresse indisponible : coordonnées GPS ajoutées.");
    }, () => setGeo("Localisation refusée ou indisponible."));
  };
  const selectPhotos = async (files: FileList | null) => {
    setPhotoError("");
    try { const photos = await filesToAttachments(files, "photo"); setForm((current) => ({ ...current, photos })); }
    catch (error) { setPhotoError(error instanceof Error ? error.message : "La photo n’a pas pu être préparée. Les autres champs sont conservés."); }
  };
  const send = async () => {
    setSendError("");
    const now = new Date().toISOString();
    setSending(true);
    try { await onSubmit({ ...form, id: makeId("alerte"), status: "Nouveau", createdBy: userId, createdAt: now, updatedAt: now }); }
    catch (error) { setSendError(`${error instanceof Error ? error.message : "L’alerte n’a pas pu être enregistrée."} Les informations saisies sont conservées.`); }
    finally { setSending(false); }
  };
  return <Modal onClose={onClose} className="agent-alert-wizard"><div className="modal-header"><button className="icon-button" onClick={step === 1 ? onClose : () => setStep((step - 1) as 1 | 2)} aria-label="Retour"><ChevronLeft/></button><h3>Nouvelle alerte</h3><button className="icon-button" onClick={onClose} aria-label="Fermer"><X/></button></div><ol className="alert-wizard-steps"><li className={step >= 1 ? "active" : ""}><b>1</b>Photo</li><li className={step >= 2 ? "active" : ""}><b>2</b>Infos</li><li className={step >= 3 ? "active" : ""}><b>3</b>Envoyer</li></ol>
  {step === 1 && <div className="alert-photo-step"><label>{form.photos[0] ? <img src={photoPreview(form.photos[0])} alt="Aperçu de l’alerte"/> : <><Camera/><strong>Prendre une photo</strong><span>Photographiez le problème terrain</span></>}<input type="file" accept="image/*" capture="environment" multiple onChange={(event) => void selectPhotos(event.target.files)}/></label>{photoError && <p className="alert-send-error" role="alert">{photoError}</p>}<div><label className="secondary-button">Galerie<input type="file" accept="image/*" multiple onChange={(event) => void selectPhotos(event.target.files)}/></label><button className="primary-button" type="button" onClick={() => setStep(2)}>Continuer</button></div></div>}
  {step === 2 && <form className="field-form" onSubmit={(event) => { event.preventDefault(); setStep(3); }}><label>Type de problème<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as FieldAlert["category"] })}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label><label>Urgence<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as FieldAlert["priority"] })}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Localisation<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Adresse ou position actuelle"/></label><button type="button" className="secondary-button" onClick={locate}><MapPin/>Utiliser ma position</button>{geo && <small>{geo}</small>}<label>Description<textarea required rows={4} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Décrivez le problème…"/></label><button className="primary-button">Suivant</button></form>}
  {step === 3 && <div className="alert-review-step"><span className="eyebrow">Résumé</span>{form.photos[0] && <img src={photoPreview(form.photos[0])} alt="Photo de l’alerte"/>}<strong>{form.category} · {form.priority}</strong><p>{form.address || "Position GPS transmise"}</p><p>{form.comment}</p>{sendError && <p className="alert-send-error" role="alert">{sendError}</p>}<button className="terrain-submit" type="button" onClick={() => void send()} disabled={sending}><Navigation/>{sending ? "Envoi en cours…" : "Envoyer l’alerte"}</button><button className="secondary-button" type="button" onClick={() => setStep(2)}>Retour</button></div>}</Modal>;
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
  const photo = photos[index]; return <div className="photo-gallery" role="dialog" aria-modal="true" aria-label="Galerie photos"><header><span>{index + 1} / {photos.length}</span><div><button onClick={() => setZoom(Math.max(1, zoom - .5))} aria-label="Dézoomer"><ZoomOut/></button><button onClick={() => setZoom(Math.min(3, zoom + .5))} aria-label="Zoomer"><ZoomIn/></button><button onClick={onClose} aria-label="Fermer"><X/></button></div></header><div className="photo-gallery-stage"><img src={photo.dataUrl || photo.thumbnailDataUrl} alt={photo.name} style={{ transform: `scale(${zoom})` }}/></div>{photos.length > 1 && <><button className="gallery-previous" onClick={() => move(index - 1)} aria-label="Photo précédente"><ChevronLeft/></button><button className="gallery-next" onClick={() => move(index + 1)} aria-label="Photo suivante"><ChevronRight/></button></>}</div>;
}
