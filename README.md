# Gestion des stages

La version 1.3 ajoute une visite guidée de six étapes à la première ouverture. Le bouton **?** de la barre supérieure permet de la relancer ; **Passer** ou Échap la ferme sans modifier les stages.

Application web et API REST de gestion des stages d’une école d’ingénieurs. L’interface permet de créer, consulter, modifier et supprimer des stages fictifs, rechercher les parcours, suivre les dates clés et exporter les résultats. Les stages sont stockés dans un fichier SQLite et le contrat OpenAPI reste consultable dans Swagger.

**[Ouvrir l’application web](https://isis-gestion-stages-api.onrender.com/)** · [Tester l’API dans Swagger](https://isis-gestion-stages-api.onrender.com/docs) · [Guide de l’interface](docs/interface.md)

**[Comprendre le projet](https://isis-gestion-stages-api.onrender.com/guide)** · [Guide PDF de soutenance](app/web/guide-soutenance.pdf) · [Audit de l’énoncé original](docs/audit-enonce.md)

La version 1.2 reprend le logo ISIS fourni sans le modifier et ses couleurs corail-violet. Le guide explique le parcours d’une requête, les choix techniques, les preuves et une répétition à cinq. Ses exemples interactifs n’écrivent aucune donnée.

**ISIS Castres · FISA5 / FIA5 · 2026–2027**

Module Cloud Computing, Microservices & API · Emna Trigui

**Groupe**

Rémi DELARUE, Romane CANO, Alexis DECHENAIS, Yasmine JAOU et Lina KHADLY.

[Suivre la procédure Windows de la validation Docker à la remise](docs/guide-windows.md).

## Démarrage local

Utiliser Python 3.12 avec SQLite 3.35 ou supérieur, depuis la racine du dépôt. La version de SQLite peut se vérifier avec `python -c "import sqlite3; print(sqlite3.sqlite_version)"`.

### Windows PowerShell

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### macOS ou Linux

```bash
python3.12 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- [Ouvrir l’interface web](http://127.0.0.1:8000/)
- [Ouvrir Swagger](http://127.0.0.1:8000/docs)
- [Consulter le contrat OpenAPI](http://127.0.0.1:8000/openapi.json)
- [Vérifier le démarrage](http://127.0.0.1:8000/health)

Au premier démarrage, le service crée `data/stages.sqlite3` si besoin. La variable `DATABASE_PATH` permet de choisir un autre fichier. Redémarrer le service avec le même fichier conserve les stages locaux.

## Endpoints

| Méthode | Chemin | Opération | Succès | Erreurs de requête |
|---|---|---|---|---|
| `GET` | `/stages` | Lister les stages par identifiant croissant. Renvoie `[]` si la base est vide. | `200` + tableau JSON | — |
| `GET` | `/stages/{id}` | Consulter un stage. | `200` + stage | `404` ou `422` |
| `POST` | `/stages` | Créer un stage. Le serveur génère l’identifiant et renseigne `Location`. | `201` + stage | `422` |
| `PUT` | `/stages/{id}` | Remplacer les cinq champs éditables d’un stage existant. | `200` + stage | `404` ou `422` |
| `DELETE` | `/stages/{id}` | Supprimer le stage désigné par l’identifiant. | `204` avec corps vide | `404` ou `422` |
| `GET` | `/health` | Confirmer que l’application sert les requêtes après son initialisation. | `200` + `{"status":"ok"}` | — |

Le corps de `POST` et de `PUT` exige les cinq champs de l’exemple. Les textes sont nettoyés aux extrémités, puis vérifiés. Les longueurs maximales sont de 120 caractères pour `nom_etudiant`, 160 pour `entreprise_accueil` et 240 pour `intitule_stage`. Les dates sont des dates calendaires `AAAA-MM-JJ`. La fin peut tomber le même jour que le début ou après. Les champs supplémentaires et les identifiants hors bornes sont rejetés. Les identifiants de chemin sont des entiers positifs écrits en chiffres.

**Exemple de corps JSON pour `POST /stages`**

```json
{
  "nom_etudiant": "Étudiant Démo",
  "entreprise_accueil": "Atelier Nuage Démo",
  "intitule_stage": "Concevoir un tableau de bord de suivi",
  "date_debut": "2027-02-01",
  "date_fin": "2027-07-30"
}
```

**Réponse `201` avec `Location: /stages/1` pour une base neuve**

```json
{
  "id": 1,
  "nom_etudiant": "Étudiant Démo",
  "entreprise_accueil": "Atelier Nuage Démo",
  "intitule_stage": "Concevoir un tableau de bord de suivi",
  "date_debut": "2027-02-01",
  "date_fin": "2027-07-30"
}
```

Utiliser l’`id` retourné pour les opérations suivantes. Pour `PUT`, reprendre les cinq champs du corps de création et modifier les valeurs souhaitées. Une ressource absente renvoie `404` et `{"detail":"Stage introuvable."}`. Une requête invalide renvoie `422` et une liste d’erreurs de validation dans `detail`.

## Architecture

Une requête HTTP arrive dans FastAPI. Pydantic transforme et valide les champs du stage. `sqlite3` exécute les opérations avec des paramètres liés et une transaction par opération. Toutes les routes partagent un même fichier SQLite dans une instance Uvicorn. Cette structure convient au seul domaine métier du projet et permet de tester la persistance avec un fichier temporaire.

| Emplacement | Rôle |
|---|---|
| `app/main.py` | Routes HTTP, réponses et initialisation au démarrage |
| `app/schemas.py` | Schémas d’entrée et de sortie, dates et règles de validation |
| `app/database.py` | Création de la table et accès SQLite |
| `app/web/` | Interface HTML/CSS/JavaScript, servie à `/`, appels à la même API |
| `tests/` | Tests unitaires et HTTP avec FastAPI TestClient |
| `Dockerfile`, `.dockerignore`, `render.yaml` | Image Docker et configuration du service Render |
| `.github/workflows/ci.yml` | Ruff, tests, couverture, construction Docker et test HTTP du conteneur |
| `scripts/verifier_service.py` | Contrôle du CRUD sur un service HTTP en cours d’exécution |
| `scripts/verifier-windows.ps1` | Construction et validation du conteneur, contrôle Render et mise à jour des liens |
| `docs/`, `preuves/` | Instructions, conformité, démonstration et résultats locaux |

## Tests et couverture

Avec l’environnement virtuel du projet activé, exécuter les commandes suivantes. Sous PowerShell, on peut utiliser directement `.\.venv\Scripts\python.exe` à la place de `python`.

```bash
python -m pip install -r requirements-dev.txt
python -m ruff check app tests scripts
python -m pytest -v
python -m pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=80
```

Chaque test d’intégration ouvre sa propre base SQLite temporaire et lance le cycle de vie de FastAPI avec `TestClient`. Le rapport HTML de `pytest-cov` est généré dans `htmlcov/`. Les résultats obtenus et les contrôles en attente figurent dans le [rapport de vérification](docs/verification.md).

La logique de l’interface a ses tests séparés, exécutables avec Node 24 : `node --test tests/test_web_logic.mjs`. Ils vérifient les dates, les statuts, les recherches combinées, l’échappement HTML et la protection du CSV contre les formules. Node n’est pas requis pour exécuter l’image Docker : les fichiers web sont servis directement par FastAPI.

## Docker et Render

Avec Docker Desktop démarré sous Windows ou Docker Engine sous Linux, lancer les commandes depuis la racine du projet.

```bash
docker build --tag gestion-stages-api:local .
docker run --detach --name gestion-stages --publish 127.0.0.1:8000:8000 gestion-stages-api:local
```

Ouvrir [Swagger dans le conteneur](http://127.0.0.1:8000/docs), puis suivre le [guide Docker et Render](docs/deploiement.md). Les commandes sont identiques sous PowerShell et Bash. Le conteneur écoute sur `0.0.0.0` et prend le port de `PORT` lorsque la variable est fournie.

**Dépôt GitHub** · [https://github.com/Remi26d/ISIS_-gestion-stages-api](https://github.com/Remi26d/ISIS_-gestion-stages-api)

**URL publique Render** · [Ouvrir l’application](https://isis-gestion-stages-api.onrender.com/) · [Swagger](https://isis-gestion-stages-api.onrender.com/docs) · [Sonde de disponibilité](https://isis-gestion-stages-api.onrender.com/health).

Le service `isis-gestion-stages-api` utilise Docker sur le plan **Free**, en région **Francfort**. Les [preuves](docs/preuves.md) conservent les vérifications de l’API et de l’interface, avec leurs dates et commits. L’interface, l’API et Swagger sont servis dans le même conteneur. Les commits limités aux preuves peuvent porter `[skip render]` pour conserver l’image en cours ; un changement applicatif doit être déployé et vérifié.

Sur Render Free, le fichier SQLite est recréé au besoin. Les modifications locales sont perdues au redéploiement, au redémarrage ou à la mise en veille. Les endpoints sont publics et destinés aux stages fictifs. Un usage réel demanderait une authentification, des autorisations, une journalisation adaptée et un stockage durable. [Documentation Render Free](https://render.com/docs/free)

## Dossier de remise

- [Matrice de conformité](docs/conformite.md)
- [Captures réalisées et preuves à compléter](docs/preuves.md)
- [Scénario de démonstration et organisation du groupe](docs/demonstration.md)
