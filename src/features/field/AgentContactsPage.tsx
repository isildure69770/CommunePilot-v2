import { ArrowLeft, Mail, Phone, ShieldAlert, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useIdentity } from "../access/LocalIdentityProvider";

export default function AgentContactsPage() {
  const { users } = useIdentity();
  const contacts = users.filter((user) => user.active && ["Maire et adjoints", "Conseillers municipaux"].includes(user.group));
  return <section className="agent-contacts-page">
    <Link className="agent-page-back" to="/terrain"><ArrowLeft/>Retour aux missions</Link>
    <header><span><ShieldAlert/></span><div><p>En cas de problème</p><h2>Contacts des élus</h2><small>Accès rapide au téléphone et à l’adresse e-mail.</small></div></header>
    <div className="agent-contact-list">{contacts.map((contact) => <article key={contact.id}>
      <span className="agent-contact-avatar">{contact.thumbnailUrl ? <img src={contact.thumbnailUrl} alt=""/> : <UserRound/>}</span>
      <div><strong>{contact.firstName} {contact.lastName}</strong><small>{contact.jobTitle || contact.group}</small></div>
      <div className="agent-contact-actions">
        {contact.phone ? <a href={`tel:${contact.phone.replace(/\s/g, "")}`}><Phone/>Appeler<span>{contact.phone}</span></a> : <span className="is-missing"><Phone/>Téléphone à compléter</span>}
        {contact.email ? <a href={`mailto:${contact.email}`}><Mail/>Écrire<span>{contact.email}</span></a> : <span className="is-missing"><Mail/>E-mail à compléter</span>}
      </div>
    </article>)}</div>
  </section>;
}
