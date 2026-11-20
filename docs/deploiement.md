# Docker et déploiement Render

## Service déjà déployé le 20 novembre 2026

[Swagger public](https://isis-gestion-stages-api.onrender.com/docs) · [Sonde HTTP](https://isis-gestion-stages-api.onrender.com/health) · [Tableau de bord du service](https://dashboard.render.com/web/srv-dc000o142hec738a2lhg).

Le service `isis-gestion-stages-api` utilise le dépôt `Remi26d/ISIS_-gestion-stages-api`, la branche `main`, le runtime Docker, le plan **Free** et la région **Frankfurt**. Le déploiement `dep-dc000op42hec738a2n10` du commit `ed8258ebeff0e89967831a40cf612dff315567c0` est passé à `live` le 20 novembre 2026 à **09:11, heure de Paris**. Le contrôle HTTP et le parcours interactif Swagger ont réussi. Le [reçu de déploiement](../preuves/render/00-deploiement.json) et les [journaux](../preuves/render/07-journaux-render.txt) conservent les paramètres et les événements constatés.

Ce service a été créé directement dans Render. Son déploiement automatique se déclenche **à chaque commit**, et sa vérification de démarrage est le contrôle **TCP par défaut**. La route `/health` a été vérifiée séparément par HTTP. Le fichier `render.yaml` décrit une autre méthode de création avec Blueprint ; ses réglages `/health`, attente de la CI et filtres de fichiers ne sont pas appliqués automatiquement au service créé directement.

Pour un commit qui modifie seulement le README, la documentation ou les preuves, commencer le message par `[skip render]`. GitHub Actions exécute toujours les contrôles, mais Render conserve l’image en cours. Un changement de code applicatif doit être déployé et revérifié. [Déclenchement et exclusion d’un déploiement](https://render.com/docs/deploys)

Les étapes ci-dessous servent à reproduire l’installation. Le service existant n’a pas à être recréé. Pour les dernières captures sur le PC Windows, suivre le [guide Windows](guide-windows.md).

## 1. Exécuter le conteneur en local

Sous Windows, démarrer Docker Desktop avec les conteneurs Linux. Utiliser PowerShell ou Bash depuis le dossier contenant le `Dockerfile`. Si Uvicorn utilise déjà le port 8000, l’arrêter avant de lancer le conteneur.

```bash
docker version
docker build --tag gestion-stages-api:local .
docker run --detach --name gestion-stages --publish 127.0.0.1:8000:8000 gestion-stages-api:local
docker ps --filter name=gestion-stages
docker logs gestion-stages
```

Ouvrir [la sonde `/health`](http://127.0.0.1:8000/health) puis [Swagger](http://127.0.0.1:8000/docs). Déplier `POST /stages`, cliquer sur **Try it out**, utiliser l’exemple proposé puis **Execute**. Attendre le code `201` et relever l’`id`. Enchaîner avec la [checklist des captures](preuves.md). Si l’interface Swagger ne se charge pas, importer [le contrat OpenAPI](http://127.0.0.1:8000/openapi.json) dans Postman et exécuter les mêmes requêtes. La page Swagger doit aussi être ouverte dans le conteneur pour la vérification prévue par l’énoncé.

Pour vérifier le CRUD par HTTP avec un stage fictif temporaire, lancer l’une des commandes suivantes pendant que le conteneur tourne.

```powershell
py -3.12 scripts/verifier_service.py http://127.0.0.1:8000
```

```bash
python3.12 scripts/verifier_service.py http://127.0.0.1:8000
```

Arrêter et supprimer le conteneur après les vérifications. Les stages du conteneur d’essai sont stockés dans sa couche inscriptible et disparaissent à sa suppression.

```bash
docker stop gestion-stages
docker rm gestion-stages
```

L’image démarre avec l’utilisateur `10001:10001`. Le dossier `/app/data` lui appartient et la base est créée à l’emplacement `/app/data/stages.sqlite3`. La copie comprend le code applicatif et les dépendances d’exécution verrouillées. Le port interne par défaut est `8000`. Pour reproduire le port Render dans Docker, utiliser `--env PORT=10000 --publish 127.0.0.1:8000:10000` dans la commande `docker run`. [Référence Dockerfile](https://docs.docker.com/reference/dockerfile/)

## 2. Publier le dépôt sur GitHub

1. Créer un dépôt vide dans l’espace GitHub utilisé par le groupe, sans initialisation distante. Choisir une visibilité qui donne accès au code à l’enseignante au moment de la remise.
2. Depuis le dossier du projet, préparer le premier commit. Relire la liste des fichiers avant de valider.

   ```bash
   git init -b main
   git add .
   git diff --cached --stat
   git diff --cached --check
   git commit -m "Livrer l’API de gestion des stages"
   ```

3. Relier le dépôt et pousser `main`. Sous PowerShell, coller l’URL HTTPS du dépôt à l’invite.

   ```powershell
   $depot = Read-Host "Adresse HTTPS du dépôt GitHub"
   git remote add origin $depot
   git push -u origin main
   ```

   Sous Bash, coller la même URL à l’invite.

   ```bash
   read -r -p "Adresse HTTPS du dépôt GitHub : " depot
   git remote add origin "$depot"
   git push -u origin main
   ```

4. Dans **Actions**, ouvrir l’exécution **Qualité et Docker** du commit poussé. Vérifier les étapes Ruff, pytest, couverture, `docker build` et le contrôle HTTP du conteneur. En cas d’échec, ouvrir l’étape concernée et corriger la cause avant de déployer. [Guide GitHub pour publier un dépôt local](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github) · [Tests Python dans GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/python)

## 3. Déployer sur Render Free

1. Ouvrir le [tableau de bord Render](https://dashboard.render.com/) avec le compte du groupe ou de son référent. Choisir **New → Web Service**.
2. Choisir **Git Provider**, connecter GitHub et autoriser l’accès au dépôt du projet. Sélectionner ce dépôt et la branche `main`.
3. Donner un nom au service. Choisir **Docker** comme runtime et **Free** comme type d’instance. Laisser le dossier racine et la commande Docker aux valeurs par défaut. Le `Dockerfile` se trouve à la racine.
4. Saisir `/health` dans **Health Check Path**, depuis les options avancées ou les paramètres du service. Render fournit `PORT` avec la valeur par défaut `10000`. L’image lit cette variable au lancement. `DATABASE_PATH` pointe déjà sur le dossier inscriptible du conteneur.
5. Lancer **Deploy Web Service**. Dans **Events** et **Logs**, vérifier le commit, la réussite du build et le démarrage d’Uvicorn. Le déploiement doit passer à l’état **Live**.
6. Copier l’URL HTTPS affichée par Render. Tester `/health` et `/docs` à cette adresse, puis exécuter le CRUD dans Swagger ou Postman avec un stage fictif. Vérifier le `404` après suppression.
7. Renseigner le lien du dépôt et l’URL publique dans le `README.md`. Joindre les captures indiquées dans [preuves.md](preuves.md) pour le commit évalué. Si l’ajout du lien déclenche un nouveau déploiement, attendre **Live** puis vérifier de nouveau l’URL.

[Premier déploiement sur Render](https://render.com/docs/your-first-deploy) · [Web Services et ports](https://render.com/docs/web-services) · [Docker sur Render](https://render.com/docs/docker)

Le fichier `render.yaml` permet aussi l’import via **New → Blueprint**. Il décrit un service Docker Free avec `/health` et configure les déploiements suivants après réussite des contrôles CI. Son filtre préserve le déploiement actif lors d’un push limité au README, à `docs/` et à `preuves/`. Avec le formulaire **Web Service**, on peut sélectionner le même déclenchement dans **Settings → Auto-Deploy → After CI Checks Pass** après avoir activé GitHub Actions. [Référence Blueprint](https://render.com/docs/blueprint-spec) · [Filtres de build](https://render.com/docs/monorepo-support#setting-build-filters)

### Vérifier l’adresse publique

PowerShell, depuis le dossier du projet. À l’invite, coller l’URL HTTPS de base affichée par Render.

```powershell
$urlRender = Read-Host "Adresse HTTPS publique du service Render"
py -3.12 scripts/verifier_service.py $urlRender
```

Bash.

```bash
read -r -p "Adresse HTTPS publique du service Render : " url_render
python3.12 scripts/verifier_service.py "$url_render"
```

Le script vérifie les réponses HTTP, le contrat OpenAPI et les données du stage qu’il crée puis supprime. Conserver le résultat avec l’adresse et les statuts HTTP affichés. L’ouverture de l’interface Swagger et ses captures se font dans le navigateur.

### Limites de l’instance gratuite

Render indique `0,1 CPU` et `512 Mo` de mémoire pour l’instance Free, avec 750 heures gratuites par espace de travail et par mois. Un service inactif se met en veille après 15 minutes. La requête suivante peut attendre environ une minute. Les minutes de construction et la bande passante relèvent des quotas de l’espace Render. [Calcul Render](https://render.com/docs/compute-plans) · [Limites Free](https://render.com/docs/free)

Render Free efface les modifications du système de fichiers après une mise en veille, un redémarrage ou un redéploiement. Le service initialise une nouvelle table au besoin. Recréer un stage fictif au début de chaque démonstration. Une base externe persistante serait une évolution pour un service utilisé durablement. [Stockage des services gratuits](https://render.com/docs/free)

### Diagnostic

| Symptôme | Contrôle à effectuer |
|---|---|
| `No open ports` ou mauvaise redirection | Vérifier dans `Logs` la ligne Uvicorn avec `0.0.0.0` et le port de `PORT`. Garder la commande Docker par défaut. |
| `ModuleNotFoundError` sur `app` | Vérifier le dossier racine, la présence de `app/` dans le dépôt et la commande `uvicorn app.main:app`. |
| Échec de `pip install` | Lire le premier message d’erreur de build et vérifier la disponibilité de la version verrouillée pour Python 3.12. |
| `unable to open database file` | Vérifier `DATABASE_PATH` et le droit d’écriture au dossier parent pour l’utilisateur `10001`. |
| Service arrêté ou `502` | Consulter `Events` et `Logs`. Vérifier la réussite du démarrage, `/health` et le port. En cas de réveil Free, attendre puis relancer le contrôle. |
| `/openapi.json` répond mais Swagger reste vide | Vérifier l’accès du navigateur aux ressources Swagger UI sur CDN. Les endpoints restent vérifiables avec Postman à partir du contrat OpenAPI. |
