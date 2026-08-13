# Calendrier municipal (bloc 14)

Le calendrier repose sur `CalendarRepository`; l’implémentation actuelle persiste les événements manuels dans `localStorage` (`communepilot-calendar-events-v1`) et le journal dans `communepilot-calendar-audit-v1`. Les anciennes données absentes ou incomplètes reçoivent des valeurs de repli non destructives lors de la lecture.

Les missions, échéances de dossiers et contrôles/entretiens des équipements sont convertis en événements virtuels en lecture seule. Leur module source reste l’unique source de vérité : aucune copie n’est enregistrée dans le calendrier.

Les rappels produisent uniquement des notifications dans le centre local quand l’application est ouverte. Aucun push distant n’est simulé. Le contrat `ExternalCalendarProvider` prépare Outlook/Google, mais le provider Microsoft est désactivé. Une lecture Outlook nécessiterait `Calendar.Read`; une écriture bidirectionnelle `Calendars.ReadWrite` et un consentement explicite avant modification de la configuration MSAL. Aucune permission Graph n’est ajoutée par ce bloc.

La visibilité et les actions sont filtrées selon le profil local et la matrice de permissions. Cela protège l’interface et les routes de l’application, mais `localStorage` ne fournit ni isolation serveur ni sécurité multi-utilisateur réelle. La persistance Azure devra appliquer les mêmes règles côté API et journaliser l’identité authentifiée.

L’export ICS/CSV et l’impression utilisent les événements visibles après filtres. Le navigateur peut produire un PDF via la boîte d’impression.

## Google Calendar — phase 1, lecture seule

Le provider Google est indépendant de Microsoft Graph. Il utilise Google Identity Services dans le navigateur, sans secret client, avec un jeton d’accès conservé uniquement dans `sessionStorage`. Le mode jeton OAuth de Google Identity Services est utilisé pour cette SPA ; le navigateur ne reçoit ni code échangeable côté serveur, ni refresh token. Une future architecture avec backend pourra utiliser Authorization Code + PKCE et stocker les jetons longue durée côté serveur.

Configurer uniquement `VITE_GOOGLE_CLIENT_ID` avec l’identifiant public d’un client OAuth **Application Web**. Ne jamais versionner de secret ni de valeur réelle dans `.env.example`.

Dans Google Cloud Console :

1. Créer ou choisir un projet, puis activer **Google Calendar API**.
2. Configurer l’écran de consentement OAuth, les informations de l’application et les utilisateurs de test si l’application est encore en mode test.
3. Créer un client OAuth 2.0 de type **Application Web**.
4. Ajouter aux origines JavaScript autorisées `http://localhost:5173` et, lors du déploiement, l’origine HTTPS exacte de l’application Azure. Le mode jeton GIS ne nécessite pas d’URI de redirection dédiée ; si la phase 2 adopte un flux code avec backend, ajouter alors son URI de callback HTTPS exacte.
5. Placer l’identifiant public dans `VITE_GOOGLE_CLIENT_ID` dans la configuration locale/de déploiement, puis reconstruire l’application.

Scopes exacts de la phase 1 :

- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`

La configuration et les `syncToken` sont persistés localement, tandis que les identifiants provider/calendrier/événement garantissent un upsert stable. Un token incrémental expiré (`410 Gone`) déclenche une resynchronisation complète. Les événements Google sont stockés séparément des événements locaux et sont toujours marqués en lecture seule. La déconnexion révoque le jeton de session mais conserve par défaut le dernier cache importé ; aucune erreur Google ne modifie les événements CommunePilot ou Microsoft.

La phase 2 pourra implémenter `exportEvent` derrière l’interface commune `CalendarProvider`, après ajout explicite d’un scope d’écriture et d’un backend de conservation des jetons. Aucun scope d’écriture n’est demandé actuellement.
