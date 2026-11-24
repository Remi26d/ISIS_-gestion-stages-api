# Utiliser l’interface web

## Visite guidée

À la première ouverture dans un navigateur, une visite en six étapes présente les indicateurs, le formulaire, la recherche, le calendrier, l’export et l’aide. Chaque étape désigne la zone concernée. Les boutons **Suivant**, **Précédent**, **Passer** et **Terminer** permettent de choisir le rythme ; Échap ferme la visite.

Le bouton **?**, dans la barre supérieure, relance la visite. La fermeture est mémorisée dans le stockage local du navigateur. Aucune donnée de stage n’est créée ou modifiée par le tutoriel. La vue et la position précédentes sont restaurées à la fermeture.

[Ouvrir l’application](https://isis-gestion-stages-api.onrender.com/) · [Swagger technique](https://isis-gestion-stages-api.onrender.com/docs)

Le logo ISIS fourni est conservé dans `app/web/isis-logo.jpg` ; les couleurs corail `#F46964` et violet `#804FDF` ont été relevées dans ce visuel. La couleur des boutons est assombrie pour préserver la lisibilité du texte blanc. `theme.css` rassemble les adaptations visuelles.

**Comprendre le projet**, dans la barre latérale, ouvre `/guide`. Le guide propose cinq exemples HTTP explicatifs, les choix d’architecture, les preuves, une trame de soutenance à cinq et un PDF téléchargeable. Les exemples du guide ne font aucun appel au CRUD.

L’interface est servie à la racine `/` par le même conteneur FastAPI que l’API. Elle ne demande ni installation, ni connexion GitHub Desktop pour être utilisée. Les vues, les indicateurs et les exports utilisent les stages réellement reçus de `/stages`. Aucun stage fictif n’est inséré automatiquement à l’ouverture.

## Les quatre vues

| Vue | Actions disponibles |
|---|---|
| Vue d’ensemble | Total, stages en cours, à venir et terminés ; répartition ; aperçu des parcours ; prochains débuts et fins de stage. Cliquer sur un indicateur pour filtrer la liste. |
| Les stages | Recherche sans distinction de casse ou d’accents sur l’étudiant, l’entreprise et la mission ; filtres combinables par entreprise et statut ; tri ; pagination ; détail, modification, suppression et export CSV. |
| Calendrier | Mois précédent, suivant et retour à aujourd’hui. Les événements distinguent les dates de début et de fin. Cliquer sur un événement pour ouvrir la fiche. |
| Entreprises | Entreprises déduites des stages existants, recherche et indicateurs par entreprise. Le bouton Consulter les stages ouvre la liste filtrée. |

## Créer, modifier et supprimer

1. Cliquer sur **Nouveau stage**. Renseigner le nom fictif de l’étudiant, l’entreprise fictive, l’intitulé et les deux dates. La durée calendaire s’affiche avant l’enregistrement.
2. Cliquer sur **Créer le stage**. Après confirmation du serveur, le formulaire se ferme et les vues sont actualisées.
3. Cliquer sur le nom dans la liste pour ouvrir la fiche détaillée. **Modifier** ouvre les cinq champs éditables ; le serveur conserve l’identifiant.
4. **Supprimer** ouvre une confirmation qui nomme le stage et l’entreprise. **Conserver le stage** annule l’opération ; **Supprimer le stage** envoie la requête à l’API. La suppression est définitive.

Les champs vides et les dates inversées sont signalés dans le formulaire. Les règles Pydantic de l’API s’appliquent aussi aux requêtes envoyées depuis l’interface. Une ressource supprimée par une autre personne provoque une actualisation de la liste et un message explicite.

## Explorer la démonstration

Lorsque la base est vide, **Essayer avec une démo** propose six stages fictifs, avec deux stages en cours, deux à venir et deux terminés à la date de leur ajout. **Ajouter les exemples** les enregistre dans la base partagée. Ils restent modifiables et supprimables comme les autres stages. Les exemples déjà présents avec les mêmes noms, entreprises et missions ne sont pas recréés lors d’un nouvel essai dans la même base.

Les statuts et l’avancement sont calculés à partir des dates calendaires du navigateur. Ils n’ajoutent aucun champ au schéma demandé et ne remplacent pas une validation pédagogique. Le jour de début et le jour de fin appartiennent au stage en cours. La durée inclut les deux dates.

## Exporter et actualiser

**Exporter** télécharge un CSV compatible avec les accents et les tableurs. Depuis Les stages, il contient tous les résultats filtrés, y compris les autres pages. Depuis les autres vues, il contient l’ensemble des stages. Les valeurs qui pourraient être interprétées comme des formules de tableur sont neutralisées.

L’icône d’actualisation en bas de page recharge la base partagée. L’heure indique le dernier chargement réussi. En cas de panne réseau, un message propose de réessayer et indique si les dernières données reçues restent affichées.

La navigation se replie sur petit écran. Les boutons et champs possèdent des libellés, le clavier permet d’utiliser les fenêtres de dialogue et Échap les ferme en dehors d’un enregistrement. Le raccourci `/` ouvre la recherche lorsqu’aucun champ ni dialogue n’a le focus.

## Installation et limites

Le `Dockerfile` copie `app/`, ce qui inclut `app/web/`. Aucune construction JavaScript, dépendance frontale externe ou ressource CDN n’est requise. `/docs`, `/openapi.json`, `/health` et le CRUD gardent leur rôle. Le script `scripts/verifier_service.py` contrôle également la livraison de l’accueil, du CSS, des modules JavaScript et des icônes dans le conteneur.

L’application est un espace pédagogique public avec des données fictives. Sur Render Free, le fichier SQLite est éphémère. Les données peuvent disparaître après veille, redémarrage ou redéploiement. Une utilisation durable avec de vraies données nécessiterait notamment une gestion des accès et un stockage persistant.
