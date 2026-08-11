import { useMemo, useState } from "react";
import RoadEquipmentForm from "./RoadEquipmentForm";
import { useRoadEquipment } from "../hooks/useRoadEquipment";
import type {
  RoadEquipment,
  RoadEquipmentFormValue,
} from "../types/roadEquipment";

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
      [item.category, item.name, item.status, item.notes, item.origin]
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
                <span>{item.latitude.toFixed(6)} · {item.longitude.toFixed(6)}</span>
                {item.osmId && <span>OSM #{item.osmId}</span>}
              </div>
              {item.notes && <p>{item.notes}</p>}
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
