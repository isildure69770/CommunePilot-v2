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
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">CP</span>

        <div>
          <h2>CommunePilot</h2>
          <p>Mairie de Montrottier</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link sidebar-link-active"
                : "sidebar-link"
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}