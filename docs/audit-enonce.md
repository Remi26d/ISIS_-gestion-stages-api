# Contrôle de l’énoncé original

Relecture le 23 novembre 2026 de **miniProjeCloud&Microservices - Énoncé**, 2 pages. Le sujet ne contient pas de barème chiffré. Une conformité technique ne garantit pas une note ; la démonstration et la compréhension du groupe restent essentielles.

| Demande littérale | Réalisation et preuve |
|---|---|
| Six champs de stage et SQLite, p. 1 | `app/schemas.py`, `app/database.py`, tests de validation et de persistance avec réouverture du fichier. |
| Création, liste, modification, suppression, p. 1 | POST, GET, PUT, DELETE ; tests isolés, parcours HTTP et Swagger. Lecture individuelle en complément. |
| Swagger **ou** Postman, y compris ressource absente, p. 1–2 | Sept captures authentiques Swagger : création, lecture, liste, remplacement, suppression, 404. Utiliser les deux outils n’est pas exigé. |
| Dockerfile, image construite, conteneur exécuté, API vérifiée, Swagger ouvert, p. 2 | Dockerfile, journal Docker local du 20 novembre, CI de l’image, Swagger du conteneur Render. Une capture du Swagger local renforcerait la preuve du contexte local. |
| GitHub et Web Service Docker Render Free, URL publique testée, p. 2 | Dépôt publié, service Free Docker Francfort, historique Live, sonde et CRUD HTTPS. L’accès de l’enseignante au dépôt privé doit être vérifié avec elle. |
| Courte documentation des endpoints, p. 2 | Tableau et exemples du README, Swagger et contrat OpenAPI. |
| Quelques captures de fonctionnement et de déploiement, p. 2 | Captures réelles sur l’URL Render et journaux, indexées dans `docs/preuves.md`. Le sujet ne fixe ni nombre exact ni trois écrans locaux obligatoires. Une capture de l’événement Render Live est un complément utile. |
| Pas de vraies données personnelles ; limite SQLite/Free, remarque p. 2 | Données fictives et avertissement dans l’interface, guides expliquant la perte du fichier éphémère. |

## Les cinq livrables à remettre

1. [Code source sur GitHub](https://github.com/Remi26d/ISIS_-gestion-stages-api), avec accès pour l’enseignante.
2. [Dockerfile](../Dockerfile).
3. [URL publique de l’API](https://isis-gestion-stages-api.onrender.com/docs), [collection JSON](https://isis-gestion-stages-api.onrender.com/stages) et [interface](https://isis-gestion-stages-api.onrender.com/).
4. [Documentation des endpoints](../README.md#endpoints).
5. [Captures et preuves datées](preuves.md).

## Compléments et limites

L’interface, le logo ISIS fourni et la palette corail-violet, le guide interactif `/guide`, son PDF, la validation stricte et la CI sont des compléments. Le seuil de couverture est un choix du projet, pas une exigence chiffrée du sujet. Les 100 % mesurés concernent Python ; le rapport ne mesure pas tout le JavaScript.

Le projet est un service unique, organisé en modules. L’énoncé n’impose ni décomposition en microservices, ni Kubernetes, ni hébergement payant. SQLite est imposé. Sa perte sur le disque éphémère de Render Free est admise dans le sujet. Pour de vrais stages, il faudrait notamment gérer les accès, le stockage durable, les sauvegardes et la protection des données.

La configuration réelle Render déploie au commit sans attendre la CI ; `render.yaml` est une recette Blueprint alternative, non appliquée au service existant. Les preuves de versions antérieures gardent leur date et leur commit.

Le groupe de cinq est confirmé. Le guide propose une répartition orale ; il ne prétend pas décrire les contributions passées. Chaque membre doit pouvoir rejouer le CRUD et expliquer les choix.
