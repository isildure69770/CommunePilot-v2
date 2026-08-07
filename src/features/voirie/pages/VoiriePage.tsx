import { useState } from "react";
import { ChantierCard } from "../components/ChantierCard";
import ChantierFilters from "../components/ChantierFilters";
import ChantierForm from "../components/ChantierForm";
import { useChantiers } from "../hooks/useChantiers";
import type { Chantier } from "../types/chantier";

export default function VoiriePage() {
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

      <div className="voirie-statistics">
        <article>
          <span>Total</span>
          <strong>{statistics.total}</strong>
        </article>

        <article>
          <span>Planifiés</span>
          <strong>{statistics.planned}</strong>
        </article>

        <article>
          <span>En cours</span>
          <strong>{statistics.inProgress}</strong>
        </article>

        <article>
          <span>Urgents</span>
          <strong>{statistics.urgent}</strong>
        </article>
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
    </section>
  );
}