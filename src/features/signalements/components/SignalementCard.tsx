import type {
  Signalement,
} from "../types/signalement";

interface SignalementCardProps {
  signalement: Signalement;

  onOpen: (
    signalement: Signalement,
  ) => void;

  onEdit: (
    signalement: Signalement,
  ) => void;

  onDelete: (id: number) => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(new Date(value));
}

function createClassName(
  value: string,
) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replaceAll(" ", "-");
}

export default function SignalementCard({
  signalement,
  onOpen,
  onEdit,
  onDelete,
}: SignalementCardProps) {
  function handleDelete() {
    const confirmed =
      window.confirm(
        `Supprimer le signalement « ${signalement.title} » ?`,
      );

    if (confirmed) {
      onDelete(signalement.id);
    }
  }

  return (
    <article className="signalement-card">
      <div className="signalement-card-header">
        <div>
          <span className="signalement-category">
            {signalement.category}
          </span>

          <h3>
            {signalement.title}
          </h3>
        </div>

        <span
          className={`priority-badge priority-${createClassName(
            signalement.priority,
          )}`}
        >
          {signalement.priority}
        </span>
      </div>

      <p className="signalement-description">
        {signalement.description}
      </p>

      <div className="signalement-meta">
        <p>
          <strong>📍 Lieu :</strong>{" "}
          {signalement.location}
        </p>

        <p>
          <strong>
            Responsable :
          </strong>{" "}
          {signalement.manager}
        </p>

        <p>
          <strong>
            Déclaré par :
          </strong>{" "}
          {signalement.reporter}
        </p>

        <p>
          <strong>Date :</strong>{" "}
          {formatDate(
            signalement.createdAt,
          )}
        </p>
      </div>

      <div className="signalement-card-footer">
        <span
          className={`status-badge status-${createClassName(
            signalement.status,
          )}`}
        >
          {signalement.status}
        </span>

        <div className="signalement-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              onOpen(signalement)
            }
          >
            Ouvrir
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              onEdit(signalement)
            }
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