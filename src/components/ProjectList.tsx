import ProjectCard, {
  type Project,
} from "./ProjectCard";

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({
  projects,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        Aucun dossier ne correspond à la recherche.
      </div>
    );
  }

  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}
    </div>
  );
}