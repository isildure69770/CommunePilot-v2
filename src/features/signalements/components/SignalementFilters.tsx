import type {
  SignalementPriority,
  SignalementStatus,
} from "../types/signalement";

import type {
  SignalementFilters as Filters,
} from "../hooks/useSignalements";

interface SignalementFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

export default function SignalementFilters({
  filters,
  onChange,
  onReset,
}: SignalementFiltersProps) {
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
    <section className="signalement-filters">
      <input
        type="search"
        placeholder="Rechercher un signalement..."
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
              | SignalementStatus
              | "Tous",
          )
        }
      >
        <option value="Tous">
          Tous les statuts
        </option>
        <option value="Nouveau">Nouveau</option>
        <option value="À traiter">À traiter</option>
        <option value="En cours">En cours</option>
        <option value="En attente">
          En attente
        </option>
        <option value="Résolu">Résolu</option>
        <option value="Classé">Classé</option>
      </select>

      <select
        value={filters.priority}
        onChange={(event) =>
          updateFilter(
            "priority",
            event.target.value as
              | SignalementPriority
              | "Toutes",
          )
        }
      >
        <option value="Toutes">
          Toutes les priorités
        </option>
        <option value="Faible">Faible</option>
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