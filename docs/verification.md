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
| Installation depuis un environnement vierge | Jeu de versions défini. Le réseau disponible ne permettait pas l’installation des paquets manquants. | Installer `requirements-dev.txt` sur l’environnement du groupe ou dans GitHub Actions. |
| Ruff, pytest-cov et couverture des branches | Outils absents de l’environnement local. | Ouvrir l’exécution **Qualité et Docker** dans GitHub Actions et relever la couverture. |
| Swagger en navigateur ou Postman | `/docs` et `/openapi.json` répondent en HTTP `200`. Le navigateur de vérification n’a pas atteint le serveur local. | Exécuter le parcours interactif et conserver les captures. |
| Image et conteneur Docker | Docker Engine indisponible dans l’environnement local. | Exécuter `docker build`, démarrer le conteneur et ouvrir Swagger. |
| Dépôt GitHub, exécution Actions et service Render | Accès aux comptes du groupe nécessaire. | Publier le dépôt, vérifier le pipeline, déployer et tester l’adresse HTTPS réelle. |

Pour reproduire rapidement les tests avec les dépendances d’exécution et HTTPX disponibles, utiliser `python -m unittest discover -s tests -v`. Pour la mesure de référence avant remise, exécuter `python -m pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=80`.

**Mise à jour du 17 novembre 2026.** Le [guide Windows](guide-windows.md) et son script reprennent la vérification HTTP existante. L’exécution du parcours PowerShell avec Docker Desktop et le déploiement de la configuration Blueprint restent à vérifier dans l’environnement du groupe.
