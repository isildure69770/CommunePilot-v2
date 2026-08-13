import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { ChantierCard } from "../components/ChantierCard";
import ChantierFilters from "../components/ChantierFilters";
import ChantierForm from "../components/ChantierForm";
import { useChantiers } from "../hooks/useChantiers";
import type { Chantier } from "../types/chantier";
import RoadEquipmentManager from "../../road-equipment/components/RoadEquipmentManager";
import RoadEquipmentIndicators from "../../road-equipment/components/RoadEquipmentIndicators";
import { useDossiers } from "../../dossiers/hooks/useDossiers";
import { normalizeDossierCategory } from "../../dossiers/dossierCategories";
import { useIdentity } from "../../access/LocalIdentityProvider";

export default function VoiriePage() {
  const { dossiers } = useDossiers();
  const { can } = useIdentity();
  const voirieDossiers = dossiers.filter(
    (dossier) => normalizeDossierCategory(dossier.category).toLocaleLowerCase("fr") === "voirie",
  );
  const {
    filteredChantiers,
    filters,
    statistics,
    setFilters,
    addChantier,
    updateChantier,
    deleteChantier,
    resetFilters,
  } = useChantiers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedChantier, setSelectedChantier] =
    useState<Chantier | null>(null);

  function openCreateForm() {
    setSelectedChantier(null);
    setIsFormOpen(true);
  }

  function openEditForm(chantier: Chantier) {
    setSelectedChantier(chantier);
    setIsFormOpen(true);
  }

  function closeForm() {
    setSelectedChantier(null);
    setIsFormOpen(false);
  }

  function handleSubmit(
    value: Omit<
      Chantier,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    if (selectedChantier) {
      updateChantier({
        ...selectedChantier,
        ...value,
      });

      return;
    }

    addChantier(value);
  }

  return (
    <section className="voirie-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Commission Voirie
          </span>

          <h2>Voirie</h2>

          <p>
            Suivez les travaux, budgets, entreprises et
            interventions sur les voies communales.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={openCreateForm}
        >
          + Nouveau chantier
        </button>
      </div>

      <RoadEquipmentIndicators />

      <section className="voirie-dossiers" aria-labelledby="voirie-dossiers-title">
        <div className="section-heading voirie-dossiers-heading">
          <div>
            <span className="eyebrow">Dossiers classés</span>
            <h3 id="voirie-dossiers-title">Dossiers Voirie</h3>
          </div>
          {can("dossiers", "view") && <Link className="secondary-button compact-button" to="/dossiers"><FolderOpen /> Accéder aux dossiers</Link>}
        </div>
        {voirieDossiers.length > 0 ? (
          <div className="voirie-dossiers-grid">
            {voirieDossiers.map((dossier) => (
              <Link className="voirie-dossier-card" to={`/dossiers/${dossier.id}`} key={dossier.id}>
                <span className="voirie-dossier-icon"><FolderOpen /></span>
                <span><strong>{dossier.title}</strong><small>{dossier.status} · {dossier.documents?.length ?? 0} document{(dossier.documents?.length ?? 0) > 1 ? "s" : ""}</small></span>
              </Link>
            ))}
          </div>
        ) : <div className="voirie-dossiers-empty"><FolderOpen /><span><strong>Aucun dossier Voirie</strong><small>Les dossiers classés « Voirie » apparaîtront automatiquement ici.</small></span></div>}
      </section>

      <div className="voirie-statistics chantier-statistics" aria-label="Indicateurs des chantiers">
        <article><span>Total chantiers</span><strong>{statistics.total}</strong></article>
        <article><span>Planifiés</span><strong>{statistics.planned}</strong></article>
        <article><span>En cours</span><strong>{statistics.inProgress}</strong></article>
        <article><span>Urgents</span><strong>{statistics.urgent}</strong></article>
      </div>

      <ChantierFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="voirie-summary">
        <strong>{filteredChantiers.length}</strong>
        <span>
          chantier
          {filteredChantiers.length > 1 ? "s" : ""} affiché
          {filteredChantiers.length > 1 ? "s" : ""}
        </span>
      </div>

      {filteredChantiers.length > 0 ? (
        <div className="chantiers-grid">
          {filteredChantiers.map((chantier) => (
            <ChantierCard
              key={chantier.id}
              chantier={chantier}
              onEdit={openEditForm}
              onDelete={deleteChantier}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Aucun chantier ne correspond aux filtres.
        </div>
      )}

      <ChantierForm
        isOpen={isFormOpen}
        chantier={selectedChantier}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <RoadEquipmentManager />
    </section>
  );
}
