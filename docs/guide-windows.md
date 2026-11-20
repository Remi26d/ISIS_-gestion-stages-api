# Réaliser et remettre le projet sous Windows

## Si Fetch origin affiche Could not resolve host: github.com

Ce message indique un échec de résolution DNS de `github.com` sur le PC. Il ne signifie pas que le dépôt a été supprimé. L’application web reste utilisable directement dans le navigateur : [ouvrir l’interface](https://isis-gestion-stages-api.onrender.com/).

1. Fermer la fenêtre d’erreur de GitHub Desktop. Dans Chrome, essayer d’ouvrir `https://github.com`.
2. Ouvrir **Windows PowerShell en administrateur** depuis le menu Démarrer. Exécuter les deux lignes suivantes, une par une. La première vide le cache DNS ; la seconde vérifie si le PC retrouve l’adresse de GitHub.

   ```powershell
   ipconfig /flushdns
   nslookup github.com
   ```

3. Fermer puis rouvrir GitHub Desktop et réessayer **Fetch origin**, puis **Pull origin** si proposé.
4. Si `nslookup` échoue encore, essayer une autre connexion, par exemple le partage de connexion du téléphone, puis relancer Fetch. Un réseau filtré, un DNS défaillant ou une configuration VPN/proxy peuvent nécessiter un diagnostic du réseau utilisé.

Le dépôt existant doit être conservé. Les mises à jour publiées à distance ne dépendent pas de la réussite de Fetch sur ce PC. [Diagnostic DNS Microsoft](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues) · [Clear-DnsClientCache](https://learn.microsoft.com/powershell/module/dnsclient/clear-dnsclientcache)

## Situation actuelle et dernières actions sur le PC

Le dépôt [Remi26d/ISIS_-gestion-stages-api](https://github.com/Remi26d/ISIS_-gestion-stages-api) est publié. Les tests GitHub Actions et Docker ont réussi. Le service Docker **Free** est déployé et [Swagger public](https://isis-gestion-stages-api.onrender.com/docs) a été testé avec création, lecture, modification, suppression et réponse `404`. Les captures publiques sont déjà dans `preuves/render/captures/`.

Les étapes 1 à 6 plus bas décrivent une installation reproductible. Pour ce dépôt déjà créé, il reste seulement à récupérer les changements et à compléter les captures accessibles depuis le PC :

1. Ouvrir **GitHub Desktop**, sélectionner `ISIS_-gestion-stages-api`, cliquer **Fetch origin**, puis **Pull origin** si ce bouton apparaît.
2. Choisir **Repository → Show in Explorer**. Dans la barre d’adresse de ce dossier, saisir `powershell`, puis appuyer sur Entrée. La fenêtre doit être ouverte au niveau de `Dockerfile`, `app/` et `scripts/`.
3. Ouvrir Docker Desktop et attendre le moteur démarré. Dans cette fenêtre PowerShell, relancer les deux commandes de la section 3. Attendre **Validation terminée.** Faire une capture du terminal avec la ligne du conteneur actif, son port et les contrôles réussis ; l’enregistrer dans `preuves/docker/01-conteneur.png`.
4. Ouvrir [Swagger local](http://127.0.0.1:8000/docs). Déplier **POST /stages → Try it out → Execute**. Faire défiler jusqu’à **Request URL**, **Server response**, le code `201` et le corps retourné. Enregistrer `preuves/docker/02-swagger-creation-201.png`. Cette capture valide précisément l’ouverture de Swagger dans le conteneur local.
5. Ouvrir [le service Render existant](https://dashboard.render.com/web/srv-dc000o142hec738a2lhg), puis **Events**. Capturer l’événement **Live**, le nom du service et le commit ; enregistrer `preuves/render/01-deploiement-live.png`.
6. Dans GitHub Desktop, sélectionner ces captures, saisir `[skip render] Ajouter les captures locales et Render` dans **Summary**, puis **Commit to main → Push origin**. Donner à l’enseignante l’accès au dépôt privé avec son identifiant GitHub confirmé avant la remise.

Le terminal du PC et le tableau de bord connecté n’ont pas été capturés à distance. Le journal Docker fourni par le groupe, les résultats Actions, le reçu Render et les captures du service public sont déjà joints. Les détails figurent dans [preuves.md](preuves.md).

## 1. Installer deux applications

| Application | Action |
|---|---|
| Docker Desktop | Télécharger l’installateur Windows, choisir **x86_64** si Windows indique un système x64, ou **Arm** si Windows indique ARM64. Garder le moteur **WSL 2**. Ouvrir Docker Desktop et attendre que le moteur soit démarré. |
| GitHub Desktop | Installer la version Windows. Dans **File → Options → Accounts**, choisir **Sign in** pour GitHub.com et terminer la connexion dans le navigateur. |
| Explorateur, Windows PowerShell, navigateur et Outil Capture d’écran | Utiliser les applications déjà présentes sur le PC. Render et Swagger s’ouvrent dans le navigateur. Python est fourni par l’image Docker pour les contrôles HTTP et par GitHub Actions pour la suite de tests. |

[Télécharger Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) · [Télécharger GitHub Desktop](https://desktop.github.com/download/) · [Connecter GitHub Desktop](https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/authenticating-to-github-in-github-desktop)

Si Docker signale que WSL doit être mis à jour, ouvrir **Windows PowerShell** en administrateur, lancer `wsl --update`, puis relancer Docker Desktop. Si WSL est absent, utiliser `wsl --install --no-distribution` en administrateur et redémarrer le PC. [Instructions WSL](https://learn.microsoft.com/windows/wsl/basic-commands)

## 2. Préparer le dossier du dépôt

1. Dans GitHub Desktop, ouvrir **File → New repository**. Saisir `gestion-stages-api` dans **Name** et garder le dossier parent indiqué dans **Local path**. Laisser la création du README décochée, **Git ignore** et **License** sur **None**, puis cliquer **Create repository**.
2. Cliquer **Repository → Show in Explorer**. C’est le dossier dans lequel le code doit être copié.
3. Dans l’Explorateur, faire **Extraire tout** sur `gestion-stages-api.zip`. Ouvrir le dossier extrait jusqu’à voir `Dockerfile`, `README.md` et `render.yaml`. Sélectionner tout leur dossier avec `Ctrl+A`, copier avec `Ctrl+C`, puis coller le contenu dans le dossier ouvert par GitHub Desktop. `Dockerfile`, `render.yaml`, `.github` et `app` se trouvent directement à la racine du dépôt.
4. Dans la barre d’adresse de l’Explorateur sur cette racine, saisir `powershell` et valider. La nouvelle fenêtre PowerShell doit être ouverte dans le dossier qui contient `Dockerfile`.

[Créer un dépôt avec GitHub Desktop](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop)

## 3. Construire le conteneur et démontrer le CRUD

Laisser Docker Desktop ouvert et coller ces deux lignes dans PowerShell. `Unblock-File` s’applique au seul script du projet. `RemoteSigned` règle la politique du processus PowerShell lancé par la seconde commande. [Portée des stratégies PowerShell](https://learn.microsoft.com/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-5.1)

```powershell
Unblock-File -LiteralPath .\scripts\verifier-windows.ps1
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\verifier-windows.ps1
```

Le script construit l’image, démarre `gestion-stages-verification`, teste le port publié et exécute le CRUD dans le conteneur. Attendre **Validation terminée.** Il laisse le conteneur disponible et ouvre Swagger à l’adresse [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). Le journal se trouve dans `preuves/docker/00-validation-docker.txt`.

Ouvrir **Outil Capture d’écran**. Cliquer **Nouveau**, sélectionner la zone voulue puis utiliser `Ctrl+S` pour enregistrer l’image. Capturer le terminal avec la ligne du conteneur actif et les contrôles réussis dans `preuves/docker/01-conteneur.png`.

Dans Swagger, déplier chaque route, cliquer **Try it out**, compléter les champs indiqués puis **Execute**.

| Ordre | Route | Saisie | Résultat à contrôler |
|---|---|---|---|
| 1 | `POST /stages` | Garder le corps JSON fictif proposé par Swagger. | `201`. Relever l’`id` dans **Response body** et prendre `preuves/docker/02-swagger-creation-201.png`. |
| 2 | `GET /stages` | Aucun paramètre. | `200`. Le stage figure dans la liste. |
| 3 | `GET /stages/{id}` | Saisir l’`id` relevé. | `200`. Le corps correspond au stage créé. |
| 4 | `PUT /stages/{id}` | Garder le même `id` et le corps complet de l’exemple. Remplacer `intitule_stage` par `Tableau de bord de démonstration`. | `200`. L’intitulé modifié est renvoyé. |
| 5 | `DELETE /stages/{id}` | Garder le même `id`. | `204`. Le corps est vide. |
| 6 | `GET /stages/{id}` | Garder le même `id` après suppression. | `404`. Le message est `Stage introuvable.` |

Utiliser des données fictives pour la démonstration. Si le port 8000 est occupé, fermer le serveur local qui l’utilise puis relancer la commande. Relancer la validation locale remplace le conteneur de vérification créé par le script et réinitialise sa base de démonstration. Garder Docker Desktop ouvert jusqu’au contrôle Render.

## 4. Publier le code et vérifier la CI

1. Dans GitHub Desktop, ouvrir **Changes**. Saisir `Livrer l’API de gestion des stages` dans **Summary**, puis cliquer **Commit to main**.
2. Cliquer **Publish repository**. Garder **Keep this code private** et publier dans le compte du groupe ou du membre référent. Pour la remise, inviter l’enseignante au dépôt avec son identifiant GitHub confirmé dans **Settings → Collaborators → Add people**. Elle doit pouvoir ouvrir le dépôt.
3. Ouvrir **Repository → View on GitHub**. Copier l’adresse du dépôt. Sur GitHub, ouvrir **Actions → Qualité et Docker**, puis le lancement du commit publié. Attendre le résultat vert et déplier la couverture. Enregistrer `preuves/03-actions-et-couverture.png`. Si un contrôle échoue, ouvrir l’étape correspondante et relever son message avant de poursuivre le déploiement.

[Publier depuis GitHub Desktop](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop#part-4-publishing-your-repository-to-github) · [Donner accès au dépôt](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository)

## 5. Déployer via le fichier Render fourni

1. Ouvrir le [tableau de bord Render](https://dashboard.render.com/) et utiliser la connexion GitHub.
2. Cliquer **New → Blueprint**. Choisir **Connect** à côté du dépôt `gestion-stages-api`. Si Render lance l’autorisation de l’application GitHub, sélectionner **Only select repositories**, puis le dépôt du projet.
3. Renseigner **Blueprint Name** avec `gestion-stages-isis`, choisir la branche `main` et laisser **Blueprint Path** sur `render.yaml`. Vérifier que la liste prévoit un **Web Service Docker Free**. Cliquer **Deploy Blueprint**. Le fichier définit le plan, `/health` et le déclenchement après réussite de la CI.
4. Ouvrir le service créé, puis **Events**. Attendre **Live**. Enregistrer `preuves/render/01-deploiement-live.png` avec le déploiement et le commit visibles. Copier l’URL HTTPS `onrender.com` affichée par Render.

[Procédure officielle Blueprint](https://render.com/docs/infrastructure-as-code#setup) · [Connexion GitHub à Render](https://render.com/docs/git-provider)

## 6. Valider le service public et finir la remise

Dans la même fenêtre PowerShell, coller les lignes suivantes et fournir les deux adresses quand elles sont demandées.

```powershell
$github = Read-Host 'Lien HTTPS du dépôt GitHub'
$render = Read-Host 'URL HTTPS du service Render'
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\verifier-windows.ps1 -UrlGitHub $github -UrlRender $render
```

Le script vérifie le CRUD public, enregistre `preuves/render/03-parcours-http.txt` et renseigne les deux liens dans le README après réussite. Il ouvre Swagger sur Render. Exécuter `GET /stages` et enregistrer `preuves/render/02-swagger-et-crud-public.png` avec l’adresse HTTPS et le `200` visibles.

Revenir à GitHub Desktop. Dans **Changes**, vérifier les nouveaux éléments, saisir `[skip render] Ajouter les liens et preuves de déploiement`, cliquer **Commit to main** puis **Push origin**. Ce message conserve le déploiement en cours sur le service créé directement. Le filtre du fichier Blueprint n’agit que sur un service auquel ce Blueprint a été appliqué. Vérifier une dernière fois que le lien Render du README ouvre le bon service et que l’enseignante peut accéder au dépôt. La [checklist des preuves](preuves.md) récapitule les fichiers à joindre.
