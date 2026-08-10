import { FolderKanban, Gauge, Mail, Map, MoreHorizontal, TriangleAlert } from "lucide-react";
import { NavLink } from "react-router-dom";

const mobileItems = [
  { label: "Accueil", path: "/dashboard", icon: Gauge },
  { label: "Dossiers", path: "/dossiers", icon: FolderKanban },
  { label: "Alertes", path: "/signalements", icon: TriangleAlert },
  { label: "Mails", path: "/mails", icon: Mail },
  { label: "Carte", path: "/carte", icon: Map },
];

export default function MobileNavigation({ onOpenMore }: { onOpenMore: () => void }) {
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
      <button type="button" onClick={onOpenMore}>
        <MoreHorizontal size={21} />
        <span>Plus</span>
      </button>
    </nav>
  );
}
