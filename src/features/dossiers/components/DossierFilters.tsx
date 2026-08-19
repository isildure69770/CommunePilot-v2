import type {
  DossierPriority,
  DossierStatus,
} from "../types/dossier";

import type {
  DossierFilters as Filters,
} from "../hooks/useDossiers";

interface DossierFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

function DossierFilters({
  filters,
  onChange,
  onReset,
}: DossierFiltersProps) {
  function updateFilter<Key extends keyof Filters>(
    key: Key,
    value: Filters[Key],
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <section className="dossier-filters">
      <input
        type="search"
        placeholder="Rechercher un dossier..."
        value={filters.search}
        onChange={(event) =>
          updateFilter("search", event.target.value)
        }
      />

      <select
        value={filters.status}
        onChange={(event) =>
          updateFilter(
            "status",
            event.target.value as DossierStatus | "Tous",
          )
        }
      >
        <option value="Tous">Tous les statuts</option>
        <option value="À traiter">À traiter</option>
        <option value="En cours">En cours</option>
        <option value="En attente">En attente</option>
        <option value="Terminé">Terminé</option>
      </select>

      <select
        value={filters.priority}
        onChange={(event) =>
          updateFilter(
            "priority",
            event.target.value as
              | DossierPriority
              | "Toutes",
          )
        }
      >
        <option value="Toutes">Toutes les priorités</option>
        <option value="Basse">Basse</option>
        <option value="Normale">Normale</option>
        <option value="Haute">Haute</option>
        <option value="Urgente">Urgente</option>
      </select>

      <button
        className="secondary-button"
        type="button"
        onClick={onReset}
      >
        Réinitialiser
      </button>
    </section>
  );
}

export default DossierFilters;
