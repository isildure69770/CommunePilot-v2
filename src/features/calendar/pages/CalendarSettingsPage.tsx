import { useState } from "react";
import { CalendarDays, RefreshCw, Unplug, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { GOOGLE_CALENDAR_SCOPES, googleCalendarProvider, googleCalendarStateRepository, type CalendarDestination } from "../providers/googleCalendarProvider";

const destinations: CalendarDestination[] = ["Général", "Voirie", "Bâtiments", "Gestion des salles", "Communication"];

export default function CalendarSettingsPage() {
  const { can } = useIdentity();
  const allowed = can("calendrier", "update");
  const [state, setState] = useState(googleCalendarStateRepository.read);
  const [connected, setConnected] = useState(googleCalendarProvider.connected);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configured = googleCalendarProvider.enabled;
  const run = async (action: () => Promise<void>) => { setBusy(true); setMessage(""); try { await action(); setState(googleCalendarStateRepository.read()); } catch (error) { setMessage(error instanceof Error ? error.message : "Une erreur Google est survenue."); } finally { setBusy(false); } };
  const connect = () => run(async () => { await googleCalendarProvider.connect(); setConnected(true); await googleCalendarProvider.listCalendars(); });
  const sync = () => run(async () => { await googleCalendarProvider.sync(); setMessage("Synchronisation terminée sans modifier les événements locaux."); });
  const update = (id: string, values: Partial<(typeof state.calendars)[number]>) => { const next = { ...state, calendars: state.calendars.map((calendar) => calendar.id === id ? { ...calendar, ...values } : calendar) }; googleCalendarStateRepository.save(next); setState(next); };
  return <section className="calendar-settings-page"><div className="page-heading"><div><span className="eyebrow">Paramètres · Calendriers connectés</span><h2>Calendriers connectés</h2><p>Choisissez les agendas externes visibles dans CommunePilot.</p></div></div>
    {can("utilisateurs", "create") && <article className="settings-user-card"><span><UserPlus/></span><div><h3>Gestion des utilisateurs</h3><p>Créer une fiche pour un élu, un conseiller ou un agent communal.</p></div><Link className="primary-button" to="/utilisateurs?new=1"><UserPlus/>Créer un utilisateur</Link></article>}
    <article className={`google-calendar-card ${connected ? "connected" : ""}`}><header><span className="google-calendar-icon"><CalendarDays /></span><div><h3>Google Calendar</h3><p>Synchronisation multi-agendas en lecture seule.</p></div><strong>{!configured ? "Configuration requise" : connected ? "Connecté" : "Déconnecté"}</strong></header>
      {!configured && <div className="calendar-config-notice"><strong>Configuration Google requise</strong><span>Ajoutez l’identifiant public OAuth dans <code>VITE_GOOGLE_CLIENT_ID</code>, puis redémarrez l’application.</span></div>}
      {!allowed && <div className="calendar-config-notice"><strong>Accès en consultation</strong><span>Votre profil peut voir les événements, mais pas connecter ni configurer un fournisseur.</span></div>}
      {allowed && configured && !connected && <button className="primary-button" disabled={busy} onClick={connect}>Connecter Google Calendar</button>}
      {connected && <><div className="google-calendar-actions"><button className="primary-button" disabled={busy} onClick={sync}><RefreshCw /> Synchroniser maintenant</button><button className="secondary-button" disabled={busy} onClick={() => { googleCalendarProvider.disconnect(false); setConnected(false); }}><Unplug /> Déconnecter</button>{state.lastSyncAt && <small>Dernière synchronisation : {new Date(state.lastSyncAt).toLocaleString("fr-FR")}</small>}</div>
        <div className="google-calendar-list">{state.calendars.map((calendar) => <article key={calendar.id}><i style={{ background: calendar.color ?? "#4285f4" }} /><div><strong>{calendar.name}{calendar.primary ? " · principal" : ""}</strong><small>{calendar.accessRole} · identifiant externe conservé</small></div><label className="toggle-row"><input type="checkbox" checked={calendar.enabled} disabled={!allowed || busy} onChange={(event) => update(calendar.id, { enabled: event.target.checked })} /> Activer</label><label>Destination<select value={calendar.destination} disabled={!allowed || busy} onChange={(event) => update(calendar.id, { destination: event.target.value as CalendarDestination })}>{destinations.map((destination) => <option key={destination}>{destination}</option>)}</select></label></article>)}</div></>}
      {message && <p className="calendar-provider-message">{message}</p>}
      <details><summary>Autorisations demandées</summary><code>{GOOGLE_CALENDAR_SCOPES.join("\n")}</code><p>Aucune permission d’écriture n’est demandée.</p></details>
    </article>
  </section>;
}
