import type { Dossier } from "../types/dossier";

interface DossierCardProps {
  dossier: Dossier;
  onEdit: (dossier: Dossier) => void;
  onDelete: (id: number) => void;
}

export default function DossierCard({
  dossier,
  onEdit,
  onDelete,
}: DossierCardProps) {
  return (
    <article className="dossier-card">
      <h3>{dossier.title}</h3>

      <p>{dossier.description}</p>

      <p>
        <strong>Responsable :</strong> {dossier.manager}
      </p>

      <p>
        <strong>Statut :</strong> {dossier.status}
      </p>

      <div className="dossier-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onEdit(dossier)}
        >
          Modifier
        </button>

        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(dossier.id)}
        >
          Supprimer
        </button>
      </div>
    </article>
  );
}