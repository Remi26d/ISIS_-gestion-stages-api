# Comprendre et présenter le projet

ISIS Castres · FISA5 · 23 novembre 2026.

Rémi DELARUE, Romane CANO, Alexis DECHENAIS, Yasmine JAOU, Lina KHADLY.

[Guide interactif](https://isis-gestion-stages-api.onrender.com/guide) · [PDF de soutenance](../app/web/guide-soutenance.pdf) · [Audit de l’énoncé](audit-enonce.md).

## Besoin et contrat

L’API gère une ressource stage avec les six champs de l’énoncé. SQLite génère `id`. Le client envoie les cinq champs éditables. Pydantic impose des textes non vides, des longueurs maximales de 120/160/240 caractères pour nom/entreprise/intitulé et des dates calendaires `AAAA-MM-JJ` avec fin supérieure ou égale au début. Les champs supplémentaires sont refusés.

| Requête | Résultat | À expliquer |
|---|---|---|
| GET /stages | 200, tableau JSON, éventuellement vide | Une collection vide ne produit pas 404. |
| GET /stages/{id} | 200, stage | 404 si absent ; 422 si identifiant invalide. |
| POST /stages | 201, stage avec id et Location | Réutiliser l’id retourné, jamais un id supposé. |
| PUT /stages/{id} | 200, stage remplacé | Les cinq champs sont exigés : remplacement complet. |
| DELETE /stages/{id} | 204, aucun corps | Un GET ultérieur répond 404. |

PUT et DELETE sont idempotents quant à leur effet. Le second DELETE peut répondre 404 après un premier 204 : la ressource reste absente. Deux POST identiques peuvent créer deux ids.

## Suivre une création

1. L’interface ou Swagger envoie les cinq champs en JSON.
2. FastAPI sélectionne la route de `app/main.py`. Pydantic contrôle le corps avec `StageSaisie` dans `app/schemas.py`.
3. Une requête invalide produit 422 avant l’appel à la fonction de création.
4. `BaseStages.creer` dans `app/database.py` lie les valeurs à des paramètres SQL. L’INSERT génère l’id et renvoie la ligne.
5. La transaction est validée si l’opération réussit, annulée en cas d’exception ; la connexion est fermée.
6. L’API répond 201 avec le stage et `Location`. L’interface recharge les données.

Le contrat OpenAPI décrit les routes ; Swagger UI est un client interactif de ce contrat. La validation du formulaire aide l’utilisateur, mais la validation serveur demeure nécessaire pour tous les clients.

## Expliquer les choix

SQLite est imposé et convient au domaine pédagogique. Les modules séparent HTTP, validation et stockage dans **un service unique**. Ce ne sont pas des microservices indépendamment déployables. Une architecture distribuée demanderait d’autres besoins d’autonomie ou de charge.

SQLite conserve les transactions dans son fichier si le même fichier est réutilisé. La durabilité du support est distincte : un conteneur supprimé sans stockage durable ou le disque éphémère Render Free peuvent faire disparaître ce fichier. L’énoncé admet cette limite. Les statuts et indicateurs de l’interface sont calculés à partir des stages réels ; ils n’ajoutent aucun champ métier à l’API.

Le Dockerfile est la recette, l’image le paquet construit et le conteneur son exécution. Le processus tourne avec un utilisateur non privilégié. Uvicorn écoute sur `0.0.0.0`, port 8000 par défaut ou valeur de `PORT` sur Render. Node sert aux tests et à la prévisualisation, pas au démarrage de l’image.

Git versionne ; GitHub héberge et exécute la CI ; Render déploie et expose le service HTTPS. La configuration réelle Render est Docker Free, Francfort, branche main, déploiement au commit **sans attente de CI**. `render.yaml` est un Blueprint alternatif non appliqué. La sonde actuelle Render est TCP ; `/health` est contrôlé séparément par HTTP.

## Relier chaque affirmation à une preuve

| Couche | Ce qu’elle prouve | Limite |
|---|---|---|
| Tests Python | CRUD, validation, persistance, réponses, livraison web | La couverture Python ne mesure pas le JavaScript. |
| 7 tests JavaScript | Dates, statuts, recherche, tri, échappement, CSV | Pas tous les événements du navigateur. |
| Parcours HTTP réel | Accueil, ressources, guide, OpenAPI, CRUD avec nettoyage | Complète les tests isolés et l’observation visuelle. |
| CI Docker | Construction, démarrage avec PORT, CRUD du conteneur | Résultat associé au commit testé. |
| Captures Swagger et interface | Comportement interactif, contexte visible | Preuves datées, pas garantie permanente. |
| Reçu Render et HTTPS | Configuration et fonctionnement public | Service pouvant dormir, disque éphémère. |

100 % de couverture signifie que les instructions et branches mesurées ont été exécutées, pas une absence garantie de bugs. Les validations historiques du 20 novembre et celles de la version 1.2 sont séparées dans les preuves.

## Répéter à cinq en 6 min 15

Répartition proposée pour l’oral, sans attribution des contributions passées :

| Temps | Personne proposée | Montrer et expliquer |
|---|---|---|
| 0:00–0:45 | Rémi | Besoin, six champs, URL et tableau de bord. |
| 0:45–2:00 | Romane | Création fictive, POST, 201, id retourné. |
| 2:00–3:15 | Alexis | GET, PUT complet, erreur 422 dans Swagger. |
| 3:15–4:30 | Yasmine | DELETE 204, GET 404, SQLite et transaction. |
| 4:30–5:30 | Lina | Dockerfile, CI, Render et fichier éphémère. |
| 5:30–6:15 | Ensemble | Livrables, améliorations et limites. |

**Exercice individuel :** chacun crée, lit, remplace, invalide les dates, supprime et constate le 404. Puis il explique les trois fichiers Python sans lire le guide. Ouvrir le service avant l’oral pour le sortir de veille, garder le PDF et les captures en secours, utiliser des données fictives et nettoyer le stage de test.

## Questions à maîtriser

- Pourquoi une API ? Un contrat commun pour l’interface, Swagger et d’autres clients.
- Pourquoi 422 et 404 ? Requête invalide contre ressource absente.
- Pourquoi pas PATCH ? PUT réalise le remplacement demandé ; un contrat partiel serait distinct.
- Comment éviter une injection SQL ? Paramètres liés, pas de concaténation des valeurs.
- Est-ce une architecture de microservices ? Un service unique avec des modules internes.
- La CI bloque-t-elle Render ? Pas dans la configuration réelle actuelle.
- Pourquoi SQLite perd-il les stages ? Le support est éphémère ; le moteur et le disque sont deux sujets distincts.
- Pour de vrais stages ? Authentification, autorisations, stockage durable, sauvegardes, journalisation et protection des données.

## Remise et sources

Les cinq livrables sont code GitHub, Dockerfile, URL publique, documentation courte et quelques captures de fonctionnement/déploiement. Le sujet ne prescrit pas trois captures locales particulières. Une capture Render Live reste utile. Vérifier avec l’enseignante l’accès au dépôt privé et consulter la CI du commit remis.

Sources : énoncé original p. 1–2 ; support « Cloud Computing & Microservices » p. 23–29 et 39–40 ; code et preuves du dépôt ; [Render Free](https://render.com/docs/free) et [Render Deploys](https://render.com/docs/deploys), consultés le 23 novembre 2026. Aucun barème n’est inventé et aucune note n’est garantie.
