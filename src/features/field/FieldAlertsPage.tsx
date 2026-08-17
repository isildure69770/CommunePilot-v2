import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, MapPin, Trash2, UserRound } from "lucide-react";
import { useIdentity } from "../access/LocalIdentityProvider";
import { makeId } from "./repository";
import type { FieldAlert, Mission } from "./types";
import { useFieldData } from "./useFieldData";

export default function FieldAlertsPage() {
  const [searchParams] = useSearchParams();
  const targetAlertId = searchParams.get("alert");
  const { user, users, can } = useIdentity();
  const { alerts, missions, saveAlerts, saveMissions, notify } = useFieldData();
  const [assignment, setAssignment] = useState<Record<string, string>>(Object.fromEntries(alerts.map((alert) => [alert.id, ""])));
  const agents = users.filter((candidate) => candidate.active && candidate.role === "Agent technique");
  useEffect(() => { if (!targetAlertId) return; window.setTimeout(() => document.getElementById(`field-alert-${targetAlertId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }, [targetAlertId, alerts.length]);
  const update = (id: string, patch: Partial<FieldAlert>) => saveAlerts(alerts.map((alert) => alert.id === id ? { ...alert, ...patch, updatedAt: new Date().toISOString() } : alert));
  const remove = (alert: FieldAlert) => { if (!can("signalements", "delete") || !window.confirm("Supprimer cette fiche ? Elle restera dans l’historique.")) return; const now = new Date().toISOString(); update(alert.id, { status: "Supprimée", deletedAt: now, deletedBy: user.id }); };
  function transform(alert: FieldAlert) {
    const agentId = assignment[alert.id]; if (!agentId) { window.alert("Choisissez un agent avant de créer la mission."); return; }
    const now = new Date().toISOString();
    const mission: Mission = { id: makeId("mission"), title: `Problème ${alert.category}`, description: alert.comment, address: alert.address, latitude: alert.latitude, longitude: alert.longitude, priority: alert.priority ?? "Normale", status: "À faire", dueDate: "", category: alert.category, dossierId: alert.dossierId, assigneeIds: [agentId], attachments: alert.photos, reports: [], problems: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée et affectée depuis Problèmes terrain" }], createdAt: now, updatedAt: now };
    saveMissions([mission, ...missions]); update(alert.id, { status: "Transformé en mission", missionId: mission.id }); notify({ userIds: [agentId], title: "Nouvelle mission", message: mission.title, link: "/terrain" });
  }
  return <section className="field-alerts-page"><div className="page-heading"><div><span className="eyebrow">Voirie</span><h2>Problèmes terrain</h2><p>Qualifiez les remontées des agents, priorisez-les puis transformez-les en missions affectées.</p></div></div>
    <div className="alert-grid">{alerts.map((alert) => {
      const author = users.find((candidate) => candidate.id === alert.createdBy); const deleter = users.find((candidate) => candidate.id === alert.deletedBy); const deleted = alert.status === "Supprimée"; const done = ["Traitée", "Transformé en mission", "Classé", "Supprimée"].includes(alert.status);
      return <article id={`field-alert-${alert.id}`} className={`alert-card${targetAlertId === alert.id ? " is-map-target" : ""}`} key={alert.id}><header><span className={`alert-category ${alert.priority === "Urgente" ? "is-urgent" : ""}`}><AlertTriangle/>{alert.category}</span><span className="mission-status">{alert.status}</span></header><p>{alert.comment}</p><div className="alert-metadata"><span><MapPin/>{alert.address || (alert.latitude != null ? `${alert.latitude.toFixed(5)}, ${alert.longitude?.toFixed(5)}` : "Sans localisation")}</span><span><UserRound/>{author ? `${author.firstName} ${author.lastName}` : alert.createdBy}</span><time>{new Date(alert.createdAt).toLocaleString("fr-FR")}</time></div>
        {(alert.photos || []).length > 0 && <div className="alert-photos">{(alert.photos || []).map((photo) => <a href={photo.dataUrl} target="_blank" rel="noreferrer" key={photo.id}><img src={photo.dataUrl} alt={photo.name}/></a>)}</div>}
        {!done && <div className="alert-qualification"><label>Priorité<select value={alert.priority ?? "Normale"} onChange={(event) => update(alert.id, { priority: event.target.value as FieldAlert["priority"], status: "Pris en compte" })}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Affecter à<select value={assignment[alert.id] ?? ""} onChange={(event) => setAssignment({ ...assignment, [alert.id]: event.target.value })}><option value="">Choisir un agent…</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName}</option>)}</select></label></div>}
        {deleted && <p className="alert-history-deleted"><Trash2/> Supprimée le {new Date(alert.deletedAt || alert.updatedAt).toLocaleString("fr-FR")} par {deleter?.firstName || "un profil autorisé"}</p>}<div className="card-actions">{alert.status === "Nouveau" && <button onClick={() => update(alert.id, { status: "Pris en compte" })}><CheckCircle2/>Qualifier</button>}<button className="primary-button" onClick={() => transform(alert)} disabled={done}>{deleted ? "Fiche supprimée" : done ? "Mission créée" : "Créer et affecter la mission"}</button>{!done && <button onClick={() => update(alert.id, { status: "Classé" })}>Classer</button>}{!deleted && can("signalements", "delete") && <button className="danger-button" onClick={() => remove(alert)}><Trash2/>Supprimer la fiche</button>}</div>
      </article>;
    })}{alerts.length === 0 && <div className="empty-state"><CheckCircle2/><strong>Aucun problème terrain</strong><span>Les nouvelles alertes des agents apparaîtront ici.</span></div>}</div>
  </section>;
}
