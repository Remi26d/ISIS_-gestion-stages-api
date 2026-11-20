# Démonstration et préparation du groupe

## Déroulé en 6 min 15

Préparer le résultat des tests, le conteneur local et la page **Live** de Render. Réveiller le service gratuit en visitant `/health` avant de commencer. Pendant la démonstration, relever l’identifiant créé sur le serveur utilisé.

| Temps | À montrer | À expliquer |
|---|---|---|
| 0:00–0:40 | Le besoin métier et les six champs | Chaque stage est une ressource identifiable. Le serveur attribue l’`id`. |
| 0:40–1:05 | `app/main.py`, `app/schemas.py`, `app/database.py` | Les routes, la validation et le stockage sont trois responsabilités dans un même service. |
| 1:05–3:15 | Swagger local, `POST`, `GET` collection et détail, `PUT`, `DELETE`, puis `404` | Sur le même `id`, passer de la création à la suppression. Montrer le corps reçu et le code HTTP. |
| 3:15–4:05 | Sortie des tests et cas d’un `PUT` incomplet | La base est isolée à chaque test. Une saisie invalide ne modifie pas la ressource. |
| 4:05–5:00 | `Dockerfile`, image construite et conteneur actif | L’image fixe le contexte d’exécution. `PORT` fixe le port utilisé par Uvicorn. |
| 5:00–6:15 | Adresse HTTPS Render, `/docs` et une réponse HTTP publique | Le service est accessible depuis Internet. Le fichier SQLite de l’offre Free est éphémère. |

Répéter la séquence entière une fois avec la même version du dépôt. En cas de démarrage à froid pendant la présentation, ouvrir les captures du service public, poursuivre avec le conteneur local, puis revenir à l’URL quand `/health` répond.

## Notions du cours appliquées

| Notion | Application au projet | Support du cours |
|---|---|---|
| REST et contrat d’API | La collection est `/stages` et la ressource a une URI `/stages/{id}`. Les méthodes HTTP portent le CRUD. JSON transporte les données. OpenAPI décrit le contrat et Swagger l’affiche. | p. 23–27 |
| Cloud public et modèles de service | L’IaaS fournit de l’infrastructure à administrer, le PaaS héberge une application déployée par l’équipe et le SaaS fournit un logiciel prêt à utiliser. Render joue ici le rôle de PaaS pour une API accessible en HTTPS. | p. 4, 7–8, 12–13 |
| Docker | Le Dockerfile décrit la construction, l’image contient le code et son environnement, le conteneur exécute cette image localement ou chez Render. | p. 32–33 |
| Monolithe et microservices | Le CRUD des stages tient dans un composant déployé d’un bloc, avec une base. Les microservices découpent des domaines en services déployables indépendamment. Kubernetes orchestre des conteneurs à l’échelle d’un cluster. | p. 18–22, 34–35 |
| DevOps | Git trace les versions. La CI contrôle le dépôt. Render sert le commit déployé. Les journaux et le test HTTP vérifient son fonctionnement. | p. 8, 39–40 |
| Sécurité | Pydantic contrôle la saisie. SQL lie les paramètres. Le service public utilise des stages fictifs et le dépôt exclut les fichiers de données et d’environnement. Pour un usage réel, appliquer authentification, autorisation et traçabilité. | p. 28–29 |

## Répartition proposée

Les attributions sont une proposition de travail et de revue à valider en équipe.

| Membre | Sujet de préparation | Revue croisée |
|---|---|---|
| Rémi DELARUE | Architecture du service et contrat des routes | Relire SQLite et la validation avec Romane. |
| Romane CANO | SQLite, règles de saisie et données fictives | Relire les tests avec Alexis. |
| Alexis DECHENAIS | Suite de tests, couverture et contrôle CI | Construire et vérifier le conteneur avec Yasmine. |
| Yasmine JAOU | Docker, GitHub et Render | Rejouer la procédure de remise avec Lina. |
| Lina KHADLY | Guide, captures et déroulé oral | Rejouer les routes et expliquer les statuts avec Rémi. |

Chaque membre ouvre une revue sur la partie qu’il relit, exécute un parcours complet et explique une partie extérieure à son sujet lors de la répétition. Le groupe fait correspondre le commit, les tests, les captures et l’URL publique avant de rendre le projet.

## Questions possibles

| Question | Réponse courte |
|---|---|
| Pourquoi FastAPI ? | Les annotations définissent le contrat, Pydantic valide les données et FastAPI expose OpenAPI et Swagger. `TestClient` permet d’exercer les routes en test. |
| Pourquoi SQLite et la bibliothèque standard ? | L’énoncé demande SQLite. Un fichier suffit au service de démonstration et le module `sqlite3` donne accès aux transactions et aux requêtes paramétrées avec peu de code. |
| Que fait `PUT` ? | Il remplace les cinq champs d’une ressource existante et conserve son identifiant. Répéter le même corps conserve le même état. `POST` crée une nouvelle ressource avec un nouvel identifiant. |
| Pourquoi `404` ou `422` ? | `404` signifie qu’aucun stage ne correspond à un identifiant valide. `422` signale que le chemin ou le corps ne respecte pas les règles de validation. |
| Quel rôle jouent OpenAPI et Swagger ? | OpenAPI formalise méthodes, champs et réponses. Swagger UI affiche ce contrat et permet d’appeler l’API dans le navigateur. |
| Quelle différence entre Dockerfile, image et conteneur ? | Le Dockerfile contient les instructions de construction. L’image issue du build assemble le programme et ses dépendances. Le conteneur est une instance en exécution. |
| Pourquoi le port `PORT` ? | Render indique le port attendu avec cette variable. Uvicorn écoute sur toutes les interfaces du conteneur, ce qui permet à Render de lui transmettre les requêtes publiques. |
| Que se passe-t-il après la veille Render ? | Le service redémarre à la demande et initialise le schéma si nécessaire. Les données écrites dans le fichier SQLite éphémère sont perdues. |
| Pourquoi un service unique ? | Les routes partagent le même domaine, la même base et le même rythme de déploiement. Le découpage en plusieurs services impliquerait des communications et des opérations supplémentaires. |
| Quand Kubernetes devient-il utile ? | Lorsqu’il faut orchestrer un parc de conteneurs, automatiser leur déploiement et leur redémarrage sur un cluster. Ici, Render exécute le seul service Docker. |
| Que vérifie la CI ? | Le workflow vérifie le style, les tests, le seuil de couverture et le comportement de l’image Docker. Le déploiement Render publie ensuite le commit sélectionné selon le réglage d’auto-déploiement. |
| Comment la couverture a-t-elle été mesurée ? | La sortie locale compte 179 lignes applicatives exécutées avec `trace`. GitHub Actions utilise `pytest-cov` pour mesurer les lignes et branches et appliquer le seuil de 80 %. |
| Qu’ajouter pour un service réel ? | Authentification, rôles, journalisation, sauvegardes et stockage durable, avec une gestion adaptée des données d’étudiants. |
