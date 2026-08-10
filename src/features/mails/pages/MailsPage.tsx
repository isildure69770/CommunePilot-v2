import { useMemo, useState } from "react";
import { Archive, FilePlus2, Link2, Mail, Paperclip, Search } from "lucide-react";
import { sampleMails } from "../data/mails";
import type { MailStatus } from "../types/mail";

export default function MailsPage() {
  const [filter, setFilter] = useState<"Tous" | MailStatus>("Tous");
  const [search, setSearch] = useState("");
  const mails = useMemo(() => sampleMails.filter((mail) => {
    const matchesFilter = filter === "Tous" || mail.status === filter;
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || `${mail.sender} ${mail.subject} ${mail.commission ?? ""}`.toLowerCase().includes(query));
  }), [filter, search]);

  return (
    <section className="mails-page">
      <div className="page-heading">
        <div><span className="eyebrow">Correspondance municipale</span><h2>Mails</h2><p>Centralisez les messages à traiter et préparez leur classement dans les dossiers.</p></div>
        <button className="primary-button" type="button" disabled title="Connexion à la messagerie à venir">+ Nouveau mail</button>
      </div>

      <div className="mail-statistics">
        <article><Mail /><span>Messages</span><strong>{sampleMails.length}</strong></article>
        <article><Archive /><span>À traiter</span><strong>{sampleMails.filter((mail) => mail.status === "À traiter").length}</strong></article>
        <article><Paperclip /><span>Pièces jointes</span><strong>{sampleMails.reduce((total, mail) => total + mail.attachmentCount, 0)}</strong></article>
      </div>

      <div className="mail-toolbar">
        <div className="mail-filters" role="group" aria-label="Filtrer les mails">
          {(["Tous", "À traiter", "En cours", "Classé"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} type="button" onClick={() => setFilter(value)}>{value}</button>)}
        </div>
        <label className="search-bar"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un mail…" /></label>
      </div>

      <div className="mail-layout">
        <div className="mail-list">
          {mails.map((mail) => (
            <article className="mail-card" key={mail.id}>
              <div className="mail-avatar">{mail.sender.slice(0, 2).toUpperCase()}</div>
              <div className="mail-card-content">
                <div className="mail-card-heading"><strong>{mail.sender}</strong><time>{mail.receivedAt}</time></div>
                <h3>{mail.subject}</h3><p>{mail.preview}</p>
                <div className="mail-meta"><span className={`mail-status status-${mail.status.toLowerCase().replace("à", "a").replace(" ", "-")}`}>{mail.status}</span>{mail.commission && <span>{mail.commission}</span>}{mail.attachmentCount > 0 && <span><Paperclip size={14} /> {mail.attachmentCount}</span>}</div>
              </div>
            </article>
          ))}
          {mails.length === 0 && <div className="empty-state">Aucun mail ne correspond à votre recherche.</div>}
        </div>
        <aside className="mail-actions-panel">
          <span className="eyebrow">Architecture prête</span><h3>Actions à venir</h3><p>Ces fonctions seront activées lors du raccordement sécurisé à la messagerie.</p>
          <div><span><FilePlus2 />Créer un dossier depuis un mail</span><span><Link2 />Associer à un dossier existant</span><span><Archive />Classer par commission</span><span><Paperclip />Centraliser les pièces jointes</span></div>
        </aside>
      </div>
    </section>
  );
}
