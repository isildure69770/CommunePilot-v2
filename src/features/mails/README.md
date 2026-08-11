# Mails — bloc 12.9

Le module est un centre de traitement local : lecture, statuts, classement,
rattachement aux dossiers, pièces jointes connues, notes et actions de suivi.
Le Dashboard consomme le même repository.

## Stockage et migration

`services/mailRepository.ts` est l’unique point d’accès aux mails. Les données
sont enregistrées sous `communepilot-mails-v2`. Au premier chargement, les clés
historiques `communepilot-mails` et `mails` sont migrées si elles existent ; à
défaut, les données locales de démonstration sont installées. Une ancienne
valeur `attachmentCount` sans nom ni métadonnée réelle n’est pas convertie en
fichier : le module ne fabrique ni pièce jointe ni URL fictive.

## Future connexion Gmail / Outlook

Créer un adaptateur fournisseur authentifié côté infrastructure sécurisée. Il
doit convertir chaque message en `MunicipalMail` (notamment `externalId`,
`source`, contenu et métadonnées réelles des pièces jointes), puis utiliser le
repository. Les téléchargements restent indisponibles tant qu’aucune `url`
fiable n’est fournie. Aucun token, secret ou credential ne doit être placé dans
le navigateur, les données d’exemple ou le repository local.

## Limite volontaire

CommunePilot ne possède pas encore de module partagé de tâches. Les actions de
suivi restent donc rattachées au mail afin de ne pas dupliquer un futur module.
