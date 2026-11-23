# Vérification visuelle du 23 novembre 2026

Version 1.2, source du commit `c31a9aeee3262532dfec4c9832663735747c2b33`.

## Prévisualisation

Les captures `02-interface-preview.jpg` et `03-guide-preview.jpg` proviennent du navigateur sur `http://127.0.0.1:4173/`, via le serveur de prévisualisation du projet. Elles ne sont pas des captures du service Render public.

- Logo original fourni affiché sans modification du fichier ; couleurs corail/violet dans l’accueil, la navigation, les boutons, les statuts et le graphique.
- Six exemples fictifs créés par le bouton explicite de démonstration : total 6, deux stages en cours, deux à venir, deux terminés au moment de l’ajout.
- Navigation vers `/guide` depuis le lien « Comprendre le projet ».
- Cinq cas de l’explorateur HTTP essayés : POST 201, PUT 200, DELETE 204, GET 404 et POST 422. Les réponses affichées correspondent au cas sélectionné. Ce composant pédagogique n’appelle pas le serveur.
- Contrôle à 340 pixels CSS obtenu par zoom du navigateur : largeur du document 337 pixels, absence de débordement global pour l’application et le guide, menu compact accessible et lien vers le guide visible. Il ne s’agit pas d’un essai sur téléphone physique.
- Le contrôle de console a renvoyé des erreurs de l’extension du navigateur, sans erreur applicative constatée lors des parcours observés. Cela ne constitue pas un audit exhaustif du navigateur.

## PDF

Huit pages générées et rendues pour une inspection visuelle de chacune : titres, tableaux, logo, textes, pied de page et pagination contrôlés. Après ajustement des espacements, les deux pages modifiées ont été rendues et inspectées de nouveau.

Le bouton « Télécharger le guide PDF » a produit un fichier identique octet pour octet au PDF du dépôt.

SHA-256 : `7854a1274030d31ab671b18a49d61c9c2889c90c17d3cc3405ee7897c1ccb74b`.

## Contraste de quelques éléments

Rapports calculés à partir des couleurs déclarées, sans prétendre à un audit complet d’accessibilité : bouton principal blanc/violet 6,54:1 ; texte principal 13,84:1 ; texte secondaire sur blanc 5,25:1 ; statut actif 5,72:1 ; statut à venir 5,10:1.

Les résultats Python et Docker correspondants figurent dans `01-actions.txt`. La validation Render est traitée séparément pour ne pas confondre prévisualisation, CI et service public.

## Version publique Render

Après passage à Live du déploiement `dep-dc23mlmc6qcc73beeq60`, le navigateur a affiché le nouveau thème et le lien vers le guide. Six exemples fictifs ont été ajoutés depuis le bouton de démonstration ; l’accueil final affiche 6 stages et la répartition 2 / 2 / 2. Le stage temporaire du contrôle HTTP a été supprimé, sans supprimer les exemples.

Le guide a été ouvert à `https://isis-gestion-stages-api.onrender.com/guide`. Son cas explicatif 422 a été sélectionné. Le téléchargement du PDF public a produit les mêmes octets et le même SHA-256 que le PDF du dépôt. `06-interface-public.jpg` et `07-guide-public.jpg` sont des captures originales de cette version publique. La capture du tableau de bord conserve la fenêtre visible ; une première tentative de capture pleine page a expiré et n’est pas présentée comme réussie.
