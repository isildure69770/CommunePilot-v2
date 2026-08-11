# Patrimoine de voirie

Le module fusionne le référentiel public `road-equipment.geojson` avec les ajouts, corrections et suppressions locaux. Les identifiants OSM restent stables et les anciennes données stockées sous `communepilot-road-equipment-v1` sont normalisées au chargement (tableaux, échéances et coûts absents).

## Persistance et sauvegarde

`roadEquipmentStorage.ts` expose un adaptateur de stockage. L'adaptateur par défaut conserve le fonctionnement historique avec `localStorage`; `configureRoadEquipmentStorage` constitue le point d'entrée d'une future persistance synchronisée, sans simuler de backend. L'interface permet d'exporter et de restaurer une sauvegarde JSON versionnée. Une restauration remplace uniquement l'état local du module et ne modifie jamais le GeoJSON OSM.

## Export et alertes

Le CSV exporte le résultat filtré et s'ouvre dans les tableurs francophones (UTF-8 avec BOM, séparateur point-virgule). L'impression est volontairement native au navigateur afin d'éviter une dépendance PDF. Une échéance est « proche » dans les 30 jours et « en retard » avant la date du jour.
