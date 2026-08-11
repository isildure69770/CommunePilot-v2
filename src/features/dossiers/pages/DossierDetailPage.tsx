import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { projects as defaultProjects } from "../../../data/projects";
import { loadProjects } from "../../../services/storage";
import type { Project } from "../../../types/project";
import { initialDossiers } from "../data/dossiers";
import { loadDossiers } from "../services/dossierStorage";

function formatDate(value: string) {
  const date = new Date(
    value.includes("T") ? value : `${value}T12:00:00`,
  );

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("fr-FR");
}

export default function DossierDetailPage() {
  const { id } = useParams();
  const dossierId = Number(id);
  const dossiers = loadDossiers() ?? initialDossiers;
  const projects: Project[] = loadProjects() ?? defaultProjects;
  const dossier = dossiers.find((item) => item.id === dossierId);
  const project = projects.find((item) => item.id === dossierId);
  const item = dossier ?? project;

  if (!item) {
    return (
      <section className="dossiers-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Dossier introuvable</span>
            <h2>Ce dossier n’existe plus</h2>
            <p>Il a peut-être été supprimé depuis le tableau de bord.</p>
          </div>
        </div>

        <Link className="secondary-button" to="/dossiers">
          <ArrowLeft size={16} /> Retour aux dossiers
        </Link>
      </section>
    );
  }

  return (
    <section className="dossiers-page dossier-detail-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{item.category}</span>
          <h2>{item.title}</h2>
          <p>Fiche de suivi du dossier municipal.</p>
        </div>

        <Link className="secondary-button" to="/dossiers">
          <ArrowLeft size={16} /> Tous les dossiers
        </Link>
      </div>

      <article className="dashboard-card">
        {dossier && <p>{dossier.description}</p>}

        <div className="project-details">
          <p><strong>Responsable :</strong> {item.manager}</p>
          <p><strong>Statut :</strong> {item.status}</p>
          <p><strong>Priorité :</strong> {item.priority}</p>
          <p><strong>Échéance :</strong> {formatDate(item.deadline)}</p>
          {dossier && (
            <>
              <p><strong>Créé le :</strong> {formatDate(dossier.createdAt)}</p>
              <p><strong>Mis à jour le :</strong> {formatDate(dossier.updatedAt)}</p>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
