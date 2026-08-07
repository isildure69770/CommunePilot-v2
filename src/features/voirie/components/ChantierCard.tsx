import type { Chantier } from "../types/chantier";

interface ChantierCardProps {
  chantier: Chantier;
  onEdit: (chantier: Chantier) => void;
  onDelete: (id: number) => void;
}

function formatDate(value: string) {
  if (!value) {
    return "Non définie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function createClassName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "-");
}

export function ChantierCard({
  chantier,
  onEdit,
  onDelete,
}: ChantierCardProps) {
  function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer le chantier « ${chantier.title} » ?`,
    );

    if (confirmed) {
      onDelete(chantier.id);
    }
  }

  return (
    <article className="chantier-card">
      <div className="chantier-card-header">
        <div>
          <span className="chantier-location">
            📍 {chantier.location}
          </span>

          <h3>{chantier.title}</h3>
        </div>

        <span
          className={`priority-badge priority-${createClassName(
            chantier.priority,
          )}`}
        >
          {chantier.priority}
        </span>
      </div>

      <p className="chantier-description">
        {chantier.description}
      </p>

      <div className="chantier-progress-section">
        <div className="chantier-progress-label">
          <span>Avancement</span>
          <strong>{chantier.progress} %</strong>
        </div>

        <div className="chantier-progress-track">
          <div
            className="chantier-progress-value"
            style={{ width: `${chantier.progress}%` }}
          />
        </div>
      </div>

      <div className="chantier-information-grid">
        <div>
          <span>Responsable</span>
          <strong>{chantier.manager}</strong>
        </div>

        <div>
          <span>Entreprise</span>
          <strong>{chantier.company}</strong>
        </div>

        <div>
          <span>Début</span>
          <strong>{formatDate(chantier.startDate)}</strong>
        </div>

        <div>
          <span>Fin prévue</span>
          <strong>{formatDate(chantier.endDate)}</strong>
        </div>

        <div>
          <span>Budget prévu</span>
          <strong>
            {formatCurrency(chantier.estimatedBudget)}
          </strong>
        </div>

        <div>
          <span>Coût engagé</span>
          <strong>
            {formatCurrency(chantier.actualCost)}
          </strong>
        </div>
      </div>

      <div className="chantier-card-footer">
        <span
          className={`status-badge status-${createClassName(
            chantier.status,
          )}`}
        >
          {chantier.status}
        </span>

        <div className="chantier-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onEdit(chantier)}
          >
            Modifier
          </button>

          <button
            className="danger-button"
            type="button"
            onClick={handleDelete}
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}