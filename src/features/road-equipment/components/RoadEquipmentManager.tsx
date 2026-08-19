import { useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { FilePenLine, List, Map, MapPin, MoreVertical, Printer, Trash2, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import RoadEquipmentForm from "./RoadEquipmentForm";
import { useRoadEquipment } from "../hooks/useRoadEquipment";
import type {
  RoadEquipment,
  RoadEquipmentFormValue,
} from "../types/roadEquipment";
import {
  getRoadEquipmentAlerts,
  getRoadEquipmentTotalCost,
} from "../services/roadEquipmentTracking";
import { downloadText, roadEquipmentToCsv } from "../services/roadEquipmentExport";
import { createRoadEquipmentBackup, restoreRoadEquipmentBackup } from "../services/roadEquipmentStorage";
import { useIdentity } from "../../access/LocalIdentityProvider";

function formatDate(value?: string) {
  if (!value) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(`${value}T12:00:00`));
}

const EQUIPMENT_FAMILIES = [
  { label: "Signalisation & sécurité", icon: "🚧", categories: ["Barrière / portail", "Panneau de signalisation", "Borne", "Poteau incendie"] },
  { label: "Mobilier urbain", icon: "🪑", categories: ["Banc"] },
  { label: "Propreté & déchets", icon: "♻️", categories: ["Corbeille", "Point déchets"] },
  { label: "Éclairage & réseaux", icon: "💡", categories: ["Lampadaire", "Armoire technique", "Point d'eau potable"] },
  { label: "Autres aménagements", icon: "📍", categories: ["Autre"] },
] as const;

export default function RoadEquipmentManager() {
  const { can } = useIdentity();
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
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedFamily, setSelectedFamily] = useState("");

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
      const activeFamily = EQUIPMENT_FAMILIES.find((entry) => entry.label === selectedFamily);
      return textMatches && (!selectedFamily || activeFamily?.categories.includes(item.category as never)) && (!category || item.category === category)
        && (!status || item.status === status) && (!origin || item.origin === origin)
        && (!deadline || alerts.some((alert) => alert.level === deadline))
        && (!minCost || totalCost >= Number(minCost)) && (!maxCost || totalCost <= Number(maxCost))
        && (!dateFrom || dates.some((date) => date >= dateFrom))
        && (!dateTo || dates.some((date) => date <= dateTo));
    });
  }, [category, dateFrom, dateTo, deadline, equipment, maxCost, minCost, origin, search, selectedFamily, status]);

  const categories = useMemo(() => Array.from(new Set(equipment.map((item) => item.category))).sort(), [equipment]);
  const statuses = useMemo(() => Array.from(new Set(equipment.map((item) => item.status))).sort(), [equipment]);
  const families = useMemo(() => EQUIPMENT_FAMILIES.map((family) => ({
    ...family,
    count: equipment.filter((item) => (family.categories as readonly string[]).includes(item.category)).length,
  })), [equipment]);
  const mapCenter = useMemo<[number, number]>(() => filtered.length
    ? [filtered.reduce((sum, item) => sum + item.latitude, 0) / filtered.length, filtered.reduce((sum, item) => sum + item.longitude, 0) / filtered.length]
    : [45.7905, 4.4667], [filtered]);

  function resetFilters() {
    setSearch(""); setCategory(""); setSelectedFamily(""); setStatus(""); setOrigin(""); setDeadline("");
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
          <span className="eyebrow">Patrimoine communal</span>
          <h3>Équipements</h3>
          <p>Consultez et gérez les équipements par famille, en liste ou sur la carte.</p>
        </div>
        {can("equipements", "create") && <button className="primary-button" type="button" onClick={openCreate}>
          + Ajouter un équipement
        </button>}
      </div>

      <div className="equipment-family-grid" aria-label="Catégories d’équipements">
        {families.map((family) => (
          <button className={family.label === selectedFamily ? "is-active" : undefined} type="button" key={family.label} onClick={() => setSelectedFamily((current) => current === family.label ? "" : family.label)}>
            <span>{family.icon}</span><span><strong>{family.label}</strong><small>{family.count} équipement{family.count > 1 ? "s" : ""}</small></span>
          </button>
        ))}
      </div>

      <div className="road-equipment-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par type, nom, état…"
          aria-label="Rechercher un équipement de voirie"
        />
        <div className="equipment-view-switch" aria-label="Mode d’affichage">
          <button className={view === "list" ? "is-active" : ""} type="button" onClick={() => setView("list")}><List /> Liste</button>
          <button className={view === "map" ? "is-active" : ""} type="button" onClick={() => setView("map")}><Map /> Carte</button>
        </div>
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

      <div className="road-equipment-data-actions">
        <button className="secondary-button" type="button" onClick={() => downloadText("patrimoine-voirie.csv", roadEquipmentToCsv(filtered), "text/csv;charset=utf-8")}>Exporter le résultat en CSV</button>
        <button className="secondary-button" type="button" onClick={() => downloadText("sauvegarde-equipements-voirie.json", JSON.stringify(createRoadEquipmentBackup(), null, 2), "application/json")}>Sauvegarder en JSON</button>
        <button className="secondary-button" type="button" onClick={() => backupInput.current?.click()}>Restaurer une sauvegarde</button>
        <input ref={backupInput} hidden type="file" accept="application/json,.json" onChange={(event) => void importBackup(event.target.files?.[0])} />
      </div>

      {loading && <div className="empty-state">Chargement du référentiel…</div>}
      {error && <div className="map-warning">{error}</div>}

      {!loading && !error && view === "list" && (
        <div className="road-equipment-list">
          <div className="road-equipment-list-head"><span>Équipement</span><span>Emplacement</span><span>Catégorie</span><span>État</span><span>Dernier contrôle</span><span>Actions</span></div>
          {filtered.map((item) => {
            const alerts = getRoadEquipmentAlerts(item);
            return (
            <article key={item.id} className={`road-equipment-row${alerts.some((alert) => alert.level === "overdue") ? " has-overdue-alert" : ""}${printingId === item.id ? " is-printing" : ""}`}>
              <div className="equipment-cell equipment-name" data-label="Équipement"><strong>{item.name || item.category}</strong><small>{item.origin === "OSM" ? "Source OSM" : "CommunePilot"}</small></div>
              <span className="equipment-cell road-equipment-location" data-label="Emplacement"><MapPin /> {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>
              <span className="equipment-cell" data-label="Catégorie">{item.category}</span>
              <span className="equipment-cell" data-label="État"><span className="road-equipment-status">{item.status || "Non renseigné"}</span></span>
              <span className="equipment-cell" data-label="Dernier contrôle">{formatDate(item.lastInspectionDate)}</span>
              <div className="road-equipment-actions equipment-cell" data-label="Actions">
                <Link className="secondary-button equipment-open-link" to={`/equipments/${item.id}`}>Ouvrir</Link>
                <details className="equipment-action-menu"><summary aria-label={`Actions pour ${item.name || item.category}`}><MoreVertical /></summary><div>
                  {can("equipements", "update") && <button type="button" onClick={() => openIntervention(item)}><Wrench /> Intervention</button>}
                  {can("equipements", "update") && <button type="button" onClick={() => openEdit(item)}><FilePenLine /> Modifier</button>}
                  <button type="button" onClick={() => printEquipment(item.id)}><Printer /> Imprimer</button>
                  {can("equipements", "delete") && <button className="danger" type="button" onClick={() => handleDelete(item)}><Trash2 /> Supprimer</button>}
                </div></details>
              </div>
            </article>
          )})}
          {filtered.length === 0 && (
            <div className="empty-state">Aucun équipement ne correspond à la recherche.</div>
          )}
        </div>
      )}

      {!loading && !error && view === "map" && <div className="road-equipment-map">
        <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={14} scrollWheelZoom>
          <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map((item) => <CircleMarker key={item.id} center={[item.latitude, item.longitude]} radius={7} pathOptions={{ color: getRoadEquipmentAlerts(item).some((alert) => alert.level === "overdue") ? "#b42318" : "#1769aa", fillOpacity: .85 }}><Popup><strong>{item.name || item.category}</strong><br />{item.category}<br />État : {item.status || "Non renseigné"}<br /><Link to={`/equipments/${item.id}`}>Ouvrir la fiche</Link></Popup></CircleMarker>)}
        </MapContainer>
      </div>}

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
