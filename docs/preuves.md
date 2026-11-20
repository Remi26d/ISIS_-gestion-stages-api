# Captures et preuves

## Preuves locales jointes

| Fichier | Contenu vérifiable |
|---|---|
| [01-tests-couverture.txt](../preuves/local/01-tests-couverture.txt) | Sortie réelle de la suite, des résultats et de la mesure des lignes. |
| [02-parcours-http.txt](../preuves/local/02-parcours-http.txt) | Requêtes du scénario complet sur Uvicorn local et statuts reçus. |
| [03-journaux-uvicorn.txt](../preuves/local/03-journaux-uvicorn.txt) | Journaux de démarrage, d’accès et d’arrêt du serveur HTTP local. |
| [04-pytest-cov.txt](../preuves/local/04-pytest-cov.txt) | 21 tests réussis et couverture des instructions et branches mesurée avec pytest-cov le 20 novembre 2026. |
| [05-ruff.txt](../preuves/local/05-ruff.txt) | Contrôle Ruff réussi le 20 novembre 2026. |

Ces traces correspondent à une exécution hors conteneur avec une base temporaire. Les captures exigées pour la remise sont à réaliser dans les environnements indiqués ci-dessous.

## Journal Docker fourni par le groupe

Le [journal Docker du 20 novembre 2026](../preuves/docker/00-validation-docker.txt) confirme la construction de l’image, le démarrage du conteneur, l’accès au port publié et le CRUD complet. Les captures de Swagger, de GitHub Actions et du déploiement Render restent à collecter.

## Exécution GitHub Actions vérifiée

L’[exécution 44699251269](https://github.com/Remi26d/ISIS_-gestion-stages-api/actions/runs/44699251269) est terminée avec la conclusion `success`. Les [extraits du journal](../preuves/github/01-actions-validation.txt) montrent les tests, la couverture et le CRUD en conteneur. La capture de l’interface Actions complète ces traces lors de la remise.

## Collecte avant remise

Le [guide Windows](guide-windows.md) crée les dossiers `preuves/docker/` et `preuves/render/` et enregistre les journaux `docker/00-validation-docker.txt` et `render/03-parcours-http.txt`. Utiliser les données fictives fournies dans Swagger et conserver l’`id` renvoyé par `POST` pour enchaîner les opérations sur le même stage.

| Fichier à obtenir | Quand et quoi montrer | Exigence |
|---|---|---|
| `docker/01-conteneur.png` | Après `docker build` et `docker run`. Montrer le résultat du build et la ligne du conteneur actif avec son port. | E04 |
| `docker/02-swagger-creation-201.png` | Ouvrir `/docs` via le port publié. Déplier `POST /stages`, exécuter l’exemple puis afficher le corps et le statut `201`. | E03, E05 |
| `render/01-deploiement-live.png` | Ouvrir l’événement **Live** après déploiement. Garder le commit et le nom du service visibles. | E07, E09 |
| `render/02-swagger-et-crud-public.png` | Ouvrir `/docs` sur l’URL HTTPS Render, puis montrer une réponse du CRUD avec l’adresse publique visible. Conserver aussi le résultat complet de `scripts/verifier_service.py` pour cette adresse. | E07, E09 |
| `03-actions-et-couverture.png` | Après un push, ouvrir **Qualité et Docker** dans GitHub Actions. Déplier les résultats de pytest-cov et du build. | Q01, Q02 |

Dans Swagger, ouvrir une route, sélectionner **Try it out**, saisir le corps ou l’`id` si nécessaire, puis sélectionner **Execute**. Dans Postman, importer l’URL de `/openapi.json` puis choisir le serveur correspondant au test local ou public. Pour `POST` et `PUT`, envoyer du JSON dans le corps de la requête.

Les journaux montrent les statuts du contrôle complet. Pour illustrer aussi le remplacement et la suppression dans Swagger, ajouter les captures `docker/03-lecture-et-put-200.png` et `docker/04-delete-204-et-get-404.png`.

Avant la remise, confirmer que le dépôt est accessible à l’enseignante, renseigner le lien du dépôt et l’URL Render dans le README, puis joindre les captures et le numéro du commit évalué. Dans le tableau de bord, choisir un cadrage qui exclut les paramètres de compte et les éventuelles valeurs confidentielles.
