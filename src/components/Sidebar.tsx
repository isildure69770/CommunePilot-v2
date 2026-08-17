import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "../navigation/navigationItems";
import { useIdentity } from "../features/access/LocalIdentityProvider";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, can } = useIdentity();
  const agentPaths = new Set(["/calendrier", "/carte", "/parametres"]);
  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? "is-visible" : ""}`}
        type="button"
        aria-label="Fermer la navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-mark">CP</div>
          <div>
            <h1>CommunePilot</h1>
            <p>Mairie de Montrottier</p>
          </div>
          <button className="sidebar-close" type="button" onClick={onClose} aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navigationItems.map((item) => {
            if (user.role === "Agent technique" && !agentPaths.has(item.path)) return null;
            if ("domain" in item && !can(item.domain)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                <Icon className="sidebar-icon" size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>CommunePilot v2</span>
        </div>
      </aside>
    </>
  );
}
