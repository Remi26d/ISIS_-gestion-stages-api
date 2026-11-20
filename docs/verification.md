# Rapport de vérification

**Dernière mise à jour : 20 novembre 2026** · Python 3.12.14

Le service [Swagger public](https://isis-gestion-stages-api.onrender.com/docs) fonctionne sur Render Docker **Free**, en région Francfort. Le déploiement applicatif `ed8258ebeff0e89967831a40cf612dff315567c0` est `live`. Le contrôle HTTP complet et les opérations interactives dans Swagger ont réussi. Les résultats et captures sont détaillés plus bas.

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
| Capture Swagger dans le conteneur local | Le journal Docker confirme `/docs`, `/openapi.json` et le CRUD en HTTP ; Swagger a aussi été testé dans le conteneur public Render. | Joindre la capture de Swagger ouvert sur `http://127.0.0.1:8000/docs` depuis le PC. |
| Captures du terminal Docker et du tableau de bord Render | Les journaux Docker et Render sont joints ; les captures publiques sont réalisées. | Joindre les deux vues depuis les applications connectées du PC, selon le [guide Windows](guide-windows.md). |

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

L’affichage interactif de Swagger est désormais confirmé sur le service Render par les captures ci-dessous. La capture de l’interface Swagger locale du PC reste à joindre pour documenter ce contexte précis.

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

Une seconde exécution [44699902443](https://github.com/Remi26d/ISIS_-gestion-stages-api/actions/runs/44699902443) a également terminé avec `success` sur le commit `ed8258ebeff0e89967831a40cf612dff315567c0`, ensuite déployé sur Render.

## Déploiement Render et tests publics du 20 novembre 2026

Le refus initial `invalid or unfetchable` venait de l’accès au dépôt privé. Après autorisation du dépôt par le référent, la création a réussi. Le service `isis-gestion-stages-api` est passé à `live` le **20 novembre 2026 à 09:11, heure de Paris**.

| Paramètre ou contrôle | Résultat constaté | Preuve |
|---|---|---|
| Service Render | Docker, **Free**, Frankfurt, branche `main` | [Reçu des paramètres et du déploiement](../preuves/render/00-deploiement.json) |
| Image déployée | Commit `ed8258ebeff0e89967831a40cf612dff315567c0`, déploiement `dep-dc000op42hec738a2n10`, état `live` | [Reçu](../preuves/render/00-deploiement.json) |
| Démarrage | Uvicorn écoute sur `0.0.0.0:10000`, démarrage terminé | [Journaux Render](../preuves/render/07-journaux-render.txt) |
| Sonde, Swagger et contrat | `/health`, `/docs` et `/openapi.json` : HTTP `200` | [Contrôle HTTP public](../preuves/render/03-parcours-http.txt) |
| CRUD public automatisé | `POST 201`, liste et détail `200`, `PUT 200`, relecture `200`, `DELETE 204`, puis `GET 404` | [Contrôle HTTP public](../preuves/render/03-parcours-http.txt) |
| CRUD interactif Swagger | Création d’un stage fictif d’id `2`, lecture, modification de l’intitulé, suppression, puis lecture `404` | [Captures authentiques](preuves.md) |
| Nettoyage de démonstration | `GET /stages` renvoie `200` et `[]` après les essais | [Capture de la liste](../preuves/render/captures/08-swagger-liste-200.jpg) |

Le stage d’id `1` a été créé puis supprimé par le contrôle automatisé. Le stage d’id `2` a été créé puis supprimé dans Swagger. Les données sont fictives. La région Francfort a été retenue pour ce service européen, sur le plan gratuit. Aucun disque ni base externe payants n’ont été créés.

Le service créé directement utilise le déclenchement automatique **sur commit** et le contrôle de démarrage **TCP par défaut**. Le test de `/health` a été effectué séparément par HTTP. Les réglages supplémentaires du fichier `render.yaml` sont une recette Blueprint alternative, pas les réglages appliqués à ce service. Les commits de documentation et de preuves utilisent `[skip render]` pour garder l’image applicative validée.

La base SQLite du conteneur Render est éphémère : les stages doivent être recréés après mise en veille, redémarrage ou redéploiement. La vérification porte sur les résultats reçus à la date indiquée, et ne constitue pas une garantie de disponibilité permanente.

## Interface web 1.1 : vérification du 20 novembre 2026

L’interface est ajoutée à `/`, dans le même service et sans changer le modèle SQLite. La vérification Python de cette version aboutit à **23 tests réussis et 57 sous-tests**, avec **138 instructions et 16 issues de branche couvertes sur 138 et 16, soit 100 %**. Les ressources statiques ne sont pas incluses dans ce pourcentage Python. Les **7 tests JavaScript** séparés passent sur Node 24.

Les essais interactifs suivants ont été réalisés dans une prévisualisation avec une base de démonstration isolée :

| Contrôle dans le navigateur | Résultat observé |
|---|---|
| Base vide | Indicateurs à zéro et proposition explicite d’ajouter un stage ou six exemples fictifs. |
| Démonstration | Six stages enregistrés ; deux en cours, deux à venir et deux terminés ; trois entreprises. |
| Validation du formulaire | Champs obligatoires signalés ; dates de fin antérieures au début rejetées. |
| Création | Un stage fictif de test apparaît dans la liste et les indicateurs. |
| Recherche | `ETUDIANT interface` retrouve `Étudiant Test Interface`, malgré la casse et l’accent. |
| Modification et lecture | L’intitulé modifié apparaît dans la fiche relue depuis l’API. |
| Suppression | Annuler conserve le stage ; confirmer le supprime ; les six exemples restent présents. |
| Filtres combinés | Statut En cours et entreprise Atelier Santé Démo donnent un seul stage. |
| Export | CSV téléchargé, un seul stage filtré, Camille présente et Nora absente. |
| Entreprises | Trois cartes cohérentes ; Consulter les stages ouvre deux stages de l’entreprise choisie. |
| Calendrier | Décembre 2026 montre le départ de Louis le 11 et la fin de Nora le 12 ; l’événement ouvre la fiche correspondante. |
| Largeur réduite | Menu compact utilisable ; largeur de document inférieure ou égale à la fenêtre à 545 et 340 pixels CSS, contrôlés par zoom du navigateur. Il ne s’agit pas d’un essai sur téléphone physique. |

Le contrôle HTTP en ligne de commande de cette prévisualisation n’a pas pu joindre ses ports depuis l’exécuteur, alors que le navigateur accédait au relais. Ce résultat ne vaut pas validation HTTP par ce chemin. Le workflow Docker et la vérification du service public contrôlent séparément l’accueil, les ressources statiques et le CRUD. Les preuves du déploiement de l’interface sont conservées dans `preuves/interface/` lorsqu’elles sont recueillies.

## Validation de l’interface déployée

Le commit `5c235fbada557890d916709f5d4a49bd274db514` est passé à **live le 20 novembre 2026 à 10:09, heure de Paris**, après le commit d’ajout de l’interface. La [CI 44708215645](https://github.com/Remi26d/ISIS_-gestion-stages-api/actions/runs/44708215645) a réussi : 23 tests Python, couverture Python de 100 %, 7 tests JavaScript, syntaxe PowerShell, construction Docker, accueil et ressources web dans le conteneur, puis CRUD complet.

Le [parcours HTTP public](../preuves/interface/01-controle-http-public.txt) a été exécuté avec succès sur le commit d’ajout `84314af2ad1b1f42435c68d92f2cd5ab5470ce29`, avant la seule correction suivante de retour en haut lors de la navigation. Il vérifie `/`, le CSS, les deux modules JavaScript, les icônes, Swagger, OpenAPI, puis le CRUD avec suppression du stage temporaire.

Dans le navigateur public sur la version finale, les six exemples ont été créés depuis le bouton de démonstration. L’accueil affiche six stages, trois entreprises, deux stages en cours, deux à venir et deux terminés. Les fiches sont relues depuis l’API. Les vues liste, entreprises et calendrier ont été ouvertes, le formulaire affiche le focus sur le premier champ, et la navigation compacte a été vérifiée à 340 pixels CSS. Les [six captures originales et le reçu de déploiement](preuves.md) sont joints. Les exemples de démonstration restent dans la base éphémère ; ils peuvent être recréés si Render la réinitialise.
