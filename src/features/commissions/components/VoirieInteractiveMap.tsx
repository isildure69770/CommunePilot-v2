import { useState, type FormEvent } from "react";
import { ClipboardList, MapPin, TriangleAlert, Wrench } from "lucide-react";
import CommuneMap from "../../map/components/CommuneMap";
import { useCommuneMap } from "../../map/hooks/useCommuneMap";
import SignalementForm from "../../signalements/components/SignalementForm";
import { useSignalements } from "../../signalements/hooks/useSignalements";
import type { Signalement } from "../../signalements/types/signalement";
import ChantierForm from "../../voirie/components/ChantierForm";
import { useChantiers } from "../../voirie/hooks/useChantiers";
import type { Chantier } from "../../voirie/types/chantier";
import { useFieldData } from "../../field/useFieldData";
import { makeId } from "../../field/repository";
import type { Mission, MissionPriority } from "../../field/types";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { useDossiers } from "../../dossiers/hooks/useDossiers";
import { isInCommission, getCommissionById } from "../commissions";

interface SelectedPosition { latitude: number; longitude: number; location?: string }

export default function VoirieInteractiveMap() {
  const { user, users, can } = useIdentity();
  const { dossiers } = useDossiers();
  const { markers, refresh } = useCommuneMap();
  const { addSignalement } = useSignalements();
  const { addChantier } = useChantiers();
  const { missions, saveMissions, notify } = useFieldData();
  const [position, setPosition] = useState<SelectedPosition | null>(null);
  const [creation, setCreation] = useState<"signalement" | "chantier" | "mission" | null>(null);
  const [mission, setMission] = useState({ title: "", description: "", priority: "Normale" as MissionPriority, dueDate: "", assigneeIds: [] as string[], dossierId: "" });
  const agents = users.filter((candidate) => candidate.active && candidate.role === "Agent technique");
  const voirie = getCommissionById("voirie")!;
  const voirieDossiers = dossiers.filter((dossier) => isInCommission(dossier.category, voirie));

  function openCreation(kind: "signalement" | "chantier" | "mission") {
    const resource = kind === "signalement" ? "signalements" : kind === "mission" ? "missions" : "equipements";
    if (!can(resource, "create")) { window.alert("Vous n’avez pas l’autorisation de créer cet élément."); return; }
    setCreation(kind);
  }

  function refreshMap() { window.setTimeout(refresh, 60); }

  function createSignalement(value: Omit<Signalement, "id" | "createdAt" | "updatedAt">) {
    addSignalement(value); setCreation(null); setPosition(null); refreshMap();
  }

  function createChantier(value: Omit<Chantier, "id" | "createdAt" | "updatedAt">) {
    addChantier(value); setCreation(null); setPosition(null); refreshMap();
  }

  function createMission(event: FormEvent) {
    event.preventDefault();
    if (!position || !mission.title.trim() || !mission.description.trim() || !mission.assigneeIds.length) return;
    const now = new Date().toISOString();
    const value: Mission = { id: makeId("mission"), title: mission.title.trim(), description: mission.description.trim(), address: position.location ?? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`, latitude: position.latitude, longitude: position.longitude, priority: mission.priority, status: "À faire", dueDate: mission.dueDate, category: "Voirie", dossierId: mission.dossierId ? Number(mission.dossierId) : undefined, assigneeIds: mission.assigneeIds, attachments: [], reports: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée depuis la carte Voirie" }], createdAt: now, updatedAt: now };
    saveMissions([value, ...missions]);
    notify({ userIds: mission.assigneeIds, title: "Nouvelle mission Voirie", message: value.title, link: "/terrain" });
    setMission({ title: "", description: "", priority: "Normale", dueDate: "", assigneeIds: [], dossierId: "" }); setCreation(null); setPosition(null);
  }

  return <section className="commission-panel commission-map commission-voirie-map" aria-labelledby="voirie-map-title">
    <header><div><span className="section-kicker">Territoire et interventions</span><h3 id="voirie-map-title">Carte Voirie</h3><p>Cliquez sur la carte pour créer une action à cet emplacement.</p></div><div className="terrain-priority-legend" aria-label="Couleurs d’urgence"><span><i className="low"/>Faible</span><span><i className="normal"/>Normale</span><span><i className="high"/>Haute</span><span><i className="urgent"/>Urgente</span></div></header>
    <CommuneMap markers={markers} height={440} compactControls showTerrainProblemsInitially selectedPosition={position} onMapClick={(latitude,longitude,location)=>setPosition({latitude,longitude,location})} onCreateAtPosition={openCreation}/>
    {position&&<div className="voirie-map-selection"><MapPin/><span><strong>Emplacement sélectionné</strong><small>{position.location ?? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`}</small></span><button type="button" onClick={()=>setPosition(null)}>Annuler</button></div>}
    <SignalementForm isOpen={creation==="signalement"} signalement={null} initialPosition={position} initialCategory="Voirie" onClose={()=>setCreation(null)} onSubmit={createSignalement}/>
    <ChantierForm isOpen={creation==="chantier"} chantier={null} initialPosition={position} onClose={()=>setCreation(null)} onSubmit={createChantier}/>
    {creation==="mission"&&position&&<div className="modal-backdrop" onMouseDown={()=>setCreation(null)}><div className="modal mission-modal" onMouseDown={(event)=>event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Depuis la carte Voirie</span><h3>Créer une mission</h3></div><button className="icon-button" type="button" onClick={()=>setCreation(null)}>×</button></div><form className="field-form" onSubmit={createMission}><div className="map-form-location"><MapPin/><span>{position.location??"Emplacement sélectionné"}</span></div><label>Titre<input autoFocus required value={mission.title} onChange={(event)=>setMission({...mission,title:event.target.value})}/></label><label>Consigne<textarea rows={3} required value={mission.description} onChange={(event)=>setMission({...mission,description:event.target.value})}/></label><div className="form-row"><label>Priorité<select value={mission.priority} onChange={(event)=>setMission({...mission,priority:event.target.value as MissionPriority})}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Échéance<input type="datetime-local" value={mission.dueDate} onChange={(event)=>setMission({...mission,dueDate:event.target.value})}/></label></div><fieldset><legend>Agents techniques</legend>{agents.map((agent)=><label className="toggle-row" key={agent.id}><input type="checkbox" checked={mission.assigneeIds.includes(agent.id)} onChange={(event)=>setMission({...mission,assigneeIds:event.target.checked?[...mission.assigneeIds,agent.id]:mission.assigneeIds.filter((id)=>id!==agent.id)})}/>{agent.firstName} {agent.lastName}</label>)}</fieldset><label>Dossier Voirie lié<select value={mission.dossierId} onChange={(event)=>setMission({...mission,dossierId:event.target.value})}><option value="">Aucun</option>{voirieDossiers.map((dossier)=><option key={dossier.id} value={dossier.id}>{dossier.title}</option>)}</select></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={()=>setCreation(null)}>Annuler</button><button className="primary-button" disabled={!mission.assigneeIds.length}><ClipboardList/>Créer et notifier {mission.assigneeIds.length > 1 ? "les agents" : "l’agent"}</button></div></form></div></div>}
    <div className="voirie-map-help"><TriangleAlert/> Problèmes terrain colorés par urgence <Wrench/> Chantiers <ClipboardList/> Missions créables au clic</div>
  </section>;
}
