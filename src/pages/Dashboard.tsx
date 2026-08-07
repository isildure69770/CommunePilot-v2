import { useMemo, useState } from "react";
import StatsGrid from "../components/StatsGrid";
import SearchBar from "../components/SearchBar";
import ProjectList from "../components/ProjectList";
import NewProjectModal from "../components/NewProjectModal";
import type { Project } from "../components/ProjectCard";

const initialProjects: Project[] = [
  {
    id: 1,
    title: "Réfection de la route des Auberges",
    category: "Voirie",
    manager: "Bernard Boulocher",
    status: "En cours",
    priority: "Haute",
    deadline: "18 août 2026",
  },
  {
    id: 2,
    title: "Entretien de la salle des fêtes",
    category: "Bâtiments",
    manager: "Service technique",
    status: "À traiter",
    priority: "Normale",
    deadline: "25 août 2026",
  },
  {
    id: 3,
    title: "Préparation du prochain conseil municipal",
    category: "Conseil municipal",
    manager: "Secrétariat",
    status: "En cours",
    priority: "Haute",
    deadline: "12 août 2026",
  },
  {
    id: 4,
    title: "Mise à jour du plan d'entretien du village",
    category: "Communication",
    manager: "Commission communication",
    status: "Terminé",
    priority: "Basse",
    deadline: "5 août 2026",
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return projects;
    }

    return projects.filter((project) =>
      [
        project.title,
        project.category,
        project.manager,
        project.status,
        project.priority,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [projects, search]);

  function handleCreateProject(project: Project) {
    setProjects((currentProjects) => [
      project,
      ...currentProjects,
    ]);
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Mairie de Montrottier
          </span>

          <h2>Tableau de bord</h2>

          <p>
            Suivez les dossiers, les priorités et les
            prochaines échéances.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          + Nouveau dossier
        </button>
      </div>

      <StatsGrid />

      <section className="projects-section">
        <div className="section-heading">
          <div>
            <h3>Projets récents</h3>
            <p>
              {filteredProjects.length} dossier
              {filteredProjects.length > 1 ? "s" : ""} affiché
              {filteredProjects.length > 1 ? "s" : ""}
            </p>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
          />
        </div>

        <ProjectList projects={filteredProjects} />
      </section>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </section>
  );
}