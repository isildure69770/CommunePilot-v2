import { useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, FileText, MapPin, Play, Wrench } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useIdentity } from "../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../dossiers/services/dossierActivityRepository";
import { filesToAttachments } from "./fileUtils";
import { makeId } from "./repository";
import type { FieldAlert, Mission } from "./types";
import { useFieldData } from "./useFieldData";

const tabs = ["Toutes", "À faire", "Prise en compte", "En cours", "Terminée"] as const;

export default function TerrainPage() {
  const { user, users } = useIdentity();
  const { missions, alerts, saveMissions, saveAlerts, notify } = useFieldData();
  const mine = missions.filter((mission) => mission.assigneeIds.includes(user.id) && mission.status !== "Annulée" && !mission.archivedAt);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Toutes");
  const displayed = tab === "Toutes" ? mine : mine.filter((mission) => mission.status === tab);
  const [selected, setSelected] = useState<string>();
  const mission = displayed.find((item) => item.id === selected) ?? displayed[0];
  const [reportOpen, setReportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const alertOpen = searchParams.get("nouvelle-alerte") === "1";
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
    if (mission) replace({ ...mission, attachments: [...mission.attachments, ...await filesToAttachments(files, "photo", "avant")], updatedAt: new Date().toISOString() });
  }

  function finish() {
    if (!mission || !window.confirm(outcome === "terminée" ? "Confirmer la clôture de cette mission ?" : "Confirmer qu’une nouvelle intervention est nécessaire ?")) return;
    const now = new Date().toISOString();
    const next = { ...mission, status: (outcome === "terminée" ? "Terminée" : "À faire") as Mission["status"], updatedAt: now, reports: [...mission.reports, { agentId: user.id, completedAt: now, comment, outcome, photos: afterPhotos }], history: [...mission.history, { id: makeId("history"), at: now, userId: user.id, label: outcome === "terminée" ? "Mission terminée" : "Nouvelle intervention demandée" }] };
    replace(next);
    if (mission.dossierId) dossierActivityRepository.add({ dossierId: mission.dossierId, type: "mission", action: outcome === "terminée" ? "completed" : "report-added", label: outcome === "terminée" ? `${user.firstName} a terminé l’intervention ${mission.title}` : `${user.firstName} a ajouté un compte rendu à ${mission.title}`, authorId: user.id, missionId: mission.id, timestamp: now });
    informManagers("Compte rendu reçu", mission.title);
    setReportOpen(false); setComment(""); setAfterPhotos([]);
  }

  return <section className="terrain-page">
    <header className="terrain-heading"><div><span className="eyebrow">Espace terrain</span><h2>Bonjour {user.firstName}</h2><p>{mine.filter((item) => !["Terminée"].includes(item.status)).length} mission(s) à réaliser</p></div></header>
    <nav className="terrain-status-tabs" aria-label="Statut des missions">{tabs.map((status) => <button className={tab === status ? "active" : ""} type="button" key={status} onClick={() => { setTab(status); setSelected(undefined); }}><span>{status}</span><strong>{status === "Toutes" ? mine.length : mine.filter((item) => item.status === status).length}</strong></button>)}</nav>
    <button className="alert-permanent" type="button" onClick={() => setSearchParams({ "nouvelle-alerte": "1" })}><AlertTriangle/> Signaler un problème</button>
    <div className="terrain-layout"><aside className="mission-picker"><h3><Wrench/> Mes missions</h3>{displayed.map((item) => <button className={item.id === mission?.id ? "active" : ""} key={item.id} onClick={() => setSelected(item.id)}><strong>{item.title}</strong><span>{item.priority} · {item.status}</span></button>)}</aside><main className="terrain-mission">{mission ? <><div className="terrain-mission-title"><span className={`priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span><h3>{mission.title}</h3><p>{mission.description}</p><span><MapPin/> {mission.address || "Adresse à préciser"}</span></div><div className="mission-workflow"><span className={mission.status !== "À faire" ? "done" : "active"}>1 Prise en compte</span><span className={["En cours","Terminée"].includes(mission.status) ? "done" : mission.status === "Prise en compte" ? "active" : ""}>2 Commencée</span><span className={mission.status === "Terminée" ? "done" : mission.status === "En cours" ? "active" : ""}>3 Terminée</span></div><div className="terrain-actions"><button className="action-acknowledge" disabled={mission.status !== "À faire"} onClick={acknowledge}><CheckCircle2/> Prendre en compte</button><button className="action-start" disabled={mission.status !== "Prise en compte"} onClick={start}><Play/> Commencer</button><label className="terrain-file-button"><Camera/> Prendre une photo<input type="file" accept="image/*" capture="environment" multiple onChange={(event) => void addBefore(event.target.files)}/></label><details><summary><FileText/> Voir les documents</summary>{mission.attachments.length ? mission.attachments.map((attachment) => <a href={attachment.dataUrl} download={attachment.name} key={attachment.id}>{attachment.name}</a>) : <p>Aucun document joint.</p>}</details><button className="action-finish" disabled={mission.status !== "En cours"} onClick={() => setReportOpen(true)}><CheckCircle2/> Terminer la mission</button></div></> : <div className="empty-state"><CheckCircle2/><strong>Aucune mission dans cet onglet</strong><span>Changez de statut pour afficher les autres missions.</span></div>}</main></div>
    {reportOpen && <div className="modal-backdrop"><div className="modal terrain-modal"><div className="modal-header"><div><span className="eyebrow">Compte rendu</span><h3>Terminer l’intervention</h3></div><button className="icon-button" onClick={() => setReportOpen(false)}>×</button></div><div className="field-form"><label>Remarque<textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Travaux réalisés, difficulté rencontrée…"/></label><label>Photos après intervention<input type="file" accept="image/*" capture="environment" multiple onChange={async (event) => setAfterPhotos(await filesToAttachments(event.target.files,"photo","après"))}/></label><label>Résultat<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option value="terminée">Intervention terminée</option><option value="nouvelle-intervention">Nouvelle intervention nécessaire</option></select></label><button className="terrain-submit" onClick={finish}>Valider le compte rendu</button></div></div></div>}
    {alertOpen && <AlertForm onClose={() => setSearchParams({})} onSubmit={(alert) => { saveAlerts([alert,...alerts]); informManagers("Nouveau signalement terrain",alert.category,"/alertes-terrain"); setSearchParams({}); }} userId={user.id}/>}
  </section>;
}

function AlertForm({onClose,onSubmit,userId}:{onClose():void;onSubmit(value:FieldAlert):void;userId:string}) {
  const [form,setForm]=useState({category:"Voirie" as FieldAlert["category"],comment:"",address:"",latitude:undefined as number|undefined,longitude:undefined as number|undefined,photos:[] as FieldAlert["photos"]});
  const [geo,setGeo]=useState("");
  const locate=()=>{setGeo("Localisation en cours…");navigator.geolocation?.getCurrentPosition((position)=>{setForm({...form,latitude:position.coords.latitude,longitude:position.coords.longitude});setGeo("Position ajoutée");},()=>setGeo("Localisation refusée ou indisponible."));};
  return <div className="modal-backdrop"><div className="modal terrain-modal"><div className="modal-header"><div><span className="eyebrow">Alerte terrain</span><h3>Signaler un problème</h3></div><button className="icon-button" onClick={onClose}>×</button></div><form className="field-form" onSubmit={(event)=>{event.preventDefault();onSubmit({...form,id:makeId("alerte"),status:"Nouveau",createdBy:userId,createdAt:new Date().toISOString()});}}><label>Catégorie<select value={form.category} onChange={(event)=>setForm({...form,category:event.target.value as FieldAlert["category"]})}><option>Voirie</option><option>Bâtiment</option><option>Espaces verts</option><option>Eau</option><option>Sécurité</option><option>Autre</option></select></label><label>Photo(s)<input type="file" accept="image/*" capture="environment" multiple onChange={async (event)=>setForm({...form,photos:await filesToAttachments(event.target.files,"photo")})}/></label><label>Quelques mots<textarea required rows={3} value={form.comment} onChange={(event)=>setForm({...form,comment:event.target.value})}/></label><label>Adresse<input value={form.address} onChange={(event)=>setForm({...form,address:event.target.value})}/></label><button type="button" className="secondary-button" onClick={locate}><MapPin/> Utiliser ma position</button>{geo&&<small>{geo}</small>}<button className="terrain-submit">Envoyer à la mairie</button></form></div></div>;
}
