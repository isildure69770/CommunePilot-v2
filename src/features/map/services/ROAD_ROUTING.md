# Routage des portions

Le routage automatique passe par `RoadRoutingProvider`. L’implémentation actuelle est un adaptateur OSRM sans clé API.

- En production, définir `VITE_ROUTING_ENDPOINT` avec l’URL d’un endpoint OSRM maîtrisé (instance interne, proxy applicatif ou fournisseur contractuel).
- En développement uniquement, l’application utilise `https://router.project-osrm.org` si aucun endpoint n’est configuré. Ce service public n’offre aucune garantie de disponibilité, de capacité, de confidentialité ni de niveau de service et ne doit pas être utilisé en production.
- Aucune clé ni valeur de configuration n’est écrite dans `.env.local`.

L’adaptateur retourne une `LineString` GeoJSON et la distance fournie par OSRM. La persistance recalcule également la longueur géodésique depuis la géométrie enregistrée et applique le coefficient métier : un côté ×1, deux côtés ×2.
