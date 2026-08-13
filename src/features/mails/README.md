# Mails — blocs 12.9 et 12.10

Le mode local 12.9 reste disponible sans compte Microsoft. Le bloc 12.10 ajoute un adaptateur Microsoft Graph sans déplacer les données métier ni enregistrer manuellement de mot de passe ou de jeton.

## Configuration Microsoft Entra

1. Dans **Microsoft Entra admin center > App registrations**, créer une inscription.
2. Pour Outlook.com/Hotmail et les organisations, sélectionner **Accounts in any organizational directory and personal Microsoft accounts**. Pour limiter à une organisation, utiliser son tenant et remplacer `common`.
3. Dans **Authentication > Add a platform**, choisir **Single-page application**.
4. Ajouter exactement les URI utilisées : `http://localhost:5173` en développement et l’origine HTTPS de production. Elles doivent correspondre à `VITE_MICROSOFT_REDIRECT_URI` (ou à `window.location.origin` si la variable est omise).
5. Dans **API permissions > Microsoft Graph > Delegated permissions**, ajouter uniquement `User.Read` et `Mail.Read`. Aucun droit d’application ni consentement administrateur n’est normalement requis pour un compte personnel ; la politique du tenant peut toutefois l’imposer.
6. Copier l’**Application (client) ID**, jamais un secret, dans un fichier `.env.local` créé depuis `.env.example`.
7. Ne créer ni client secret ni certificat pour cette SPA. MSAL utilise Authorization Code avec PKCE et reste seul responsable de son cache de session. Au retour OAuth, `main.tsx` détecte la réponse et utilise le redirect bridge officiel de MSAL 5 ; la page principale traite ensuite ce retour une seule fois avec `handleRedirectPromise()`.

Redémarrer Vite après toute modification des variables. Les fichiers `.env*` sont ignorés, sauf `.env.example`.

## Architecture et stockage

- `auth/` configure MSAL et expose la connexion, la déconnexion et l’acquisition silencieuse de jeton.
- `providers/mailProvider.ts` est le contrat indépendant du fournisseur pour permettre un futur adaptateur Gmail.
- `providers/microsoftGraphMailProvider.ts` convertit les messages Graph et récupère les métadonnées de pièces jointes. Le contenu d’une pièce jointe n’est demandé qu’au clic sur **Télécharger**.
- `providers/MailSyncProvider.tsx` orchestre première page, pages suivantes et synchronisation.
- `services/mailRepository.ts` reste la source persistante commune au module et au Dashboard.

La fusion utilise l’identifiant Microsoft `externalId`. Elle actualise les champs provenant du message mais conserve durablement `status`, `commission`, `category`, `dossierId`, `summary`, `internalNotes` et `followUps`. Les mails locaux et les messages distants absents d’une page ne sont jamais supprimés.

## Suppression

Avec les permissions actuelles (`Mail.Read`), **Supprimer** retire uniquement la copie locale de CommunePilot. Pour un message Outlook, son identifiant est conservé dans une liste locale d’exclusion afin qu’une synchronisation ne le fasse pas réapparaître. Le message reste dans Outlook et les pièces jointes déjà copiées comme documents de dossier restent intactes, car leur stockage est indépendant du cache des mails.

Une suppression réelle dans la boîte Microsoft nécessiterait la permission déléguée `Mail.ReadWrite` et un appel Graph dédié. Cette permission n’est volontairement ni demandée ni ajoutée sans validation explicite.

## Pagination et delta

Les réponses `@odata.nextLink` sont suivies par **Charger plus**. Le contrat transporte aussi `@odata.deltaLink`, ce qui permet de passer à une synchronisation delta persistée lorsque la stratégie multi-compte et la gestion des suppressions auront été décidées. Les curseurs ne sont jamais acceptés hors du domaine Graph v1.0.

## Limites avant test réel

Sans véritable `VITE_MICROSOFT_CLIENT_ID` et sans URI enregistrée, l’interface reste volontairement en mode local et la connexion est désactivée. Les comportements de consentement, politiques du tenant, boîte réelle, pagination et téléchargements doivent être validés avec un compte de test autorisé.
