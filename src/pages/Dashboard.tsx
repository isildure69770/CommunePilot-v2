import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileText,
  FolderKanban,
  Mail,
  Map as MapIcon,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatsGrid from "../components/StatsGrid";
import SearchBar from "../components/SearchBar";
import ProjectList from "../components/ProjectList";
import NewProjectModal from "../components/NewProjectModal";
import type { Project } from "../components/ProjectCard";
import type {
  FeatureCollection,
  Point,
} from "geojson";

import type {
  EquipmentIntervention,
} from "../features/equipments/services/equipmentInterventions";
const initialProjects: Project[] = [
  { id: 1, title: "Réfection de la route des Auberges", category: "Voirie", manager: "Bernard Boulocher", status: "En cours", priority: "Haute", deadline: "18 août 2026" },
  { id: 2, title: "Entretien de la salle des fêtes", category: "Bâtiments", manager: "Service technique", status: "À traiter", priority: "Normale", deadline: "25 août 2026" },
  { id: 3, title: "Préparation du prochain conseil municipal", category: "Conseil municipal", manager: "Secrétariat", status: "En cours", priority: "Haute", deadline: "12 août 2026" },
  { id: 4, title: "Mise à jour du plan d'entretien du village", category: "Communication", manager: "Commission communication", status: "Terminé", priority: "Basse", deadline: "5 août 2026" },
];

const deadlines = [
  { date: "12", month: "AOÛT", title: "Conseil municipal", detail: "Préparer l’ordre du jour", level: "urgent" },
  { date: "18", month: "AOÛT", title: "Route des Auberges", detail: "Validation du devis", level: "soon" },
  { date: "25", month: "AOÛT", title: "Salle des fêtes", detail: "Visite technique", level: "normal" },
];

const shortcuts = [
  { label: "Nouveau dossier", detail: "Créer et affecter", icon: FolderKanban, action: true },
  { label: "Signaler un incident", detail: "Depuis le terrain", icon: TriangleAlert, path: "/signalements" },
  { label: "Ouvrir la carte", detail: "Équipements et travaux", icon: MapIcon, path: "/carte" },
  { label: "Voir les documents", detail: "Archives municipales", icon: FileText, path: "/documents" },
];
interface RecentEquipmentIntervention
  extends EquipmentIntervention {
  equipmentId: string;
  equipmentName: string;
}
export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [
  recentInterventions,
  setRecentInterventions,
] = useState<RecentEquipmentIntervention[]>([]);

useEffect(() => {
  async function loadRecentInterventions() {
    try {
      const response = await fetch(
        "/data/montrottier/amenities.geojson",
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de charger les équipements.",
        );
      }

      const amenities =
        (await response.json()) as FeatureCollection<
          Point,
          {
            osm_id?: number;
            name?: string;
          }
        >;

      const equipmentNames =
        new Map<string, string>();

      amenities.features.forEach(
        (feature) => {
          const osmId =
            feature.properties?.osm_id;

          if (osmId === undefined) {
            return;
          }

          equipmentNames.set(
            String(osmId),
            feature.properties?.name?.trim() ||
              "Équipement communal",
          );
        },
      );

      const collected:
        RecentEquipmentIntervention[] = [];

      for (
        let index = 0;
        index < localStorage.length;
        index += 1
      ) {
        const key =
          localStorage.key(index);

        if (
          !key ||
          !key.startsWith(
            "equipment-interventions-",
          )
        ) {
          continue;
        }

        const equipmentId =
          key.replace(
            "equipment-interventions-",
            "",
          );

        const stored =
          localStorage.getItem(key);

        if (!stored) {
          continue;
        }

        try {
          const equipmentInterventions =
            JSON.parse(
              stored,
            ) as EquipmentIntervention[];

          equipmentInterventions.forEach(
            (intervention) => {
              collected.push({
                ...intervention,
                equipmentId,
                equipmentName:
                  equipmentNames.get(
                    equipmentId,
                  ) ||
                  "Équipement communal",
              });
            },
          );
        } catch {
          // Ignore une donnée locale invalide.
        }
      }

      collected.sort(
        (first, second) =>
          second.date.localeCompare(
            first.date,
          ),
      );

      setRecentInterventions(
        collected.slice(0, 5),
      );
    } catch (error) {
      console.error(
        "Erreur chargement interventions récentes :",
        error,
      );

      setRecentInterventions([]);
    }
  }

  loadRecentInterventions();

  window.addEventListener(
    "focus",
    loadRecentInterventions,
  );

  return () => {
    window.removeEventListener(
      "focus",
      loadRecentInterventions,
    );
  };
}, []);
  
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return !query ? projects : projects.filter((project) => [project.title, project.category, project.manager, project.status, project.priority].some((value) => value.toLowerCase().includes(query)));
  }, [projects, search]);

  return (
    <section className="dashboard-page">
      <div className="page-heading dashboard-heading">
        <div><span className="eyebrow">Mairie de Montrottier</span><h2>Bonjour Bernard</h2><p>Voici l’essentiel de l’activité municipale aujourd’hui.</p></div>
        <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>+ Nouveau dossier</button>
      </div>

      <StatsGrid />

      <div className="dashboard-main-grid">
        <section className="dashboard-card projects-section">
          <div className="section-heading">
            <div><h3>Projets récents</h3><p>{filteredProjects.length} dossier{filteredProjects.length > 1 ? "s" : ""} affiché{filteredProjects.length > 1 ? "s" : ""}</p></div>
            <Link className="text-link" to="/dossiers">Tous les dossiers <ArrowRight size={15} /></Link>
          </div>
          <SearchBar value={search} onChange={setSearch} />
          <ProjectList projects={filteredProjects.slice(0, 4)} />
        </section>

        <aside className="dashboard-card deadlines-card">
          <div className="section-heading"><div><h3>Prochaines échéances</h3><p>Les priorités à venir</p></div><CalendarClock size={20} /></div>
          <div className="deadline-list">{deadlines.map((item) => <article key={item.title}><div className={`deadline-date ${item.level}`}><strong>{item.date}</strong><span>{item.month}</span></div><div><h4>{item.title}</h4><p>{item.detail}</p></div></article>)}</div>
          <Link className="wide-link" to="/calendrier">Voir le calendrier <ArrowRight size={16} /></Link>
        </aside>
      </div>

      <div className="dashboard-feed-grid">
        <section className="dashboard-card activity-card">
          <div className="section-heading"><div><h3>Signalements récents</h3><p>Activité terrain</p></div><TriangleAlert size={20} /></div>
          <div className="compact-feed"><article><span className="feed-icon warning"><TriangleAlert /></span><div><strong>Nid-de-poule – Route du Rey</strong><p>Urgent · signalé aujourd’hui à 08:35</p></div></article><article><span className="feed-icon"><Building2 /></span><div><strong>Éclairage public défectueux</strong><p>À traiter · Place de l’Église</p></div></article></div>
          <Link className="text-link" to="/signalements">Voir les signalements <ArrowRight size={15} /></Link>
        </section>
        <section className="dashboard-card activity-card">
          <div className="section-heading"><div><h3>Mails récents</h3><p>2 messages à traiter</p></div><Mail size={20} /></div>
          <div className="compact-feed"><article><span className="feed-avatar">PR</span><div><strong>Dotation voirie 2026</strong><p>Préfecture du Rhône · 09:42</p></div></article><article><span className="feed-avatar">AE</span><div><strong>Réservation salle des fêtes</strong><p>Association locale · Hier</p></div></article></div>
          <Link className="text-link" to="/mails">Ouvrir les mails <ArrowRight size={15} /></Link>
        </section>
        <section className="dashboard-card activity-card">
  <div className="section-heading">
    <div>
      <h3>
        Interventions récentes
      </h3>

      <p>
        {recentInterventions.length === 0
          ? "Aucune intervention"
          : `${recentInterventions.length} intervention${
              recentInterventions.length > 1
                ? "s"
                : ""
            }`}
      </p>
    </div>

    <Wrench size={20} />
  </div>

  {recentInterventions.length === 0 ? (
    <div className="compact-feed">
      <article>
        <span className="feed-icon">
          <Wrench />
        </span>

        <div>
          <strong>
            Aucune intervention enregistrée
          </strong>

          <p>
            Les interventions créées depuis
            les fiches équipements apparaîtront ici.
          </p>
        </div>
      </article>
    </div>
  ) : (
    <div className="compact-feed">
      {recentInterventions.map(
        (intervention) => (
          <article
            key={`${intervention.equipmentId}-${intervention.id}`}
          >
            <span className="feed-icon">
              <Wrench />
            </span>

            <div>
              <strong>
                {intervention.title}
              </strong>

              <p>
                {intervention.equipmentName}
                {" · "}
                {intervention.status}
                {" · "}
                {new Date(
                  `${intervention.date}T12:00:00`,
                ).toLocaleDateString(
                  "fr-FR",
                )}
              </p>
            </div>
          </article>
        ),
      )}
    </div>
  )}

  <Link
    className="text-link"
    to="/carte"
  >
    Voir sur la carte
    <ArrowRight size={15} />
  </Link>
</section>
      </div>

      <section className="shortcuts-section"><div className="section-heading"><div><h3>Accès rapides</h3><p>Vos actions les plus courantes</p></div></div><div className="shortcut-grid">{shortcuts.map((item) => {
        const Icon = item.icon;
        const content = <><span><Icon size={21} /></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ArrowRight size={17} /></>;
        return item.action ? <button key={item.label} type="button" onClick={() => setIsModalOpen(true)}>{content}</button> : <Link key={item.label} to={item.path!}>{content}</Link>;
      })}</div></section>

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={(project) => setProjects((current) => [project, ...current])} />
    </section>
  );
}
