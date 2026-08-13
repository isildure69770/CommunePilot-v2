import { useIdentity } from "../access/LocalIdentityProvider";
import { initialDossiers } from "../dossiers/data/dossiers";
import { loadDossiers, saveDossiers } from "../dossiers/services/dossierStorage";
import { makeId } from "./repository";
import type { Mission } from "./types";
import { useFieldData } from "./useFieldData";

export default function FieldAlertsPage() {
  const { user } = useIdentity();
  const { alerts, missions, saveAlerts, saveMissions, notify } = useFieldData();
  const update = (id: string, patch: Partial<(typeof alerts)[number]>) => saveAlerts(alerts.map((a) => a.id === id ? { ...a, ...patch } : a));
  const transform = (id: string) => {
    const alert = alerts.find((a) => a.id === id); if (!alert) return;
    const now = new Date().toISOString();
    const mission: Mission = { id: makeId("mission"), title: `Signalement ${alert.category}`, description: alert.comment, address: alert.address, latitude: alert.latitude, longitude: alert.longitude, priority: "Normale", status: "À faire", dueDate: "", category: alert.category, dossierId: alert.dossierId, assigneeIds: [], attachments: alert.photos, reports: [], history: [{ id: makeId("history"), at: now, userId: user.id, label: "Mission créée depuis une alerte" }], createdAt: now, updatedAt: now };
    saveMissions([mission, ...missions]); update(id, { status: "Transformé en mission", missionId: mission.id }); notify({ userIds: [], title: "Mission à affecter", message: mission.title, link: "/missions" });
  };
  const createDossier = (id: string) => {
    const alert = alerts.find((a) => a.id === id); if (!alert) return;
    const dossiers = loadDossiers() ?? initialDossiers; const now = new Date().toISOString(); const dossierId = Date.now();
    saveDossiers([{ id: dossierId, title: `Signalement ${alert.category}`, description: alert.comment, category: alert.category, manager: `${user.firstName} ${user.lastName}`, status: "À traiter", priority: "Normale", deadline: "", createdAt: now, updatedAt: now, documents: [] }, ...dossiers]); update(id, { dossierId, status: "Pris en compte" });
  };
  return <section><div className="page-heading"><div><span className="eyebrow">Remontées du terrain</span><h2>Alertes terrain</h2><p>Traitez, rattachez ou transformez les signalements des agents.</p></div></div><div className="alert-grid">{alerts.map((a) => <article className="alert-card" key={a.id}><header><strong>{a.category}</strong><span>{a.status}</span></header><p>{a.comment}</p><small>{a.address || "Sans adresse"} · {new Date(a.createdAt).toLocaleString("fr-FR")}</small>{a.photos.length > 0 && <div className="alert-photos">{a.photos.map((p) => <img src={p.dataUrl} alt="Signalement" key={p.id}/>)}</div>}<div className="card-actions"><button onClick={() => update(a.id, { status: "Pris en compte" })}>Prendre en compte</button><button onClick={() => transform(a.id)} disabled={a.status === "Transformé en mission"}>Transformer en mission</button><button onClick={() => createDossier(a.id)}>{a.dossierId ? `Dossier #${a.dossierId}` : "Créer un dossier"}</button><button onClick={() => update(a.id, { status: "Classé" })}>Classer</button></div></article>)}{alerts.length === 0 && <div className="empty-state">Aucune alerte terrain.</div>}</div></section>;
}
