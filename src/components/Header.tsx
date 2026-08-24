import { Bell, LogIn, LogOut, Menu } from "lucide-react";
import { useIdentity } from "../features/access/LocalIdentityProvider";
import { azureLoginUrl, azureLogoutUrl, useAzureAuthentication } from "../features/access/useAzureAuthentication";
import { useFieldData } from "../features/field/useFieldData";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../navigation/navigationItems";

interface HeaderProps {
  onOpenMenu: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { user, users, setCurrentUser } = useIdentity();
  const azureAuthentication = useAzureAuthentication();
  const { notifications } = useFieldData();
  const unread = notifications.filter((n) => (n.userIds.length === 0 || n.userIds.includes(user.id)) && !n.readBy.includes(user.id)).length;
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
        {azureAuthentication.status === "anonymous" && <a className="azure-session azure-session-login" href={azureLoginUrl}><LogIn size={15}/> Connexion Microsoft</a>}
        {azureAuthentication.status === "authenticated" && <a className="azure-session azure-session-connected" href={azureLogoutUrl} title={`Connecté avec ${azureAuthentication.principal.userDetails}`}><span>Azure connecté</span><LogOut size={14}/></a>}
        {azureAuthentication.status === "error" && <span className="azure-session azure-session-error">Connexion Azure indisponible</span>}
        <Link className="notification-button" to="/notifications" aria-label="Notifications">
          <Bell size={19} />
          {unread > 0 && <span title={`${unread} notification(s)`} />}
        </Link>
        <div className="user-details">
          <strong>{user.firstName} {user.lastName}</strong>
          <span>{user.role} · {azureAuthentication.status === "authenticated" ? "Azure" : "mode local"}</span>
        </div>
        <select className="profile-switcher" aria-label="Simuler un profil local" value={user.id} onChange={(e) => setCurrentUser(e.target.value)}>{users.filter((u) => u.active).map((u) => <option value={u.id} key={u.id}>{u.firstName} — {u.role}</option>)}</select>
        <div className="user" aria-label={`Compte de ${user.firstName} ${user.lastName}`}>{user.firstName[0]}{user.lastName[0]}</div>
      </div>
    </header>
  );
}
