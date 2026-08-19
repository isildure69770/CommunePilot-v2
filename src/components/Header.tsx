import { Bell, Menu } from "lucide-react";
import { useIdentity } from "../features/access/LocalIdentityProvider";
import { useFieldData } from "../features/field/useFieldData";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navigationItems } from "../navigation/navigationItems";

interface HeaderProps {
  onOpenMenu: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { user, users, setCurrentUser } = useIdentity();
  const { notifications } = useFieldData();
  const unread = notifications.filter((n) => (n.userIds.length === 0 || n.userIds.includes(user.id)) && !n.readBy.includes(user.id)).length;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentItem = navigationItems.find((item) =>
    pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(`${item.path}/`)),
  );

  if (user.role === "Agent technique") return <header className="header agent-app-header"><div><strong>{user.firstName} {user.lastName}</strong><span>Agent technique</span></div><select className="profile-switcher" aria-label="Changer de profil local" value={user.id} onChange={(event) => { const nextUser = users.find((candidate) => candidate.id === event.target.value); setCurrentUser(event.target.value); navigate(nextUser?.role === "Agent technique" ? "/terrain" : "/dashboard"); }}>{users.filter((candidate) => candidate.active).map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.firstName} — {candidate.role}</option>)}</select></header>;

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
        <Link className="notification-button" to="/notifications" aria-label="Notifications">
          <Bell size={19} />
          {unread > 0 && <span title={`${unread} notification(s)`} />}
        </Link>
        <div className="user-details">
          <strong>{user.firstName} {user.lastName}</strong>
          <span>{user.role} · mode local</span>
        </div>
        <select className="profile-switcher" aria-label="Simuler un profil local" value={user.id} onChange={(event) => {
          const nextUser = users.find((candidate) => candidate.id === event.target.value);
          setCurrentUser(event.target.value);
          navigate(nextUser?.role === "Agent technique" ? "/terrain" : "/dashboard");
        }}>{users.filter((u) => u.active).map((u) => <option value={u.id} key={u.id}>{u.firstName} — {u.role}</option>)}</select>
        <div className="user" aria-label={`Compte de ${user.firstName} ${user.lastName}`}>{user.firstName[0]}{user.lastName[0]}</div>
      </div>
    </header>
  );
}
