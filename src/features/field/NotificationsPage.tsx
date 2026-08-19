import { Link } from "react-router-dom";
import { useIdentity } from "../access/LocalIdentityProvider";
import { notificationRepository } from "./repository";
import { useFieldData } from "./useFieldData";

export default function NotificationsPage() {
  const { user } = useIdentity(); const { notifications } = useFieldData();
  const mine = notifications.filter((n) => n.userIds.length === 0 || n.userIds.includes(user.id));
  const markAllRead = () => notificationRepository.save(notifications.map((n) => mine.some((item) => item.id === n.id) && !n.readBy.includes(user.id) ? { ...n, readBy: [...n.readBy, user.id] } : n));
  return <section><div className="page-heading"><div><span className="eyebrow">Centre local</span><h2>Notifications</h2><p>Informations enregistrées sur cet appareil uniquement.</p></div><button className="secondary-button" onClick={markAllRead}>Tout marquer comme lu</button></div><div className="mission-grid">{mine.map((n) => <Link className="mission-card" to={n.link} key={n.id}><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString("fr-FR")}</small></Link>)}{mine.length === 0 && <div className="empty-state">Aucune notification.</div>}</div></section>;
}
