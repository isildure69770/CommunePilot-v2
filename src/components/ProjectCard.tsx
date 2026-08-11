import { Link } from "react-router-dom";

export interface Project {
  id: number;
  title: string;
  category: string;
  manager: string;
  status: "À traiter" | "En cours" | "Terminé";
  priority: "Basse" | "Normale" | "Haute";
  deadline: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusClass = project.status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "-");

  const priorityClass = project.priority
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="project-category">{project.category}</span>

        <span className={`priority-badge priority-${priorityClass}`}>
          {project.priority}
        </span>
      </div>

      <h3>{project.title}</h3>

      <div className="project-details">
        <p>
          <strong>Responsable :</strong> {project.manager}
        </p>

        <p>
          <strong>Échéance :</strong> {project.deadline}
        </p>
      </div>

      <div className="project-card-footer">
        <span className={`status-badge status-${statusClass}`}>
          {project.status}
        </span>

        <Link
          className="project-open-link"
          to={`/dossiers/${project.id}`}
          aria-label={`Ouvrir le dossier ${project.title}`}
        >
          Ouvrir
        </Link>
      </div>
    </article>
  );
}
