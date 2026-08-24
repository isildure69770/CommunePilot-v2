import { useIdentity } from "../access/LocalIdentityProvider";
import { initialDossiers } from "../dossiers/data/dossiers";
import { loadDossiers, saveDossiers } from "../dossiers/services/dossierStorage";
import { makeId } from "./repository";
import { SyncIndicator } from "./TerrainPage";
import type { Mission } from "./types";
import { useFieldData } from "./useFieldData";

export default function FieldAlertsPage() {
  const { user } = useIdentity();
  const { alerts, missions, saveAlerts, saveMissions, alertSync, synchronizeAlerts, notify } = useFieldData();
  const update = (id: string, patch: Partial<(typeof alerts)[number]>) => {
    const now = new Date().toISOString();
    saveAlerts(alerts.map((alert) => alert.id === id ? {
      ...alert, ...patch, updatedAt: now,
      history: [...alert.history, { id: makeId("history"), at: now, userId: user.id, label: `Alerte mise à jour : ${String(patch.status ?? "modification")}` }],
    } : alert));
  };
  const transform = (id: string) => {
    const alert = alerts.find((item) => item.id === id); if (!alert) return;
    const now = new Date().toISOString();
    const mission: Mission = { id: makeId("mission"), title: `Signalement ${alert.category}`, description: alert.comment, address: alert.address, latitude: alert.latitude, longitude: alert.longitude, priority: "Normale", status: "À faire", dueDate: "", category: alert.category, dossierId: alert.dossierId, assigneeIds: [], attachments: alert.photos, reports: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée depuis une alerte" }], createdAt: now, updatedAt: now };
    saveMissions([mission, ...missions]); update(id, { status: "Transformé en mission", missionId: mission.id }); notify({ userIds: [], title: "Mission à affecter", message: mission.title, link: "/missions" });
  };
  const createDossier = (id: string) => {
    const alert = alerts.find((item) => item.id === id); if (!alert) return;
    const dossiers = loadDossiers() ?? initialDossiers; const now = new Date().toISOString(); const dossierId = Date.now();
    saveDossiers([{ id: dossierId, title: `Signalement ${alert.category}`, description: alert.comment, category: alert.category, manager: `${user.firstName} ${user.lastName}`, status: "À traiter", priority: "Normale", deadline: "", createdAt: now, updatedAt: now, documents: [] }, ...dossiers]); update(id, { dossierId, status: "Pris en compte" });
  };
  return <section>
    <div className="page-heading"><div><span className="eyebrow">Remontées du terrain</span><h2>Alertes terrain</h2><p>Traitez, rattachez ou transformez les signalements des agents.</p><SyncIndicator status={alertSync.status} error={alertSync.error} onSync={() => void synchronizeAlerts()}/></div></div>
    <div className="alert-grid">{alerts.map((alert) => <article className="alert-card" key={alert.id}><header><strong>{alert.category}</strong><span>{alert.status}</span></header><p>{alert.comment}</p><small>{alert.address || "Sans adresse"} · {new Date(alert.createdAt).toLocaleString("fr-FR")}</small>{alert.photos.length > 0 && <div className="alert-photos">{alert.photos.filter((photo) => photo.dataUrl).map((photo) => <img src={photo.dataUrl} alt="Signalement" key={photo.id}/>)}</div>}<div className="card-actions"><button onClick={() => update(alert.id, { status: "Pris en compte" })}>Prendre en compte</button><button onClick={() => transform(alert.id)} disabled={alert.status === "Transformé en mission"}>Transformer en mission</button><button onClick={() => createDossier(alert.id)}>{alert.dossierId ? `Dossier #${alert.dossierId}` : "Créer un dossier"}</button><button onClick={() => update(alert.id, { status: "Classé" })}>Classer</button></div></article>)}{alerts.length === 0 && <div className="empty-state">Aucune alerte terrain.</div>}</div>
  </section>;
}
