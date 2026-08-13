import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronRight,
  FolderKanban,
  Mail,
  Map as MapIcon,
  Search,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatsGrid from "../components/StatsGrid";
import type { Project } from "../components/ProjectCard";
import type {
  FeatureCollection,
  Point,
} from "geojson";

import type {
  EquipmentIntervention,
} from "../features/equipments/services/equipmentInterventions";
import { useRoadEquipment } from "../features/road-equipment/hooks/useRoadEquipment";
import { getRoadEquipmentAlerts } from "../features/road-equipment/services/roadEquipmentTracking";
import { useMails } from "../features/mails/hooks/useMails";
import { useMicrosoftAuth } from "../features/mails/auth/MicrosoftAuthProvider";
import { initialDossiers } from "../features/dossiers/data/dossiers";
import { loadDossiers, saveDossiers } from "../features/dossiers/services/dossierStorage";
import DossierForm from "../features/dossiers/components/DossierForm";
import type { Dossier } from "../features/dossiers/types/dossier";
import {
  DOSSIER_CATEGORIES,
  getDossierCategorySection,
  isUncategorizedDossier,
  UNKNOWN_CATEGORY_LABEL,
} from "../features/dossiers/dossierCategories";
import { useSignalements } from "../features/signalements/hooks/useSignalements";
import { useIdentity } from "../features/access/LocalIdentityProvider";
import { useFieldData } from "../features/field/useFieldData";
import { CALENDAR_CHANGED, calendarRepository } from "../features/calendar/services/calendarRepository";
import { buildCalendarItems, canSeeCalendarItem } from "../features/calendar/services/calendarIntegration";
import { processCalendarReminders } from "../features/calendar/services/calendarNotifications";
import { COMMISSIONS, isInCommission } from "../features/commissions/commissions";

const shortcuts = [
  { label: "Mails", detail: "Boîte municipale", icon: Mail, path: "/mails", tone: "blue" },
  { label: "Dossiers", detail: "Suivi des affaires", icon: FolderKanban, path: "/dossiers", tone: "green" },
  { label: "Signalements", detail: "Demandes terrain", icon: TriangleAlert, path: "/signalements", tone: "orange" },
  { label: "Voirie", detail: "Travaux et patrimoine", icon: Wrench, path: "/voirie", tone: "violet" },
  { label: "Carte", detail: "Vue de la commune", icon: MapIcon, path: "/carte", tone: "green" },
  { label: "Terrain", detail: "Missions des agents", icon: Building2, path: "/terrain", tone: "blue" },
];
interface RecentEquipmentIntervention
  extends EquipmentIntervention {
  equipmentId: string;
  equipmentName: string;
}
export default function Dashboard() {
  const { user } = useIdentity();
  const { missions } = useFieldData();
  const { mails } = useMails();
  const { account } = useMicrosoftAuth();
  const { equipment: roadEquipment } = useRoadEquipment();
  const { signalements } = useSignalements();
  const [search, setSearch] = useState("");
  const [dossiers, setDossiers] = useState(() => loadDossiers() ?? initialDossiers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState(calendarRepository.list);
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

  useEffect(() => { processCalendarReminders(); const refresh = () => setCalendarEvents(calendarRepository.list()); window.addEventListener(CALENDAR_CHANGED, refresh); return () => window.removeEventListener(CALENDAR_CHANGED, refresh); }, []);

  useEffect(() => {
    saveDossiers(dossiers);
  }, [dossiers]);

  const categorizedProjects = useMemo(() => dossiers
    .filter((dossier) => !isUncategorizedDossier(dossier))
    .map<Project>((dossier) => ({
      id: dossier.id,
      title: dossier.title,
      category: dossier.category.trim(),
      manager: dossier.manager,
      status: dossier.status === "En attente" ? "En cours" : dossier.status,
      priority: dossier.priority === "Urgente" ? "Haute" : dossier.priority,
      deadline: dossier.deadline ? new Date(`${dossier.deadline}T12:00:00`).toLocaleDateString("fr-FR") : "Non définie",
    })), [dossiers]);
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return !query ? categorizedProjects : categorizedProjects.filter((project) => [project.title, project.category, project.manager, project.status, project.priority].some((value) => value.toLowerCase().includes(query)));
  }, [categorizedProjects, search]);
  const categorySections = useMemo(() => {
    const sectionNames = [...DOSSIER_CATEGORIES, UNKNOWN_CATEGORY_LABEL];
    return sectionNames.map((name) => ({
      name,
      projects: filteredProjects.filter((project) => getDossierCategorySection(project.category) === name),
    })).filter((section) => section.projects.length > 0);
  }, [filteredProjects]);
  const roadAlerts = useMemo(() => roadEquipment.flatMap((item) =>
    getRoadEquipmentAlerts(item).map((alert) => ({ item, alert })),
  ).sort((first, second) => first.alert.date.localeCompare(second.alert.date)), [roadEquipment]);
  const activeMails = useMemo(() => mails
    .filter((mail) => mail.status === "À traiter" || mail.status === "En cours")
    .sort((first, second) => second.receivedAt.localeCompare(first.receivedAt)), [mails]);
  const toProcessCount = mails.filter((mail) => mail.status === "À traiter").length;
  const inProgressCount = mails.filter((mail) => mail.status === "En cours").length;
  const today = new Date().toISOString().slice(0, 10);
  const inFifteenDays = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
  const overdueDossiers = dossiers.filter((dossier) => dossier.status !== "Terminé" && dossier.deadline < today);
  const calendarItems = useMemo(() => buildCalendarItems(calendarEvents, missions, dossiers, roadEquipment).filter((item) => canSeeCalendarItem(item, user)), [calendarEvents, missions, dossiers, roadEquipment, user]);
  const upcomingCalendar = calendarItems.filter((item) => item.status !== "Annulé" && item.endAt >= new Date().toISOString()).slice(0, 6);
  const upcomingInFifteenDays = calendarItems.filter((item) => item.status !== "Annulé" && item.startAt.slice(0, 10) >= today && item.startAt.slice(0, 10) <= inFifteenDays);
  const stats = [
    { title: "Mails", value: toProcessCount, tone: "blue", icon: Mail, path: "/mails", detail: account ? "Outlook connecté · à traiter" : "Message(s) à traiter" },
    { title: "Dossiers", value: dossiers.length, tone: "green", icon: FolderKanban, path: "/dossiers", detail: `${categorizedProjects.length} classé${categorizedProjects.length > 1 ? "s" : ""} · ${dossiers.length - categorizedProjects.length} non classé${dossiers.length - categorizedProjects.length > 1 ? "s" : ""}` },
    { title: "À traiter", value: signalements.filter((item) => item.status !== "Résolu" && item.status !== "Classé").length + roadAlerts.length, tone: "orange", icon: TriangleAlert, path: "/signalements", detail: "Signalements et alertes terrain" },
    { title: "Événements", value: upcomingInFifteenDays.length, tone: "violet", icon: CalendarClock, path: "/calendrier", detail: overdueDossiers.length ? `${overdueDossiers.length} échéance(s) dossier dépassée(s)` : "Dans les 15 prochains jours" },
  ];
  const commissionCards = COMMISSIONS.map((commission) => {
    const commissionDossiers = dossiers.filter((item) => isInCommission(item.category, commission));
    const commissionMissions = missions.filter((item) => isInCommission(item.category, commission));
    const commissionSignalements = signalements.filter((item) => isInCommission(item.category, commission));
    return { ...commission, active: commissionDossiers.filter((item) => item.status !== "Terminé").length, missions: commissionMissions.filter((item) => item.status !== "Terminée" && item.status !== "Annulée").length, alerts: commissionSignalements.filter((item) => item.status !== "Résolu" && item.status !== "Classé").length };
  });

  const activeSignalements = signalements
    .filter((item) => item.status !== "Résolu" && item.status !== "Classé")
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  const searchResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return [];
    return [
      ...dossiers.filter((item) => [item.title, item.category, item.manager, item.status].some((value) => value.toLocaleLowerCase("fr").includes(query))).map((item) => ({ id: `d-${item.id}`, title: item.title, detail: `Dossier · ${item.status}`, path: `/dossiers/${item.id}` })),
      ...mails.filter((item) => [item.subject, item.sender, item.status].some((value) => value.toLocaleLowerCase("fr").includes(query))).map((item) => ({ id: `m-${item.id}`, title: item.subject, detail: `Mail · ${item.sender}`, path: `/mails?mail=${item.id}` })),
      ...signalements.filter((item) => [item.title, item.location, item.category, item.status].some((value) => value.toLocaleLowerCase("fr").includes(query))).map((item) => ({ id: `s-${item.id}`, title: item.title, detail: `Signalement · ${item.location}`, path: "/signalements" })),
      ...calendarItems.filter((item) => [item.title,item.description,item.location,item.category].some((value)=>value.toLocaleLowerCase("fr").includes(query))).map((item)=>({id:`c-${item.id}`,title:item.title,detail:`Calendrier · ${new Date(item.startAt).toLocaleDateString("fr-FR")}`,path:`/calendrier?event=${item.id}`})),
    ].slice(0, 6);
  }, [dossiers, mails, search, signalements, calendarItems]);

  return (
    <section className="dashboard-page dashboard-home">
      <div className="page-heading dashboard-heading">
        <div><span className="eyebrow">Mairie de Montrottier</span><h2>Bonjour Bernard</h2><p>Voici l’essentiel de l’activité municipale aujourd’hui.</p></div>
        <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>+ Nouveau dossier</button>
      </div>

      <div className="dashboard-global-search"><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un dossier, un mail ou un signalement…" aria-label="Recherche globale" />{search && <button type="button" onClick={() => setSearch("")}>Effacer</button>}{search && <div className="dashboard-search-results">{searchResults.map((result) => <Link key={result.id} to={result.path}><div><strong>{result.title}</strong><span>{result.detail}</span></div><ArrowRight /></Link>)}{searchResults.length === 0 && <p>Aucun résultat dans les données disponibles.</p>}</div>}</div>

      <section className="commission-picker" aria-labelledby="commission-picker-title"><div className="section-heading"><div><span className="section-kicker">Espaces de travail</span><h3 id="commission-picker-title">Choisir une commission</h3><p>Accédez aux données existantes, automatiquement filtrées par commission.</p></div></div><div className="commission-picker-grid">{commissionCards.map((commission)=>{const Icon=commission.icon;return <Link className={`commission-choice commission-choice-${commission.tone}`} to={commission.route} key={commission.id}><span className="commission-choice-icon"><Icon/></span><div className="commission-choice-copy"><strong>{commission.label}</strong><small>{commission.description}</small></div><div className="commission-choice-counts"><span><b>{commission.active}</b> actif{commission.active>1?"s":""}</span><span><b>{commission.missions}</b> mission{commission.missions>1?"s":""}</span><span><b>{commission.alerts}</b> signalement{commission.alerts>1?"s":""}</span></div><ArrowRight className="commission-choice-arrow"/></Link>})}</div></section>

      <StatsGrid stats={stats} />

      <div className="dashboard-main-grid">
        <section className="dashboard-card projects-section category-dossiers-section">
          <div className="section-heading">
            <div><span className="section-kicker">Classement</span><h3>Dossiers par rubrique</h3><p>{filteredProjects.length} dossier{filteredProjects.length > 1 ? "s" : ""} classé{filteredProjects.length > 1 ? "s" : ""}</p></div>
            <Link className="text-link" to="/dossiers">{dossiers.length - categorizedProjects.length} non classé{dossiers.length - categorizedProjects.length > 1 ? "s" : ""} <ArrowRight size={15} /></Link>
          </div>
          <div className="category-dossiers-list">
            {categorySections.map((section) => (
              <section key={section.name} className={`category-dossier-group category-${section.name.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`}>
                <header><h4>{section.name}</h4><span>{section.projects.length}</span></header>
                <div className="dashboard-dossier-rows">
                  {section.projects.map((project) => (
                    <Link className="dashboard-dossier-row" to={`/dossiers/${project.id}`} key={project.id}>
                      <span className="dashboard-dossier-accent" aria-hidden="true" />
                      <div>
                        <strong>{project.title}</strong>
                        <p>{project.manager} · Échéance {project.deadline}</p>
                      </div>
                      <span className={`status-badge status-${project.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-")}`}>{project.status}</span>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
            {categorySections.length === 0 && <div className="empty-state">Aucun dossier classé dans une rubrique.</div>}
          </div>
        </section>

        <aside className="dashboard-card dashboard-recent-card">
          <div className="section-heading"><div><span className="section-kicker violet">Suivi</span><h3>Activité récente</h3><p>Dernières mises à jour enregistrées</p></div><CalendarClock size={20} /></div>
          <div className="dashboard-recent-list">
            {activeMails.slice(0, 2).map((mail) => <Link to={`/mails?mail=${mail.id}`} key={mail.id}><span className="recent-icon blue"><Mail /></span><div><strong>{mail.subject}</strong><p>{mail.sender} · {mail.status}</p></div><time>{new Date(mail.receivedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</time></Link>)}
            {activeSignalements.slice(0, 2).map((item) => <Link to="/signalements" key={item.id}><span className="recent-icon orange"><TriangleAlert /></span><div><strong>{item.title}</strong><p>{item.location} · {item.status}</p></div><time>{new Date(item.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</time></Link>)}
            {recentInterventions.slice(0, 1).map((item) => <Link to="/carte" key={item.id}><span className="recent-icon green"><Wrench /></span><div><strong>{item.title}</strong><p>{item.equipmentName} · {item.status}</p></div><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</time></Link>)}
            {activeMails.length + activeSignalements.length + recentInterventions.length === 0 && <p className="muted-copy">L’activité apparaîtra ici au fil des mises à jour.</p>}
          </div>
          <Link className="wide-link" to="/dossiers">Voir toute l’activité <ArrowRight size={16} /></Link>
        </aside>
      </div>

      <section className="shortcuts-section"><div className="section-heading"><div><span className="section-kicker green">Raccourcis</span><h3>Accès rapides</h3><p>Les fonctions les plus utiles, à portée de main.</p></div></div><div className="shortcut-grid">{shortcuts.map((item) => { const Icon = item.icon; return <Link key={item.label} className={`shortcut-${item.tone}`} to={item.path}><span><Icon /></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ArrowRight /></Link>; })}</div></section>

      <div className="dashboard-feed-grid">
        <section className="dashboard-card activity-card dashboard-calendar-card"><div className="section-heading"><div><h3>Prochains événements</h3><p>Données réelles du calendrier</p></div><CalendarClock size={20}/></div><div className="compact-feed">{upcomingCalendar.slice(0,4).map((item)=><Link to={`/calendrier?event=${item.id}`} key={item.id}><span className="feed-icon" style={{color:item.color}}><CalendarClock/></span><div><strong>{item.title}</strong><p>{new Date(item.startAt).toLocaleString("fr-FR",item.allDay?{dateStyle:"short"}:{dateStyle:"short",timeStyle:"short"})} · {item.type}</p></div></Link>)}{!upcomingCalendar.length&&<article><span className="feed-icon"><CalendarClock/></span><div><strong>Aucun événement à venir</strong><p>Créez un événement dans le calendrier municipal.</p></div></article>}</div><Link className="text-link" to="/calendrier">Ouvrir le calendrier <ArrowRight size={15}/></Link></section>
        <section className="dashboard-card activity-card road-equipment-dashboard-alerts">
          <div className="section-heading"><div><h3>Alertes patrimoine voirie</h3><p>{roadAlerts.length} priorité{roadAlerts.length > 1 ? "s" : ""} à surveiller</p></div><CalendarClock size={20} /></div>
          <div className="compact-feed">
            {roadAlerts.slice(0, 5).map(({ item, alert }) => <article key={`${item.id}-${alert.kind}`}><span className={`feed-icon ${alert.level === "overdue" ? "warning" : ""}`}><Wrench /></span><div><strong>{item.name || item.category}</strong><p>{alert.label} {alert.level === "overdue" ? "en retard" : "à échéance proche"} · {new Date(`${alert.date}T12:00:00`).toLocaleDateString("fr-FR")}</p></div></article>)}
            {roadAlerts.length === 0 && <article><span className="feed-icon"><Wrench /></span><div><strong>Aucune échéance urgente</strong><p>Contrôles et entretiens à jour sur les 30 prochains jours.</p></div></article>}
          </div>
          <Link className="text-link" to="/voirie">Gérer le patrimoine <ArrowRight size={15} /></Link>
        </section>
        <section className="dashboard-card activity-card dashboard-terrain-card">
          <div className="section-heading"><div><h3>Signalements récents</h3><p>Activité terrain réelle</p></div><TriangleAlert size={20} /></div>
          <div className="compact-feed">{activeSignalements.slice(0, 3).map((item) => <article key={item.id}><span className={`feed-icon ${item.priority === "Urgente" || item.priority === "Haute" ? "warning" : ""}`}><TriangleAlert /></span><div><strong>{item.title}</strong><p>{item.priority} · {item.location} · {item.status}</p></div></article>)}{activeSignalements.length === 0 && <article><span className="feed-icon"><Building2 /></span><div><strong>Aucun signalement actif</strong><p>Les alertes terrain apparaîtront ici.</p></div></article>}</div>
          <Link className="text-link" to="/signalements">Voir les signalements <ArrowRight size={15} /></Link>
        </section>
        <section className="dashboard-card activity-card dashboard-communications-card">
          <div className="section-heading"><div><h3>Mails récents</h3><p>{account ? `Outlook connecté · ${toProcessCount} à traiter` : `${toProcessCount} à traiter · ${inProgressCount} en cours`}</p></div><Mail size={20} /></div>
          <div className="compact-feed dashboard-mail-feed">
            {activeMails.slice(0, 3).map((mail) => <Link to={`/mails?mail=${mail.id}`} key={mail.id}><span className="feed-avatar">{mail.sender.slice(0, 2).toUpperCase()}</span><div><strong>{mail.subject}</strong><p>{mail.sender} · {mail.status}</p></div></Link>)}
            {activeMails.length === 0 && <article><span className="feed-icon"><Mail /></span><div><strong>Aucun mail en attente</strong><p>Tous les messages sont répondus ou classés.</p></div></article>}
          </div>
          <Link className="text-link" to="/mails">Ouvrir les mails <ArrowRight size={15} /></Link>
        </section>
        <section className="dashboard-card activity-card dashboard-interventions-card">
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

      <DossierForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(value) => {
        const now = new Date().toISOString();
        const dossier: Dossier = { ...value, id: Date.now(), createdAt: now, updatedAt: now };
        setDossiers((current) => [dossier, ...current]);
      }} />
    </section>
  );
}
