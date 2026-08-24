# CommunePilot v2

CommunePilot est une application web de pilotage communal destinée aux élus, agents administratifs et agents techniques. Elle centralise les dossiers, signalements, missions de terrain, équipements, cartes métier, commissions, calendriers et courriels.

## Fonctionnalités disponibles

- tableau de bord communal responsive ;
- dossiers, documents, historique et suivi des activités ;
- signalements, chantiers et interventions ;
- carte communale, cadastre, parcelles, routes, bâtiments et équipements ;
- commissions municipales et calendrier ;
- centre de gestion des courriels avec intégration Microsoft préparée ;
- utilisateurs, rôles et permissions ;
- missions, alertes et interface mobile pour les agents de terrain ;
- synchronisation Azure des alertes terrain entre appareils.

Les rubriques **Conseil municipal** et **Documents** restent à développer. Une partie des données métier est encore conservée dans le navigateur et devra progressivement être transférée vers des services partagés.

## Démarrage local

Prérequis : Node.js récent et npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

L’application est alors accessible à l’adresse indiquée par Vite, généralement `http://localhost:5173`.

## Vérifications

```bash
npm run lint
npm run build
```

La construction de production est générée dans `dist/`.

## Configuration

Les variables publiques disponibles sont documentées dans `.env.example` :

- Microsoft Entra et Microsoft Graph pour les courriels ;
- Google OAuth pour les calendriers ;
- chemin de l’API des alertes terrain.

Ne jamais placer de secret dans une variable commençant par `VITE_`. La configuration détaillée de la synchronisation des alertes est disponible dans `docs/AZURE_FIELD_ALERTS_SYNC.md`.

## Déploiement

Le workflow GitHub Actions déploie la branche `main` vers Azure Static Web Apps. Il construit l’interface depuis la racine du dépôt et l’API Azure Functions depuis `api/`.

Le secret GitHub `AZURE_STATIC_WEB_APPS_API_TOKEN` doit être configuré. La chaîne `FIELD_ALERTS_STORAGE_CONNECTION_STRING` doit rester dans les paramètres d’application Azure côté API.

## Organisation Git

- `main` représente la version officielle et déployable ;
- chaque évolution est développée sur une branche dédiée ;
- les vérifications doivent réussir avant l’intégration dans `main` ;
- les commits doivent décrire clairement la fonctionnalité livrée.
