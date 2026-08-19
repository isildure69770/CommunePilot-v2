# CommunePilot

## Annuaire en ligne

Les membres sont stockés dans Azure Table Storage (`DirectoryUsers`, surchargeable avec `USERS_TABLE_NAME`). Chaque enregistrement conserve un identifiant stable, identité, fonction, groupe métier, rôle d’accès, coordonnées, visibilité de l’adresse, commissions, statut, notes et dates de création/modification. Les photos originales et leurs vignettes 240 × 240 sont stockées dans le conteneur Blob `directory-photos` (`USERS_PHOTOS_CONTAINER_NAME`). Le navigateur ne conserve qu’un cache léger sans image en base64 ; Azure reste la source de vérité.

Les quatre groupes métier sont : Maire et adjoints, Conseillers municipaux, Agents administratifs et Agents techniques. Ils ne pilotent pas les autorisations : le champ `role` reste séparé et alimente la matrice applicative. L’API exige une identité Azure Static Web Apps. Tous les rôles CommunePilot peuvent lire l’annuaire ; Maire, Adjoint et Agent administratif peuvent créer, modifier, désactiver et envoyer une photo. Adresse et notes marquées « administration uniquement » sont supprimées des réponses destinées aux autres rôles. Il n’existe volontairement pas de suppression physique dans l’interface.

Au premier accès à l’annuaire vide, les anciens profils du stockage local sont normalisés puis envoyés dans Azure avec leurs identifiants inchangés. Cela préserve les références `assigneeIds` des missions et ne modifie pas l’authentification Microsoft/Azure.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
