import { FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
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

      <p>
        <strong>Documents :</strong> {dossier.documents?.length ?? 0}
      </p>

      <div className="dossier-actions">
        <Link
          className="primary-button"
          to={`/dossiers/${dossier.id}`}
        >
          <FolderOpen size={16} /> Ouvrir
        </Link>

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
