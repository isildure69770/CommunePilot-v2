import { useMemo, useState } from "react";
import RoadEquipmentForm from "./RoadEquipmentForm";
import { useRoadEquipment } from "../hooks/useRoadEquipment";
import type {
  RoadEquipment,
  RoadEquipmentFormValue,
} from "../types/roadEquipment";

function formatDate(value?: string) {
  if (!value) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(`${value}T12:00:00`));
}

function formatFileSize(size: number) {
  if (size < 1_000_000) return `${Math.max(1, Math.round(size / 1_000))} Ko`;
  return `${(size / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mo`;
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
  const [selected, setSelected] = useState<RoadEquipment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return equipment;
    return equipment.filter((item) =>
      [
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
        .includes(query),
    );
  }, [equipment, search]);

  function openCreate() {
    setSelected(null);
    setIsFormOpen(true);
  }

  function openEdit(item: RoadEquipment) {
    setSelected(item);
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

      {loading && <div className="empty-state">Chargement du référentiel…</div>}
      {error && <div className="map-warning">{error}</div>}

      {!loading && !error && (
        <div className="road-equipment-list">
          {filtered.map((item) => (
            <article key={item.id} className="road-equipment-row">
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
                <span>{item.latitude.toFixed(6)} · {item.longitude.toFixed(6)}</span>
                {item.osmId && <span>OSM #{item.osmId}</span>}
              </div>
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
                          <li key={entry.id}><time>{formatDate(entry.date)}</time>{entry.description}</li>
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
                <button className="secondary-button" type="button" onClick={() => openEdit(item)}>
                  Modifier
                </button>
                <button className="danger-button" type="button" onClick={() => handleDelete(item)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
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
      />
    </section>
  );
}
