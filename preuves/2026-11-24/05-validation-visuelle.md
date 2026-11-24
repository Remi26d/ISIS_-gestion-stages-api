# Vérification de la visite guidée — 24 novembre 2026

Source applicative : `b449de80dbc63c273cb93603e4cbec92645f859c`, version 1.3.0.

## Prévisualisation dans Chrome

La visite s’est ouverte après le chargement initial. Les six étapes ont été parcourues jusqu’à Terminer : indicateurs, création, liste, calendrier, export et aide. Les cibles et les textes changent avec l’étape. Aucune donnée n’est écrite par la visite.

Les contrôles Précédent, Suivant, Passer et la fermeture ont été utilisés. La flèche droite passe à l’étape suivante ; Échap ferme la fenêtre. Une relance depuis la liste revient à cette vue à la fermeture et restitue le focus au bouton de lancement.

Après fermeture puis rechargement, la visite ne réapparaît pas automatiquement. Le bouton ? permet de la relancer. Les six cartes sont restées dans la fenêtre à 1363 × 936 pixels CSS.

À 400 % de zoom, la fenêtre mesurait 340 × 234 pixels CSS. Les six cartes mesuraient au maximum 316,75 × 210 pixels CSS et tenaient dans la fenêtre. Le texte intérieur peut défiler, les boutons restent accessibles. Un débordement de l’en-tête a été corrigé ; la largeur du document mesurée ensuite était de 340 pixels pour 340 pixels de fenêtre. Ce contrôle par zoom ne remplace pas un essai sur téléphone physique.

## Service public Render

La visite s’est ouverte automatiquement sur le domaine public. Le passage à l’étape Ajouter un stage puis la fermeture ont été observés. Au rechargement, la visite est restée fermée. La capture 03 est l’original de l’étape 2.

Swagger public a créé un stage fictif, réponse 201, identifiant 2 et en-tête Location /stages/2. Sa suppression a renvoyé 204. Le contrôle HTTP séparé a créé puis supprimé le stage d’identifiant 1.

Après ces essais, les six exemples ont été ajoutés depuis l’interface publique et sa confirmation. Le tableau de bord affiche 6 stages : 2 en cours, 2 à venir et 2 terminés. La capture 04 est l’original de cette vue, avec une partie du tableau sous la limite inférieure de la fenêtre. Aucune capture n’a été recomposée.

Le reçu JSON et les journaux documentent le déploiement et les contrôles automatisés. La base Render Free reste éphémère ; ces résultats sont ceux du 24 novembre 2026.

## Rapport final

Le rapport est fourni séparément en PDF et DOCX. Les dix pages ont été rendues et inspectées. Les liens externes et le renvoi au JSON de la page 4 ont été contrôlés. Il reprend les résultats du code applicatif ci-dessus et distingue les limites de la démonstration des possibilités futures.
