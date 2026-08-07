import type {
  ChantierPriority,
  ChantierStatus,
} from "../types/chantier";

import type {
  ChantierFilters as Filters,
} from "../hooks/useChantiers";

interface ChantierFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

export default function ChantierFilters({
  filters,
  onChange,
  onReset,
}: ChantierFiltersProps) {
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
    <section className="voirie-filters">
      <input
        type="search"
        placeholder="Rechercher un chantier, une voie ou une entreprise..."
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
            event.target.value as
              | ChantierStatus
              | "Tous",
          )
        }
      >
        <option value="Tous">
          Tous les statuts
        </option>

        <option value="À étudier">
          À étudier
        </option>

        <option value="Planifié">
          Planifié
        </option>

        <option value="En cours">
          En cours
        </option>

        <option value="Suspendu">
          Suspendu
        </option>

        <option value="Terminé">
          Terminé
        </option>
      </select>

      <select
        value={filters.priority}
        onChange={(event) =>
          updateFilter(
            "priority",
            event.target.value as
              | ChantierPriority
              | "Toutes",
          )
        }
      >
        <option value="Toutes">
          Toutes les priorités
        </option>

        <option value="Basse">
          Basse
        </option>

        <option value="Normale">
          Normale
        </option>

        <option value="Haute">
          Haute
        </option>

        <option value="Urgente">
          Urgente
        </option>
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