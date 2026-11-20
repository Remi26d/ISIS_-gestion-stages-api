# Rapport de vérification

**16 novembre 2026** · Python 3.12.14 · SQLite 3.53.1

## Résultats locaux

| Contrôle | Résultat observé | Preuve |
|---|---|---|
| Tests unitaires de validation | 6 réussites | [Sortie des tests](../preuves/local/01-tests-couverture.txt) |
| Intégration HTTP TestClient et persistance SQLite | 15 réussites | [Sortie des tests](../preuves/local/01-tests-couverture.txt) |
| Couverture des lignes applicatives | **179 / 179, soit 100 %** | [Détail par module](../preuves/local/01-tests-couverture.txt) |
| Parcours HTTP sur un serveur Uvicorn | Sonde, contrat OpenAPI, création `201`, consultations `200`, remplacement `200`, suppression `204` et lecture `404` | [Résultat HTTP](../preuves/local/02-parcours-http.txt) · [Journaux Uvicorn](../preuves/local/03-journaux-uvicorn.txt) |

Le total est de **21 réussites, 0 échec, 0 erreur et 0 test ignoré**. La suite vérifie les écritures concurrentes à petite échelle, les dates invalides, la conservation des données entre deux démarrages et l’absence d’écriture pour les requêtes rejetées.

Les tests sont compatibles avec `pytest` et ont été exécutés ici avec `unittest` sur la pile FastAPI, Pydantic, Starlette et HTTPX disponible. La mesure a utilisé `trace` de Python sur les lignes exécutables de `app/`, y compris les threads qui traitent les requêtes. `app/database.py` totalise 51 lignes sur 51, `app/main.py` 88 sur 88 et `app/schemas.py` 40 sur 40. `app/__init__.py` contient seulement la documentation du package. Le client HTTPX fonctionne avec la version de Starlette verrouillée, qui signale sa dépréciation dans la sortie locale.

La commande de lancement du `Dockerfile` a également été exécutée comme processus hôte avec un `PORT` différent de `8000`. Elle a démarré Uvicorn, créé une base temporaire et servi les appels HTTP vérifiés.

## Contrôles en attente

| Contrôle | État | Vérification à réaliser |
|---|---|---|
| Swagger en navigateur ou Postman | `/docs` et `/openapi.json` répondent en HTTP `200` localement et dans le conteneur. | Exécuter le parcours interactif et conserver les captures. |
| Déploiement Render et test public | Le dépôt et Actions sont accessibles. Render refuse la récupération du dépôt privé. | Autoriser le dépôt dans les accès GitHub de Render, déployer et tester l’adresse HTTPS réelle. |

Pour reproduire rapidement les tests avec les dépendances d’exécution et HTTPX disponibles, utiliser `python -m unittest discover -s tests -v`. Pour la mesure de référence avant remise, exécuter `python -m pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=80`.

**Mise à jour du 17 novembre 2026.** Le [guide Windows](guide-windows.md) et son script reprennent la vérification HTTP existante pour le conteneur et le service public.

## Vérification Docker du 20 novembre 2026

Le groupe a fourni le journal produit sous Windows le 20 novembre 2026 à 08:28:56, heure de Paris. Le fichier original est joint dans [preuves/docker/00-validation-docker.txt](../preuves/docker/00-validation-docker.txt).

| Contrôle | Résultat observé dans le journal |
|---|---|
| Moteur Docker | Version `29.5.2`, contexte `desktop-linux`. |
| Construction | Les cinq étapes du Dockerfile et l’export de l’image `gestion-stages-api:validation` sont terminés. Les dépendances d’exécution verrouillées ont été téléchargées et installées. |
| Conteneur | `gestion-stages-verification` est en cours d’exécution et publie `127.0.0.1:8000` vers le port `10000` du conteneur. |
| Accès depuis Windows | `/health` répond en HTTP `200` sur le port publié. |
| Contrat et documentation | `/docs` et `/openapi.json` répondent en HTTP `200` depuis le conteneur. |
| CRUD dans le conteneur | Création `201`, liste et détail `200`, remplacement `200`, nouvelle lecture `200`, suppression `204`, puis lecture du stage supprimé `404`. |
| Fin de contrôle | Le script affiche `Validation terminée.` |

Cette preuve valide désormais la construction et l’exécution Docker ainsi que le contrôle HTTP du conteneur. La vérification d’installation des dépendances d’exécution est également obtenue dans l’image vierge. Les lignes `System.Management.Automation.RemoteException` et les caractères altérés sont conservés tels qu’ils figurent dans le journal fourni.

L’affichage interactif de Swagger reste à confirmer par les captures du navigateur. Le déploiement public Render reste à vérifier.

## Vérification pytest-cov et Ruff du 20 novembre 2026

Une nouvelle vérification a installé `requirements-dev.txt` dans un environnement virtuel Python 3.12.14 vierge. L’installation complète a réussi. Les versions verrouillées de FastAPI, Starlette, Pydantic, HTTPX, pytest, pytest-cov, coverage et Ruff ont été utilisées pour ce contrôle.

| Contrôle | Résultat | Preuve |
|---|---|---|
| `python -m ruff check app tests scripts` | Tous les contrôles passent. | [Sortie Ruff](../preuves/local/05-ruff.txt) |
| `python -m pytest -v --cov=app --cov-report=term-missing --cov-fail-under=80` | 21 tests réussis, avec 50 sous-tests réussis. | [Sortie pytest-cov](../preuves/local/04-pytest-cov.txt) |
| Instructions applicatives | 131 instructions sur 131 exécutées, soit 100 %. | [Détail par module](../preuves/local/04-pytest-cov.txt) |
| Branches applicatives | 16 issues de branche sur 16 couvertes, soit 100 %. | [Tableau de couverture](../preuves/local/04-pytest-cov.txt) |

Le compteur d’instructions de coverage et le compteur historique de lignes de `trace` suivent des conventions différentes. Les deux rapports sont conservés avec leur méthode de mesure et leur date. Pytest signale la dépréciation de l’usage de HTTPX par la version de Starlette installée. Les 21 tests aboutissent.

La vérification pytest-cov décrite ici a été exécutée sur la copie du projet fournie au groupe. Le code applicatif, les dépendances et les tests de cette copie ont ensuite été comparés aux empreintes des fichiers publiés sur GitHub. Ils correspondent.

## GitHub Actions du 20 novembre 2026

Le workflow [Qualité et Docker, exécution 44699251269](https://github.com/Remi26d/ISIS_-gestion-stages-api/actions/runs/44699251269) a terminé avec la conclusion `success` sur le commit `d2d02e04673353f0498a88c72186aaee2037850b`.

Il valide l’installation des dépendances, Ruff, les 21 tests, la couverture de 100 % des instructions et des branches, la syntaxe PowerShell, la construction de l’image et le parcours HTTP complet dans le conteneur. Des [extraits du journal réel](../preuves/github/01-actions-validation.txt) sont conservés avec l’identifiant du commit et le lien de l’exécution.

La première exécution avait échoué sur `curl` avec le code `56`, lors d’une connexion réinitialisée juste après le démarrage du conteneur. La commande attend désormais le démarrage avec des tentatives bornées, y compris après une réinitialisation de connexion. Le comportement a été reproduit en local et la correction a ensuite été confirmée par l’exécution réussie sur GitHub Actions.

La création d’un service Docker Free a été tentée sur Render. La plateforme a refusé l’URL du dépôt comme `invalid or unfetchable`. La liste des services a été revérifiée après ce refus et reste vide. L’accès au dépôt privé doit être autorisé dans les paramètres Git Deployment Credentials de Render avant de poursuivre le déploiement.
