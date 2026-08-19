import { useState } from "react";
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, FileText, FolderKanban, FolderOpen, Layers3, Map, Plus, Search, TriangleAlert, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { buildCalendarItems, canSeeCalendarItem } from "../../calendar/services/calendarIntegration";
import { calendarRepository } from "../../calendar/services/calendarRepository";
import { useDossiers } from "../../dossiers/hooks/useDossiers";
import { useFieldData } from "../../field/useFieldData";
import { useCommuneMap } from "../../map/hooks/useCommuneMap";
import CommuneMap from "../../map/components/CommuneMap";
import { useRoadEquipment } from "../../road-equipment/hooks/useRoadEquipment";
import { useSignalements } from "../../signalements/hooks/useSignalements";
import { useChantiers } from "../../voirie/hooks/useChantiers";
import { getCommissionById, isInCommission, type CommissionId } from "../commissions";
import VoirieInteractiveMap from "../components/VoirieInteractiveMap";

export default function CommissionPage({ commissionId }: { commissionId: CommissionId }) {
  const [dossierSearch, setDossierSearch] = useState("");
  const [dossierSort, setDossierSort] = useState<"recent" | "name" | "deadline">("recent");
  const [voirieTab, setVoirieTab] = useState<"dossiers" | "calendar" | "missions" | "chantiers" | "signalements" | "alerts" | "resources">("dossiers");
  const commission = getCommissionById(commissionId)!;
  const { user, users, can } = useIdentity();
  const { dossiers } = useDossiers();
  const { missions, alerts } = useFieldData();
  const { signalements } = useSignalements();
  const { chantiers } = useChantiers();
  const { equipment } = useRoadEquipment();
  const { markers } = useCommuneMap();
  const scopedDossiers = dossiers.filter((item) => isInCommission(item.category, commission));
  const scopedMissions = missions.filter((item) => isInCommission(item.category, commission));
  const scopedSignalements = signalements.filter((item) => isInCommission(item.category, commission));
  const scopedAlerts = alerts.filter((item) => isInCommission(item.category, commission));
  const calendar = buildCalendarItems(calendarRepository.list(), missions, dossiers, equipment).filter((item) => canSeeCalendarItem(item, user) && isInCommission(item.category, commission));
  const upcoming = calendar.filter((item) => item.status !== "Annulé" && item.endAt >= new Date().toISOString()).slice(0, 5);
  const activeDossiers = scopedDossiers.filter((item) => item.status !== "Terminé");
  const activeMissions = scopedMissions.filter((item) => item.status !== "Terminée" && item.status !== "Annulée");
  const openSignalements = scopedSignalements.filter((item) => item.status !== "Résolu" && item.status !== "Classé");
  const activeChantiers = commission.id === "voirie" ? chantiers.filter((item) => item.status !== "Terminé") : [];
  const linkedDocuments = scopedDossiers.flatMap((item) => item.documents ?? []);
  const visibleMarkers = commission.id === "voirie" ? markers : markers.filter((marker) => marker.type === "intervention");
  const Icon = commission.icon;
  const query = encodeURIComponent(commission.category);
  const visibleDossiers = scopedDossiers
    .filter((item) => item.title.toLocaleLowerCase("fr").includes(dossierSearch.trim().toLocaleLowerCase("fr")))
    .sort((left, right) => {
      if (dossierSort === "name") return left.title.localeCompare(right.title, "fr");
      if (dossierSort === "deadline") return (left.deadline || "9999-12-31").localeCompare(right.deadline || "9999-12-31");
      return Number(right.id) - Number(left.id);
    });

  return <section className={`commission-page commission-${commission.tone}`}>
    <div className="commission-hero"><div className="commission-hero-icon"><Icon /></div><div><span className="eyebrow">Commission municipale</span><h2>{commission.label}</h2><p>{commission.description}</p></div><Link className="secondary-button" to="/dashboard"><ArrowLeft /> Toutes les commissions</Link></div>
    <div className="commission-stats">
      <article><FolderKanban/><span>Dossiers actifs</span><strong>{activeDossiers.length}</strong></article>
      {commission.id === "voirie" && <article><Wrench/><span>Chantiers en cours</span><strong>{activeChantiers.length}</strong></article>}
      <article><TriangleAlert/><span>Signalements ouverts</span><strong>{openSignalements.length}</strong></article>
      <article><ClipboardList/><span>Missions actives</span><strong>{activeMissions.length}</strong></article>
      <article><CalendarDays/><span>Prochaines échéances</span><strong>{upcoming.length}</strong></article>
    </div>
    {commission.id === "voirie" ? voirieTab === "dossiers" && <section className="commission-panel commission-dossiers-browser" aria-labelledby="voirie-dossiers-title">
      <header><div><span className="section-kicker">Explorateur de dossiers</span><h3 id="voirie-dossiers-title">Dossiers Voirie <span className="commission-dossiers-count">{scopedDossiers.length}</span></h3><p>Ouvrez un dossier pour retrouver son suivi et ses documents.</p></div>{can("dossiers","create")&&<Link className="primary-button" to={`/dossiers?commission=${query}&new=1`}><Plus/> Nouveau dossier</Link>}</header>
      {scopedDossiers.length > 6 && <div className="commission-dossiers-toolbar"><label><Search/><span className="sr-only">Rechercher un dossier Voirie</span><input type="search" value={dossierSearch} onChange={(event)=>setDossierSearch(event.target.value)} placeholder="Rechercher un dossier…"/></label><label><span className="sr-only">Trier les dossiers</span><select value={dossierSort} onChange={(event)=>setDossierSort(event.target.value as typeof dossierSort)}><option value="recent">Plus récents</option><option value="name">Nom A–Z</option><option value="deadline">Échéance</option></select></label></div>}
      {visibleDossiers.length ? <div className="commission-dossiers-grid">{visibleDossiers.map((item)=><Link className="commission-dossier-tile" data-priority={item.priority} to={`/dossiers/${item.id}`} key={item.id} aria-label={`Ouvrir le dossier ${item.title}, priorité ${item.priority}`}><span className="commission-dossier-folder"><FolderOpen/></span><span className="commission-dossier-copy"><strong>{item.title}</strong><small><span>{item.status}</span><span className="commission-dossier-priority">{item.priority}</span>{item.deadline&&<time dateTime={item.deadline}>Éch. {new Date(`${item.deadline}T12:00:00`).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</time>}</small></span><ChevronRight className="commission-dossier-arrow"/></Link>)}</div>:<div className="commission-empty"><FolderKanban/><strong>{dossierSearch ? "Aucun dossier trouvé" : "Aucun dossier Voirie"}</strong><span>{dossierSearch ? "Essayez une autre recherche." : "Les dossiers classés dans cette commission apparaîtront automatiquement ici."}</span></div>}
    </section> : <section className="commission-panel"><header><div><span className="section-kicker">Suivi</span><h3>Dossiers {commission.label}</h3></div>{can("dossiers","create")&&<Link className="primary-button" to={`/dossiers?commission=${query}&new=1`}><Plus/> Nouveau dossier</Link>}</header>{scopedDossiers.length?<div className="commission-list">{scopedDossiers.slice(0,8).map((item)=><Link to={`/dossiers/${item.id}`} key={item.id}><div><strong>{item.title}</strong><span>{item.manager} · {item.status} · échéance {item.deadline ? new Date(`${item.deadline}T12:00:00`).toLocaleDateString("fr-FR") : "non définie"}</span></div><em>{item.priority}</em></Link>)}</div>:<div className="commission-empty"><FolderKanban/><strong>Aucun dossier {commission.label}</strong><span>Les dossiers classés dans cette commission apparaîtront automatiquement ici.</span></div>}</section>}
    {commission.id === "voirie" && can("carte","view") && <VoirieInteractiveMap/>}
    {commission.id === "voirie" && <nav className="commission-work-tabs" aria-label="Rubriques Voirie">{[{id:"dossiers",label:"Dossiers",icon:FolderKanban,count:scopedDossiers.length},{id:"missions",label:"Missions",icon:ClipboardList,count:activeMissions.length},{id:"alerts",label:"Alertes terrain",icon:TriangleAlert,count:scopedAlerts.filter((item)=>!["Classé","Transformé en mission"].includes(item.status)).length},{id:"chantiers",label:"Chantiers",icon:Wrench,count:activeChantiers.length},{id:"signalements",label:"Signalements",icon:TriangleAlert,count:openSignalements.length},{id:"calendar",label:"Calendrier",icon:CalendarDays,count:upcoming.length},{id:"resources",label:"Ressources",icon:FileText,count:linkedDocuments.length}].map((tab)=>{const TabIcon=tab.icon;return <button key={tab.id} type="button" className={voirieTab===tab.id?"active":""} onClick={()=>setVoirieTab(tab.id as typeof voirieTab)}><TabIcon/><span>{tab.label}</span><strong>{tab.count}</strong></button>})}</nav>}
    <div className={commission.id === "voirie" ? "commission-tab-content" : "commission-two-columns"}>
      {(commission.id !== "voirie" || voirieTab === "calendar") && <section className="commission-panel"><header><div><span className="section-kicker">Agenda</span><h3>Calendrier et échéances</h3></div>{can("calendrier","view")&&<Link className="secondary-button" to={`/calendrier?commission=${query}`}><CalendarDays/> Ouvrir</Link>}</header>{upcoming.length?<div className="commission-list">{upcoming.map((item)=><Link to={`/calendrier?commission=${query}&event=${item.id}`} key={item.id}><i style={{background:item.color}}/><div><strong>{item.title}</strong><span>{new Date(item.startAt).toLocaleString("fr-FR", item.allDay?{dateStyle:"short"}:{dateStyle:"short",timeStyle:"short"})} · {item.type}</span></div></Link>)}</div>:<div className="commission-empty compact"><CalendarDays/><strong>Aucune échéance à venir</strong><span>Le calendrier reste disponible pour créer un événement.</span></div>}</section>}
      {(commission.id !== "voirie" || voirieTab === "missions") && <section className="commission-panel"><header><div><span className="section-kicker">Terrain</span><h3>Missions agents</h3></div>{can("missions","create")&&<Link className="secondary-button" to={`/missions?commission=${query}&new=1`}><Plus/> Créer</Link>}</header>{scopedMissions.length?<div className="commission-list">{scopedMissions.slice(0,6).map((item)=><Link to={user.role === "Agent technique"?"/terrain":"/missions"} key={item.id} data-priority={item.priority}><div><strong>{item.title}</strong><span>{item.assigneeIds.map((id)=>users.find((candidate)=>candidate.id===id)?.firstName).filter(Boolean).join(", ")||"Non affectée"} · {item.status} · {item.dueDate?new Date(item.dueDate).toLocaleDateString("fr-FR"):"sans échéance"}</span></div><em>{item.priority}</em></Link>)}</div>:<div className="commission-empty compact"><ClipboardList/><strong>Aucune mission</strong><span>Les missions classées {commission.label} apparaîtront ici.</span></div>}</section>}
    </div>
    {commission.id === "voirie" && voirieTab === "chantiers" && <section className="commission-panel commission-tab-content"><header><div><span className="section-kicker">Travaux</span><h3>Chantiers en cours</h3></div><Link className="secondary-button" to="/voirie/chantiers"><Wrench/> Gérer</Link></header>{activeChantiers.length?<div className="commission-list">{activeChantiers.slice(0,6).map((item)=><Link to="/voirie/chantiers" key={item.id} data-priority={item.priority}><div><strong>{item.title}</strong><span>{item.location} · {item.status} · {item.progress}%</span></div><em>{item.priority}</em></Link>)}</div>:<div className="commission-empty compact"><Wrench/><strong>Aucun chantier en cours</strong><span>Les chantiers Voirie utilisent toujours le module existant.</span></div>}</section>}
    {commission.id === "voirie" && voirieTab === "alerts" && <section className="commission-panel commission-tab-content"><header><div><span className="section-kicker">Remontées des agents</span><h3>Alertes terrain</h3></div><Link className="secondary-button" to="/alertes-terrain"><TriangleAlert/> Traiter les alertes</Link></header>{scopedAlerts.length?<div className="commission-list">{scopedAlerts.slice().sort((left,right)=>right.createdAt.localeCompare(left.createdAt)).slice(0,8).map((item)=><Link to="/alertes-terrain" key={item.id}><div><strong>{item.comment}</strong><span>{item.address||"Localisation non précisée"} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}</span></div><em>{item.status}</em></Link>)}</div>:<div className="commission-empty compact"><TriangleAlert/><strong>Aucune alerte terrain Voirie</strong><span>Les alertes envoyées par les agents apparaîtront automatiquement ici.</span></div>}</section>}
    <div className={commission.id === "voirie" ? "commission-tab-content" : "commission-two-columns"}>{(commission.id !== "voirie" || voirieTab === "signalements") && <section className="commission-panel"><header><div><span className="section-kicker">Demandes</span><h3>Signalements</h3></div>{can("signalements","view")&&<Link className="secondary-button" to={`/signalements?commission=${query}`}><TriangleAlert/> Ouvrir</Link>}</header>{scopedSignalements.length?<div className="commission-list">{scopedSignalements.slice(0,6).map((item)=><Link to={`/signalements?signalement=${item.id}`} key={item.id} data-priority={item.priority}><div><strong>{item.title}</strong><span>{item.location} · {item.status}</span></div><em>{item.priority}</em></Link>)}</div>:<div className="commission-empty compact"><TriangleAlert/><strong>Aucun signalement</strong><span>Aucune donnée correspondante dans le module actuel.</span></div>}</section>}{(commission.id !== "voirie" || voirieTab === "resources") && <section className="commission-panel"><header><div><span className="section-kicker">Ressources</span><h3>Documents et équipements</h3></div></header><div className="commission-resource-links"><Link to="/documents"><FileText/><span><strong>{linkedDocuments.length} document{linkedDocuments.length>1?"s":""}</strong><small>Liés aux dossiers de la commission</small></span></Link>{commission.id==="voirie"&&<Link to="/voirie/couches-metier"><Layers3/><span><strong>Couches métier</strong><small>Portions, tracés et équipements Voirie</small></span></Link>}</div>{commission.id==="salles"&&<div className="future-state"><strong>Réservations</strong><span>Aucun module de réservation n’alimente encore cet espace.</span></div>}{commission.id==="communication"&&<div className="future-state"><strong>Publications et réseaux sociaux</strong><span>Aucun outil éditorial n’est connecté ; seules les données existantes sont affichées.</span></div>}</section>}</div>
    {commission.id !== "voirie"&&can("carte","view")&&<section className="commission-panel commission-map"><header><div><span className="section-kicker">Territoire</span><h3>Carte {commission.label}</h3></div><Link className="secondary-button" to="/carte"><Map/> Carte complète</Link></header><CommuneMap markers={visibleMarkers} height={380}/></section>}
  </section>;
}
