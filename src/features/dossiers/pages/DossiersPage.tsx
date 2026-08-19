import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DossierCard from "../components/DossierCard";
import DossierFilters from "../components/DossierFilters";
import DossierForm from "../components/DossierForm";
import { useDossiers } from "../hooks/useDossiers";
import type { Dossier } from "../types/dossier";

export default function DossiersPage() {
  const [params, setParams] = useSearchParams();
  const initialCategory = params.get("commission") ?? "";
  const {
    filteredDossiers,
    filters,
    setFilters,
    addDossier,
    updateDossier,
    deleteDossier,
    resetFilters,
  } = useDossiers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] =
    useState<Dossier | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") setIsFormOpen(true);
  }, [params]);

  function openCreateForm() {
    setSelectedDossier(null);
    setIsFormOpen(true);
  }

  function openEditForm(dossier: Dossier) {
    setSelectedDossier(dossier);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setSelectedDossier(null);
    if (params.get("new")) { params.delete("new"); setParams(params, { replace: true }); }
  }

  function handleSubmit(
    value: Omit<
      Dossier,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    if (selectedDossier) {
      updateDossier({
        ...selectedDossier,
        ...value,
      });

      return;
    }

    addDossier(value);
  }

  return (
    <section className="dossiers-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Gestion municipale
          </span>

          <h2>Dossiers</h2>

          <p>
            Retrouvez ici les dossiers sans catégorie métier.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={openCreateForm}
        >
          + Nouveau dossier
        </button>
      </div>

      <DossierFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="dossiers-summary">
        <strong>{filteredDossiers.length}</strong>
        <span>
          dossier
          {filteredDossiers.length > 1 ? "s" : ""} affiché
          {filteredDossiers.length > 1 ? "s" : ""}
        </span>
      </div>

      {filteredDossiers.length > 0 ? (
        <div className="dossiers-grid">
          {filteredDossiers.map((dossier) => (
            <DossierCard
              key={dossier.id}
              dossier={dossier}
              onEdit={openEditForm}
              onDelete={deleteDossier}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Aucun dossier non classé ne correspond aux filtres.
        </div>
      )}

      <DossierForm
        isOpen={isFormOpen}
        dossier={selectedDossier}
        onClose={closeForm}
        onSubmit={handleSubmit}
        initialCategory={initialCategory}
      />
    </section>
  );
}
