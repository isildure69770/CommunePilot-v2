import { FolderKanban, Gauge, Mail, MoreHorizontal, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useIdentity } from "../features/access/LocalIdentityProvider";

const mobileItems = [
  { label: "Accueil", path: "/dashboard", icon: Gauge },
  { label: "Mails", path: "/mails", icon: Mail },
];

export default function MobileNavigation({ onOpenMore }: { onOpenMore: () => void }) {
  const { user } = useIdentity();
  if (user.role === "Agent technique") return null;
  return (
    <nav className="mobile-navigation" aria-label="Navigation mobile">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={21} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
      <NavLink className="mobile-create" to="/dossiers" aria-label="Créer un dossier">
        <Plus size={27} />
        <span>Créer</span>
      </NavLink>
      <NavLink to="/dossiers" className={({ isActive }) => isActive ? "active" : ""}>
        <FolderKanban size={21} />
        <span>Dossiers</span>
      </NavLink>
      <button type="button" onClick={onOpenMore}>
        <MoreHorizontal size={21} />
        <span>Plus</span>
      </button>
    </nav>
  );
}
