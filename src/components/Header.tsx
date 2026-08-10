import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { navigationItems } from "../navigation/navigationItems";

interface HeaderProps {
  onOpenMenu: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { pathname } = useLocation();
  const currentItem = navigationItems.find((item) =>
    pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(`${item.path}/`)),
  );

  return (
    <header className="header">
      <div className="header-title">
        <button className="menu-button" type="button" onClick={onOpenMenu} aria-label="Ouvrir le menu">
          <Menu size={23} />
        </button>
        <div>
          <span>Centre de Commande</span>
          <h1>{currentItem?.label ?? "CommunePilot"}</h1>
        </div>
      </div>

      <div className="header-actions">
        <button className="notification-button" type="button" aria-label="Notifications">
          <Bell size={19} />
          <span />
        </button>
        <div className="user-details">
          <strong>Bernard Boulocher</strong>
          <span>Mairie de Montrottier</span>
        </div>
        <div className="user" aria-label="Compte de Bernard Boulocher">BB</div>
      </div>
    </header>
  );
}
