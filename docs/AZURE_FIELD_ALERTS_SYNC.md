# Synchronisation Azure des alertes terrain

Les alertes sont écrites d'abord dans `localStorage`, puis envoyées à `/api/field-alerts`. La fusion se fait par `id` et la version au `updatedAt` le plus récent gagne. Une copie locale n'est jamais supprimée après un échec.

Les photos binaires restent sur l'appareil d'origine dans cette première version ; seuls leurs nom, type, date, nature et phase sont partagés. Une extension pourra stocker les fichiers dans Blob Storage et conserver leurs URL privées dans le même modèle.

## Configuration Azure

1. Créer ou réutiliser un compte de stockage Azure standard, sans accès public aux blobs.
2. Créer une table `FieldAlerts` (l'API tente aussi de la créer au premier appel).
3. Dans Static Web Apps, sous **Configuration > Paramètres d'application**, ajouter côté API `COMMUNEPILOT_STORAGE_CONNECTION_STRING` avec la chaîne de connexion. L’ancien nom `FIELD_ALERTS_STORAGE_CONNECTION_STRING` reste accepté pour compatibilité. Les noms de tables peuvent être personnalisés avec `FIELD_ALERTS_TABLE_NAME=FieldAlerts` et `COMMUNEPILOT_USERS_TABLE_NAME=CommunePilotUsers`.
4. Configurer Microsoft Entra pour Static Web Apps. Dans **Gestion des rôles**, inviter/affecter chaque utilisateur avec l'un des rôles exacts : `maire`, `adjoint`, `conseiller`, `agent-administratif`, `agent-technique`. Les utilisateurs se connectent ensuite via `/.auth/login/aad` sur le domaine de l'application.
5. Vérifier le déploiement avec `app_location: /`, `output_location: dist` et `api_location: api`, puis redéployer.

Ne placer aucune chaîne de connexion dans `.env.local`, GitHub ou une variable `VITE_*`. Une référence Key Vault dans les paramètres d'application peut être utilisée si le plan Azure le permet.

Conformément au bloc 13, tous ces rôles peuvent créer une alerte. `Agent technique` ne peut pas modifier une alerte existante ; les autres rôles listés le peuvent. La route refuse les utilisateurs non authentifiés.

Sans API, stockage ou rôle configuré, l'état affiche `Erreur de synchronisation` et l'application continue en local. Il ne s'agit pas alors d'une vraie synchronisation multi-appareils.

À chaque connexion, l’utilisateur est enregistré dans l’annuaire partagé `CommunePilotUsers`. Il devient alors disponible pour les affectations selon son rôle Azure, sans réactiver les anciens profils de simulation locale.

## Recette iPhone ↔ Mac

1. Sur l'iPhone, créer l'alerte et attendre `Synchronisé` (ou toucher **Synchroniser maintenant**).
2. Ouvrir CommunePilot sur le Mac : la synchronisation initiale fait apparaître l'alerte.
3. Modifier son statut sur le Mac et attendre `Synchronisé`.
4. Rafraîchir l'iPhone ou toucher **Synchroniser maintenant** : le statut mis à jour apparaît.
