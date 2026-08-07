import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Tableau de bord",
    path: "/dashboard",
    icon: "🏠",
  },
  {
    label: "Dossiers",
    path: "/dossiers",
    icon: "📁",
  },
  {
    label: "Voirie",
    path: "/voirie",
    icon: "🛣️",
  },
  {
    label: "Signalements",
    path: "/signalements",
    icon: "⚠️",
  },
  {
    label: "Conseil municipal",
    path: "/conseil-municipal",
    icon: "🏛️",
  },
  {
    label: "Bâtiments",
    path: "/batiments",
    icon: "🏢",
  },
  {
    label: "Documents",
    path: "/documents",
    icon: "📄",
  },
  {
    label: "Calendrier",
    path: "/calendrier",
    icon: "📅",
  },
  {
    label: "Paramètres",
    path: "/parametres",
    icon: "⚙️",
  },{
  label: "Carte",
  path: "/carte",
  icon: "🗺️",
},

];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>CommunePilot</h1>

        <p>Mairie de Montrottier</p>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <small>CommunePilot v2</small>
      </div>
    </aside>
  );
}