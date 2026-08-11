import { useMemo, useRef, useState } from "react";
import RoadEquipmentForm from "./RoadEquipmentForm";
import { useRoadEquipment } from "../hooks/useRoadEquipment";
import type {
  RoadEquipment,
  RoadEquipmentFormValue,
} from "../types/roadEquipment";
import {
  getRoadEquipmentAlerts,
  getRoadEquipmentStats,
  getRoadEquipmentTotalCost,
} from "../services/roadEquipmentTracking";
import { downloadText, roadEquipmentToCsv } from "../services/roadEquipmentExport";
import { createRoadEquipmentBackup, restoreRoadEquipmentBackup } from "../services/roadEquipmentStorage";

function formatDate(value?: string) {
  if (!value) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(`${value}T12:00:00`));
}

function formatFileSize(size: number) {
  if (size < 1_000_000) return `${Math.max(1, Math.round(size / 1_000))} Ko`;
  return `${(size / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mo`;
}

function formatCost(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export default function RoadEquipmentManager() {
  const {
    equipment,
    loading,
    error,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  } = useRoadEquipment();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [origin, setOrigin] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const backupInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<RoadEquipment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createIntervention, setCreateIntervention] = useState(false);
  const [printingId, setPrintingId] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return equipment.filter((item) => {
      const textMatches = !query || [
        item.category,
        item.name,
        item.status,
        item.notes,
        item.origin,
        item.maintenanceNotes,
        ...item.maintenanceHistory.map((entry) => entry.description),
        ...item.interventions.flatMap((intervention) => [
          intervention.title,
          intervention.status,
          intervention.details,
        ]),
        ...item.documents.map((document) => document.name),
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(query);
      const alerts = getRoadEquipmentAlerts(item);
      const totalCost = getRoadEquipmentTotalCost(item);
      const dates = [item.lastInspectionDate, item.nextInspectionDate, item.nextMaintenanceDate].filter(Boolean) as string[];
      return textMatches && (!category || item.category === category)
        && (!status || item.status === status) && (!origin || item.origin === origin)
        && (!deadline || alerts.some((alert) => alert.level === deadline))
        && (!minCost || totalCost >= Number(minCost)) && (!maxCost || totalCost <= Number(maxCost))
        && (!dateFrom || dates.some((date) => date >= dateFrom))
        && (!dateTo || dates.some((date) => date <= dateTo));
    });
  }, [category, dateFrom, dateTo, deadline, equipment, maxCost, minCost, origin, search, status]);

  const stats = useMemo(() => getRoadEquipmentStats(equipment), [equipment]);
  const categories = useMemo(() => Array.from(new Set(equipment.map((item) => item.category))).sort(), [equipment]);
  const statuses = useMemo(() => Array.from(new Set(equipment.map((item) => item.status))).sort(), [equipment]);

  function resetFilters() {
    setSearch(""); setCategory(""); setStatus(""); setOrigin(""); setDeadline("");
    setMinCost(""); setMaxCost(""); setDateFrom(""); setDateTo("");
  }

  async function importBackup(file?: File) {
    if (!file || !window.confirm("Remplacer les données locales du module par cette sauvegarde ?")) return;
    try {
      restoreRoadEquipmentBackup(JSON.parse(await file.text()));
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "Sauvegarde illisible.");
    } finally {
      if (backupInput.current) backupInput.current.value = "";
    }
  }

  function openCreate() {
    setSelected(null);
    setCreateIntervention(false);
    setIsFormOpen(true);
  }

  function openEdit(item: RoadEquipment) {
    setSelected(item);
    setCreateIntervention(false);
    setIsFormOpen(true);
  }

  function openIntervention(item: RoadEquipment) {
    setSelected(item);
    setCreateIntervention(true);
    setIsFormOpen(true);
  }

  function handleSubmit(value: RoadEquipmentFormValue) {
    if (selected) updateEquipment(selected, value);
    else addEquipment(value);
  }

  function handleDelete(item: RoadEquipment) {
    if (window.confirm(`Supprimer « ${item.name || item.category} » du référentiel ?`)) {
      deleteEquipment(item);
    }
  }

  function printEquipment(id: string) {
    setPrintingId(id);
    window.setTimeout(() => {
      window.print();
      setPrintingId("");
    }, 0);
  }

  return (
    <section className="road-equipment-manager">
      <div className="section-heading road-equipment-heading">
        <div>
          <span className="eyebrow">Référentiel communal</span>
          <h3>Équipements de voirie</h3>
          <p>
            La source OSM reste intacte. Les ajouts et corrections sont enregistrés dans CommunePilot.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>
          + Ajouter un équipement
        </button>
      </div>

      <div className="road-equipment-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par type, nom, état…"
          aria-label="Rechercher un équipement de voirie"
        />
        <span>{filtered.length} équipement{filtered.length > 1 ? "s" : ""}</span>
      </div>

      <details className="road-equipment-filter-panel">
        <summary>Filtres avancés</summary>
        <div className="road-equipment-filter-grid">
          <label>Type<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tous</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>État<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Source<select value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="">Toutes</option><option>OSM</option><option>CommunePilot</option></select></label>
          <label>Échéance<select value={deadline} onChange={(event) => setDeadline(event.target.value)}><option value="">Toutes</option><option value="overdue">En retard</option><option value="soon">Dans les 30 jours</option></select></label>
          <label>Coût minimum (€)<input type="number" min="0" value={minCost} onChange={(event) => setMinCost(event.target.value)} /></label>
          <label>Coût maximum (€)<input type="number" min="0" value={maxCost} onChange={(event) => setMaxCost(event.target.value)} /></label>
          <label>Date à partir du<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Date jusqu’au<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        </div>
        <button className="secondary-button" type="button" onClick={resetFilters}>Réinitialiser les filtres</button>
      </details>

      <section className="road-equipment-statistics" aria-label="Statistiques du patrimoine">
        <div><strong>{stats.total}</strong><span>équipements</span></div>
        <div className="stat-overdue"><strong>{stats.overdue}</strong><span>échéances en retard</span></div>
        <div className="stat-soon"><strong>{stats.soon}</strong><span>échéances proches</span></div>
        <div><strong>{formatCost(stats.totalCost)}</strong><span>coûts cumulés</span></div>
        <details><summary>Répartition par type et état</summary><div className="road-equipment-breakdown"><ul>{stats.byCategory.map(([label, count]) => <li key={label}><span>{label}</span><strong>{count}</strong></li>)}</ul><ul>{stats.byStatus.map(([label, count]) => <li key={label}><span>{label}</span><strong>{count}</strong></li>)}</ul></div></details>
      </section>

      <div className="road-equipment-data-actions">
        <button className="secondary-button" type="button" onClick={() => downloadText("patrimoine-voirie.csv", roadEquipmentToCsv(filtered), "text/csv;charset=utf-8")}>Exporter le résultat en CSV</button>
        <button className="secondary-button" type="button" onClick={() => downloadText("sauvegarde-equipements-voirie.json", JSON.stringify(createRoadEquipmentBackup(), null, 2), "application/json")}>Sauvegarder en JSON</button>
        <button className="secondary-button" type="button" onClick={() => backupInput.current?.click()}>Restaurer une sauvegarde</button>
        <input ref={backupInput} hidden type="file" accept="application/json,.json" onChange={(event) => void importBackup(event.target.files?.[0])} />
      </div>

      {loading && <div className="empty-state">Chargement du référentiel…</div>}
      {error && <div className="map-warning">{error}</div>}

      {!loading && !error && (
        <div className="road-equipment-list">
          {filtered.map((item) => {
            const alerts = getRoadEquipmentAlerts(item);
            const totalCost = getRoadEquipmentTotalCost(item);
            return (
            <article key={item.id} className={`road-equipment-row${alerts.some((alert) => alert.level === "overdue") ? " has-overdue-alert" : ""}${printingId === item.id ? " is-printing" : ""}`}>
              {item.photo && (
                <img
                  className="road-equipment-card-photo"
                  src={item.photo}
                  alt={item.name || item.category}
                  loading="lazy"
                />
              )}
              <div className="road-equipment-main">
                <div>
                  <strong>{item.name || item.category}</strong>
                  {item.name && <span>{item.category}</span>}
                </div>
                <span className={`road-equipment-source source-${item.origin.toLowerCase()}`}>
                  {item.origin === "OSM" ? "Source OSM" : "Ajout CommunePilot"}
                </span>
              </div>
              <div className="road-equipment-meta">
                <span>État : {item.status}</span>
                <span>Dernier contrôle : {formatDate(item.lastInspectionDate)}</span>
                <span>Prochain contrôle : {formatDate(item.nextInspectionDate)}</span>
                <span>Prochain entretien : {formatDate(item.nextMaintenanceDate)}</span>
                <strong>Coût cumulé : {formatCost(totalCost)}</strong>
                <span>{item.latitude.toFixed(6)} · {item.longitude.toFixed(6)}</span>
                {item.osmId && <span>OSM #{item.osmId}</span>}
              </div>
              {alerts.length > 0 && (
                <div className="road-equipment-alerts" aria-label="Échéances à surveiller">
                  {alerts.map((alert) => (
                    <span key={alert.kind} className={`road-equipment-alert alert-${alert.level}`}>
                      {alert.label} {alert.level === "overdue" ? "en retard" : "à venir"} · {formatDate(alert.date)}
                    </span>
                  ))}
                </div>
              )}
              {item.notes && <p>{item.notes}</p>}
              <details className="road-equipment-details">
                <summary>
                  Suivi et interventions
                  <span>{item.maintenanceHistory.length + item.interventions.length} entrée{item.maintenanceHistory.length + item.interventions.length > 1 ? "s" : ""}</span>
                </summary>
                <div className="road-equipment-details-content">
                  <section>
                    <strong>Entretien</strong>
                    {item.maintenanceNotes && <p>{item.maintenanceNotes}</p>}
                    {item.maintenanceHistory.length > 0 ? (
                      <ul>
                        {item.maintenanceHistory.map((entry) => (
                          <li key={entry.id}><time>{formatDate(entry.date)}</time>{entry.description}{entry.cost !== undefined && <small>{formatCost(entry.cost)}</small>}</li>
                        ))}
                      </ul>
                    ) : <span>Aucun entretien enregistré.</span>}
                  </section>
                  <section>
                    <strong>Interventions associées</strong>
                    {item.interventions.length > 0 ? (
                      <ul>
                        {item.interventions.map((intervention) => (
                          <li key={intervention.id}>
                            <div><time>{formatDate(intervention.date)}</time><b>{intervention.status}</b></div>
                            <span>{intervention.title || "Intervention"}</span>
                            {intervention.details && <small>{intervention.details}</small>}
                            {intervention.cost !== undefined && <small>Coût : {formatCost(intervention.cost)}</small>}
                          </li>
                        ))}
                      </ul>
                    ) : <span>Aucune intervention associée.</span>}
                  </section>
                </div>
              </details>
              <details className="road-equipment-details road-equipment-documents">
                <summary>
                  Documents
                  <span>{item.documents.length} document{item.documents.length > 1 ? "s" : ""}</span>
                </summary>
                <div className="road-equipment-document-view">
                  {item.documents.length > 0 ? (
                    <ul className="road-equipment-document-list">
                      {item.documents.map((document) => (
                        <li key={document.id}>
                          <div>
                            <strong>{document.name}</strong>
                            <small>{formatFileSize(document.size)} · ajouté le {formatDate(document.addedAt.slice(0, 10))}</small>
                          </div>
                          <div className="road-equipment-document-actions">
                            <a className="secondary-button" href={document.dataUrl} target="_blank" rel="noreferrer">Consulter</a>
                            <a className="secondary-button" href={document.dataUrl} download={document.name}>Télécharger</a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>Aucun document joint.</span>
                  )}
                </div>
              </details>
              <div className="road-equipment-actions">
                <button className="primary-button" type="button" onClick={() => openIntervention(item)}>
                  + Intervention
                </button>
                <button className="secondary-button" type="button" onClick={() => openEdit(item)}>
                  Modifier
                </button>
                <button className="secondary-button" type="button" onClick={() => printEquipment(item.id)}>
                  Imprimer la fiche
                </button>
                <button className="danger-button" type="button" onClick={() => handleDelete(item)}>
                  Supprimer
                </button>
              </div>
            </article>
          )})}
          {filtered.length === 0 && (
            <div className="empty-state">Aucun équipement ne correspond à la recherche.</div>
          )}
        </div>
      )}

      <RoadEquipmentForm
        isOpen={isFormOpen}
        equipment={selected}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        createIntervention={createIntervention}
      />
    </section>
  );
}
