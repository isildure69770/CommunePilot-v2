import { useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Clock3, FileText, MapPin, Navigation, Play, Wrench } from "lucide-react";
import { useIdentity } from "../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { AlertSyncStatus, FieldAlert, Mission } from "./types";
import { useFieldData } from "./useFieldData";

const tabs = ["Toutes", "À faire", "Prise en compte", "En cours", "Terminée"] as const;

export default function TerrainPage() {
  const { user, users } = useIdentity();
  const { missions, alerts, saveMissions, saveAlerts, alertSync, synchronizeAlerts, notify } = useFieldData();
  const mine = missions.filter((mission) => mission.assigneeIds.includes(user.id) && mission.status !== "Annulée" && !mission.archivedAt);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Toutes");
  const displayed = tab === "Toutes" ? mine : mine.filter((mission) => mission.status === tab);
  const [selected, setSelected] = useState<string>();
  const mission = mine.find((item) => item.id === selected);
  const [reportOpen, setReportOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [outcome, setOutcome] = useState<"terminée" | "nouvelle-intervention">("terminée");
  const [afterPhotos, setAfterPhotos] = useState<Mission["attachments"]>([]);
  const managers = users.filter((candidate) => ["Maire", "Adjoint", "Agent administratif"].includes(candidate.role)).map((candidate) => candidate.id);

  const replace = (next: Mission) => saveMissions(missions.map((item) => item.id === next.id ? next : item));
  const informManagers = (title: string, message: string, link = "/missions") => notify({ userIds: managers, title, message, link });

  function acknowledge() {
    if (!mission || mission.status !== "À faire") return;
    const now = new Date().toISOString();
    replace({ ...mission, status: "Prise en compte", updatedAt: now, history: [...mission.history, { id: makeId("history"), at: now, userId: user.id, label: `Mission prise en compte par ${user.firstName}` }] });
    informManagers("Mission prise en compte", `${user.firstName} a pris en compte : ${mission.title}`, "/voirie");
  }

  function start() {
    if (!mission || mission.status !== "Prise en compte") return;
    const now = new Date().toISOString();
    replace({ ...mission, status: "En cours", updatedAt: now, history: [...mission.history, { id: makeId("history"), at: now, userId: user.id, label: "Intervention commencée" }] });
    if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: "started", label: `${user.firstName} a commencé l’intervention ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
    informManagers("Mission commencée", mission.title);
  }

  async function addBefore(files: FileList | null) {
    if (mission) {
      const photos = (await filesToAttachments(files, "photo", "avant")).map((photo) => ({ ...photo, addedBy: user.id, addedByRole: "Agent technique" as const }));
      replace({ ...mission, attachments: [...mission.attachments, ...photos], updatedAt: new Date().toISOString() });
    }
  }

  function finish() {
    if (!mission || !window.confirm(outcome === "terminée" ? "Confirmer la clôture de cette mission ?" : "Confirmer qu’une nouvelle intervention est nécessaire ?")) return;
    const now = new Date().toISOString();
    const reportPhotos = afterPhotos.map((photo) => ({ ...photo, addedBy: user.id, addedByRole: "Agent technique" as const }));
    const next = { ...mission, status: (outcome === "terminée" ? "Terminée" : "À faire") as Mission["status"], updatedAt: now, reports: [...mission.reports, { agentId: user.id, completedAt: now, comment, outcome, photos: reportPhotos }], history: [...mission.history, { id: makeId("history"), at: now, userId: user.id, label: outcome === "terminée" ? "Mission terminée" : "Nouvelle intervention demandée" }] };
    replace(next);
    if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: outcome === "terminée" ? "completed" : "report-added", label: outcome === "terminée" ? `${user.firstName} a terminé l’intervention ${mission.title}` : `${user.firstName} a ajouté un compte rendu à ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
    informManagers("Compte rendu reçu", mission.title);
    setReportOpen(false); setComment(""); setAfterPhotos([]);
  }

  return <section className={`terrain-page ${mission ? "terrain-page-detail" : ""}`}>
    {!mission && <><header className="terrain-heading"><div><span className="eyebrow">Espace terrain</span><h2>Bonjour {user.firstName}</h2><p>{mine.filter((item) => item.status !== "Terminée").length} mission(s) à réaliser</p><SyncIndicator status={alertSync.status} error={alertSync.error} onSync={() => void synchronizeAlerts()}/></div></header>
    <nav className="terrain-status-tabs" aria-label="Statut des missions">{tabs.map((status) => <button className={tab === status ? "active" : ""} type="button" key={status} onClick={() => setTab(status)}><span>{status}</span><strong>{status === "Toutes" ? mine.length : mine.filter((item) => item.status === status).length}</strong></button>)}</nav></>}
    <button className="alert-permanent" onClick={() => setAlertOpen(true)}><AlertTriangle/> Signaler un problème</button>
    {!mission ? <MissionTiles missions={displayed} onSelect={setSelected}/> : <MissionDetail mission={mission} onBack={() => setSelected(undefined)} onAcknowledge={acknowledge} onStart={start} onAddPhoto={addBefore} onFinish={() => setReportOpen(true)}/>}
    {reportOpen && <div className="modal-backdrop"><div className="modal terrain-modal"><div className="modal-header"><div><span className="eyebrow">Compte rendu</span><h3>Terminer l’intervention</h3></div><button className="icon-button" onClick={() => setReportOpen(false)}>×</button></div><div className="field-form"><label>Remarque<textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Travaux réalisés, difficulté rencontrée…"/></label><label>Photos après intervention<input type="file" accept="image/*" capture="environment" multiple onChange={async (event) => setAfterPhotos(await filesToAttachments(event.target.files,"photo","après"))}/></label><label>Résultat<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option value="terminée">Intervention terminée</option><option value="nouvelle-intervention">Nouvelle intervention nécessaire</option></select></label><button className="terrain-submit" onClick={finish}>Valider le compte rendu</button></div></div></div>}
    {alertOpen && <AlertForm onClose={() => setAlertOpen(false)} onSubmit={(alert) => { saveAlerts([alert,...alerts]); informManagers("Nouveau signalement terrain",alert.category,"/alertes-terrain"); setAlertOpen(false); }} userId={user.id}/>}
  </section>;
}

function MissionTiles({missions,onSelect}:{missions:Mission[];onSelect(id:string):void}) {
  return <div className="agent-mission-grid">{missions.map((mission) => {
    const photo = mission.attachments.find((attachment) => attachment.kind === "photo" && attachment.dataUrl);
    return <button type="button" className="agent-mission-tile" key={mission.id} onClick={() => onSelect(mission.id)}>
      <div className="agent-mission-photo">{photo ? <img src={photo.dataUrl} alt=""/> : <Wrench aria-hidden="true"/>}<span className={`priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span></div>
      <div className="agent-mission-copy"><div><strong>{mission.title}</strong><span className="agent-mission-status">{mission.status}</span></div><p>{mission.description}</p><span><MapPin/> {mission.address || "Adresse à préciser"}</span>{mission.dueDate && <span><Clock3/> {new Date(mission.dueDate).toLocaleString("fr-FR")}</span>}</div>
    </button>;
  })}{missions.length === 0 && <div className="empty-state"><CheckCircle2/><strong>Aucune mission dans cet onglet</strong><span>Changez de statut pour afficher les autres missions.</span></div>}</div>;
}

function MissionDetail({mission,onBack,onAcknowledge,onStart,onAddPhoto,onFinish}:{mission:Mission;onBack():void;onAcknowledge():void;onStart():void;onAddPhoto(files:FileList|null):Promise<void>;onFinish():void}) {
  const [section, setSection] = useState<"documents" | "map" | "photos">("photos");
  const photo = mission.attachments.find((attachment) => attachment.kind === "photo" && attachment.dataUrl);
  const documents = mission.attachments.filter((attachment) => attachment.kind === "document");
  const electedPhotos = mission.attachments.filter((attachment) => attachment.kind === "photo" && attachment.addedByRole !== "Agent technique");
  const agentPhotos = [...mission.attachments.filter((attachment) => attachment.kind === "photo" && attachment.addedByRole === "Agent technique"), ...mission.reports.flatMap((report) => report.photos)];
  const mapUrl = mission.latitude !== undefined && mission.longitude !== undefined
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mission.longitude - 0.006}%2C${mission.latitude - 0.004}%2C${mission.longitude + 0.006}%2C${mission.latitude + 0.004}&layer=mapnik&marker=${mission.latitude}%2C${mission.longitude}`
    : undefined;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mission.latitude !== undefined && mission.longitude !== undefined ? `${mission.latitude},${mission.longitude}` : mission.address)}`;
  return <article className="agent-mission-detail">
    <button type="button" className="agent-back" onClick={onBack}><ArrowLeft/> Mes missions</button>
    <div className="agent-detail-hero">{photo ? <img src={photo.dataUrl} alt="Vue de la mission"/> : <div><Wrench/><span>Mission terrain</span></div>}<span className={`priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span></div>
    <div className="agent-detail-content"><header><span className="eyebrow">{mission.category} · {mission.status}</span><h2>{mission.title}</h2><p>{mission.description}</p></header>
      <div className="agent-mission-facts"><div><MapPin/><span><strong>Adresse</strong>{mission.address || "Adresse à préciser"}</span></div>{mission.dueDate && <div><Clock3/><span><strong>Échéance</strong>{new Date(mission.dueDate).toLocaleString("fr-FR")}</span></div>}</div>
      <div className="mission-workflow"><span className={mission.status !== "À faire" ? "done" : "active"}>1 Prise en compte</span><span className={["En cours","Terminée"].includes(mission.status) ? "done" : mission.status === "Prise en compte" ? "active" : ""}>2 Commencée</span><span className={mission.status === "Terminée" ? "done" : mission.status === "En cours" ? "active" : ""}>3 Terminée</span></div>
      <nav className="agent-detail-tabs" aria-label="Informations de la mission"><button type="button" className={section === "documents" ? "active" : ""} onClick={() => setSection("documents")}><FileText/> Documents <span>{documents.length}</span></button><button type="button" className={section === "map" ? "active" : ""} onClick={() => setSection("map")}><MapPin/> Carte</button><button type="button" className={section === "photos" ? "active" : ""} onClick={() => setSection("photos")}><Camera/> Photos <span>{electedPhotos.length + agentPhotos.length}</span></button></nav>
      <section className="agent-tab-panel">
        {section === "documents" && <div className="agent-documents"><h3>Documents de la mission</h3>{documents.length ? documents.map((document) => document.dataUrl ? <a href={document.dataUrl} download={document.name} key={document.id}><FileText/> {document.name}</a> : <span key={document.id}><FileText/> {document.name}</span>) : <div className="agent-tab-empty"><FileText/><span>Aucun document joint.</span></div>}</div>}
        {section === "map" && <section className="agent-location"><div><MapPin/><span><strong>Adresse</strong>{mission.address || "Adresse à préciser"}</span></div>{mapUrl ? <iframe title={`Carte de ${mission.title}`} src={mapUrl} loading="lazy"/> : <div className="agent-tab-empty"><MapPin/><span>La position précise n’est pas encore renseignée.</span></div>}<a href={directionsUrl} target="_blank" rel="noreferrer"><Navigation/> Ouvrir l’itinéraire</a></section>}
        {section === "photos" && <div className="agent-photos"><div className="agent-photos-heading"><div><h3>Photos de la mission</h3><p>Photos transmises par les élus et ajoutées sur le terrain.</p></div><label className="agent-add-photo"><Camera/> Prendre une photo<input type="file" accept="image/*" capture="environment" multiple onChange={(event) => void onAddPhoto(event.target.files)}/></label></div><PhotoGroup title="Photos des élus" photos={electedPhotos}/><PhotoGroup title="Photos des agents" photos={agentPhotos}/></div>}
      </section>
      <div className="terrain-actions terrain-main-actions"><button className="action-acknowledge" disabled={mission.status !== "À faire"} onClick={onAcknowledge}><CheckCircle2/> Prendre en compte</button><button className="action-start" disabled={mission.status !== "Prise en compte"} onClick={onStart}><Play/> Commencer</button><button className="action-finish" disabled={mission.status !== "En cours"} onClick={onFinish}><CheckCircle2/> Terminer la mission</button></div>
    </div>
  </article>;
}

function PhotoGroup({title,photos}:{title:string;photos:Mission["attachments"]}) {
  return <section className="agent-photo-group"><h4>{title} <span>{photos.length}</span></h4>{photos.length ? <div>{photos.map((photo) => photo.dataUrl ? <figure key={photo.id}><img src={photo.dataUrl} alt={photo.name}/><figcaption>{photo.phase === "après" ? "Après intervention" : photo.name}</figcaption></figure> : <div className="agent-photo-missing" key={photo.id}><Camera/><span>{photo.name}</span></div>)}</div> : <p>Aucune photo.</p>}</section>;
}

function AlertForm({onClose,onSubmit,userId}:{onClose():void;onSubmit(value:FieldAlert):void;userId:string}) {
  const [form,setForm]=useState({category:"Voirie" as FieldAlert["category"],comment:"",address:"",latitude:undefined as number|undefined,longitude:undefined as number|undefined,photos:[] as FieldAlert["photos"]});
  const [geo,setGeo]=useState("");
  const locate=()=>{setGeo("Localisation en cours…");navigator.geolocation?.getCurrentPosition((position)=>{setForm({...form,latitude:position.coords.latitude,longitude:position.coords.longitude});setGeo("Position ajoutée");},()=>setGeo("Localisation refusée ou indisponible."));};
  return <div className="modal-backdrop"><div className="modal terrain-modal"><div className="modal-header"><div><span className="eyebrow">Alerte terrain</span><h3>Signaler un problème</h3></div><button className="icon-button" onClick={onClose}>×</button></div><form className="field-form" onSubmit={(event)=>{event.preventDefault();const now=new Date().toISOString();onSubmit({...form,id:makeId("alerte"),status:"Nouveau",createdBy:userId,createdAt:now,updatedAt:now,history:[{id:makeId("history"),at:now,userId,label:"Alerte créée sur le terrain"}]});}}><label>Catégorie<select value={form.category} onChange={(event)=>setForm({...form,category:event.target.value as FieldAlert["category"]})}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label><label>Photo(s)<input type="file" accept="image/*" capture="environment" multiple onChange={async (event)=>setForm({...form,photos:await filesToAttachments(event.target.files,"photo")})}/></label><label>Quelques mots<textarea required rows={3} value={form.comment} onChange={(event)=>setForm({...form,comment:event.target.value})}/></label><label>Adresse<input value={form.address} onChange={(event)=>setForm({...form,address:event.target.value})}/></label><button type="button" className="secondary-button" onClick={locate}><MapPin/> Utiliser ma position</button>{geo&&<small>{geo}</small>}<button className="terrain-submit">Envoyer à la mairie</button></form></div></div>;
}

export function SyncIndicator({status,error,onSync}:{status:AlertSyncStatus;error:string;onSync():void}) {
  const labels: Record<AlertSyncStatus,string> = { local:"Local uniquement", syncing:"Synchronisation en cours…", synced:"Synchronisé", error:"Erreur de synchronisation" };
  return <div className={`alert-sync alert-sync-${status}`} title={error}><span>{labels[status]}</span><button type="button" disabled={status==="syncing"} onClick={onSync}>Synchroniser maintenant</button></div>;
}
