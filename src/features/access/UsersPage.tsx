import { useState } from "react";
import { permissionMatrix } from "./permissions";
import { roles, type CommuneUser, type UserRole } from "./types";
import { userRepository } from "./userRepository";
import { useIdentity } from "./LocalIdentityProvider";

const labels = { dashboard: "Dashboard", mails: "Mails", dossiers: "Dossiers", documents: "Documents", equipements: "Voirie/équipements", missions: "Missions", signalements: "Signalements", carte: "Carte", calendrier: "Calendrier", utilisateurs: "Utilisateurs" } as const;
export default function UsersPage() {
  const identity = useIdentity(); const [users, setUsers] = useState(identity.users);
  const persist = (next: CommuneUser[]) => { setUsers(next); userRepository.save(next); };
  const update = (id: string, patch: Partial<CommuneUser>) => persist(users.map((u) => u.id === id ? { ...u, ...patch } : u));
  return <section className="admin-page"><div className="page-heading"><div><span className="eyebrow">Administration locale</span><h2>Utilisateurs et rôles</h2><p>Profils de démonstration, prêts à être remplacés par Microsoft Entra et une validation serveur.</p></div></div><div className="local-mode-notice">Mode local de développement — changer de profil teste l’interface, pas la sécurité réelle.</div><div className="user-grid">{users.map((user) => <article className="user-card" key={user.id}><div><strong>{user.firstName} {user.lastName}</strong><span>{user.email ?? user.phone ?? "Coordonnées non renseignées"}</span></div><label>Rôle<select value={user.role} onChange={(e) => update(user.id, { role: e.target.value as UserRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><label className="toggle-row"><input type="checkbox" checked={user.active} onChange={(e) => update(user.id, { active: e.target.checked })}/> Profil actif</label></article>)}</div><h3 className="section-title">Matrice des droits par défaut</h3><div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Domaine</th>{roles.map((r) => <th key={r}>{r}</th>)}</tr></thead><tbody>{Object.entries(labels).map(([domain,label]) => <tr key={domain}><th>{label}</th>{roles.map((role) => { const p = permissionMatrix[role][domain as keyof typeof labels]; const actions = [p.view&&"Voir",p.create&&"Créer",p.update&&"Modifier",p.delete&&"Supprimer"].filter(Boolean).join(" · "); return <td key={role}>{actions || "Aucun"}</td>; })}</tr>)}</tbody></table></div></section>;
}
