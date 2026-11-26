# Vérifier le projet sous Windows

Le dépôt et le service Render existent déjà. Les étapes suivantes permettent de récupérer le code, de refaire les essais et, si nécessaire, d’ajouter des captures prises sur le PC.

## 1. Récupérer le dépôt

Dans GitHub Desktop, sélectionner `ISIS_-gestion-stages-api`, puis cliquer sur **Fetch origin** et **Pull origin** si une mise à jour est proposée. Pour installer le projet sur un autre PC, choisir **File → Clone repository → URL** et coller cette adresse :

```text
https://github.com/Remi26d/ISIS_-gestion-stages-api
```

Choisir ensuite **Repository → Show in Explorer**. Le dossier ouvert doit contenir directement `Dockerfile`, `README.md`, `app/` et `scripts/`. Dans sa barre d’adresse, saisir `powershell`, puis appuyer sur Entrée.

Vérifier le dossier de travail dans la fenêtre PowerShell :

```powershell
Get-Location
Test-Path -LiteralPath .\scripts\verifier-windows.ps1
```

La seconde commande doit renvoyer `True`. Si le chemin affiché se termine déjà par `\scripts`, remonter d’un dossier, puis refaire la vérification :

```powershell
Set-Location ..
Test-Path -LiteralPath .\scripts\verifier-windows.ps1
```

Un fichier ZIP doit être extrait avant utilisation. Copier un ZIP dans le dépôt ne suffit pas à y installer les fichiers du projet. Pour ce dépôt publié, le clonage évite cette étape.

## 2. Construire et vérifier le conteneur

Ouvrir Docker Desktop et attendre que le moteur Linux soit démarré. Depuis la racine du dépôt, exécuter les commandes suivantes :

```powershell
Unblock-File -LiteralPath .\scripts\verifier-windows.ps1
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\verifier-windows.ps1
```

Le script construit l’image, lance le conteneur `gestion-stages-verification`, publie son port sur `127.0.0.1:8000` et vérifie le CRUD. Il utilise le Python du conteneur ; aucune installation locale de Python n’est nécessaire pour ce parcours. Le message **Validation terminée.** confirme la fin des contrôles. Le journal est enregistré dans `preuves/docker/00-validation-docker.txt`.

Le conteneur reste actif et Swagger s’ouvre sur [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). Une nouvelle validation locale remplace le conteneur d’essai et sa base. Si le port 8000 est occupé, arrêter le serveur qui l’utilise avant de relancer le script.

## 3. Refaire le parcours dans Swagger

Déplier chaque route, cliquer sur **Try it out**, renseigner les champs puis choisir **Execute**. Utiliser uniquement des informations fictives.

| Ordre | Requête | Action et résultat attendu |
|---|---|---|
| 1 | `POST /stages` | Envoyer l’exemple proposé. Attendre `201` et relever l’`id` retourné. |
| 2 | `GET /stages` | Vérifier la présence du stage dans le tableau, avec un code `200`. |
| 3 | `GET /stages/{id}` | Utiliser l’identifiant relevé et vérifier le détail, code `200`. |
| 4 | `PUT /stages/{id}` | Envoyer les cinq champs en modifiant l’intitulé. Vérifier le résultat, code `200`. |
| 5 | `DELETE /stages/{id}` | Supprimer le même stage. Attendre `204` et un corps vide. |
| 6 | `GET /stages/{id}` | Réutiliser l’identifiant supprimé. Attendre `404` et `Stage introuvable.` |

Pour compléter les preuves locales, capturer le terminal avec le conteneur actif et les contrôles réussis, puis la réponse Swagger `201` avec l’URL locale, l’identifiant et le corps visibles. Les chemins proposés sont `preuves/docker/01-conteneur.png` et `preuves/docker/02-swagger-creation-201.png`. Ces fichiers ne sont pas encore joints au dépôt.

## 4. Vérifier le service public

L’application est accessible sur [Render](https://isis-gestion-stages-api.onrender.com/), sans Docker Desktop ni GitHub Desktop. Pour rejouer le contrôle public automatisé, conserver le conteneur d’essai de l’étape 2 et exécuter :

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\verifier-windows.ps1 -UrlGitHub 'https://github.com/Remi26d/ISIS_-gestion-stages-api' -UrlRender 'https://isis-gestion-stages-api.onrender.com'
```

Le script crée puis supprime son propre stage fictif sur Render. Il enregistre le résultat dans `preuves/render/03-parcours-http.txt` et ouvre Swagger public. Les adresses sont consignées dans le journal ; le README n’est pas modifié.

Dans le [tableau de bord du service existant](https://dashboard.render.com/web/srv-dc000o142hec738a2lhg), ouvrir **Events** pour consulter le déploiement. Une capture de l’événement **Live**, du service et de la version complète les traces déjà conservées. Elle peut être enregistrée dans `preuves/render/01-deploiement-live.png`.

Il n’est pas nécessaire de créer un nouveau Blueprint. La [procédure de déploiement](deploiement.md) distingue le service actuel de cette configuration alternative.

## 5. Publier des preuves supplémentaires

Dans GitHub Desktop, relire les fichiers affichés dans **Changes**. Pour un ajout de documentation, de captures ou de journaux uniquement, saisir `[skip render] Compléter les preuves de vérification` dans **Summary**, puis choisir **Commit to main → Push origin**. Ce préfixe conserve l’image applicative en cours sur Render.

Consulter ensuite l’onglet **Actions** du dépôt et vérifier le résultat du commit publié. Le dépôt est public ; aucune invitation n’est nécessaire pour le consulter. La liste des preuves déjà présentes se trouve dans [preuves.md](preuves.md).

## Résoudre un problème d’accès à GitHub

L’erreur `Could not resolve host: github.com` indique un problème de résolution DNS. Elle ne signifie pas que le dépôt a été supprimé. Dans Windows PowerShell lancé en administrateur, exécuter :

```powershell
ipconfig /flushdns
nslookup github.com
```

Si `nslookup` renvoie une adresse, fermer puis rouvrir GitHub Desktop et réessayer **Fetch origin**. Si l’erreur persiste, tester l’accès à GitHub dans le navigateur et sur une autre connexion, puis vérifier les réglages du VPN ou du proxy utilisé. Conserver le dépôt existant pendant ce diagnostic.

## Applications nécessaires

[Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) sert à exécuter les essais dans un conteneur Linux. [GitHub Desktop](https://desktop.github.com/download/) sert à synchroniser le dépôt. Windows PowerShell, l’Explorateur, un navigateur et l’Outil Capture d’écran suffisent pour le reste de cette procédure. Si Docker demande une mise à jour de WSL, suivre les [instructions Microsoft](https://learn.microsoft.com/windows/wsl/basic-commands).
