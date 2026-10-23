---
id: "158"
title: La page À propos dit ce que fait l'IA
milestone: null
depends_on: ["155"]
design: maquettes/a-propos.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux savoir si l'IA décide à la place de l'auteur.

## Ce qu'il voit
La section « L'IA : ce qu'elle fait, ce qu'un humain vérifie » (maquettes/a-propos.html) : un texte franc sur l'usage de l'IA et les lignes rouges, l'étiquette « Animation générée avec IA, contenu vérifié par un humain » et deux colonnes, « L'IA prépare » et « Un humain décide ».

## C'est fini quand
- [ ] La section dit que l'auteur utilise l'IA pour un premier jet et pour relire, qu'elle « ne décide de rien » et qu'un humain vérifie chaque chiffre avant publication.
- [ ] Les deux colonnes se lisent ainsi : « L'IA prépare » = un premier jet à partir de sources officielles, le contrôle de neutralité avec trois points de vue, l'animation des vidéos ; « Un humain décide » = vérifier chaque chiffre, vérifier chaque position de candidat, trancher sur chaque remarque du contrôle.
- [ ] La section annonce les lignes rouges (jamais de visage ni de voix de personnes réelles générés par IA ; les chiffres des vidéos viennent de la fiche vérifiée, jamais d'une IA) et affiche « Animation générée avec IA, contenu vérifié par un humain ».

## Les règles
- « L'IA rédige un premier jet à partir de sources officielles. » (SPEC.md, section « Production du contenu »)
- « L'auteur vérifie chaque chiffre et chaque position de candidat. » (SPEC.md, section « Production du contenu »)
- « Contrôle automatique de neutralité par IA avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte. » (SPEC.md, section « Production du contenu »)
- « Lignes rouges IA : jamais de visage ni de voix de personnes réelles générés par IA. Mention « Animation générée avec IA, contenu vérifié par un humain ». » (SPEC.md, section « Réseaux sociaux »)
- « Les chiffres affichés viennent de la fiche vérifiée, jamais d'une IA générative vidéo. » (SPEC.md, section « Réseaux sociaux », ligne sur les vidéos)

## Hors ticket
- La mention IA sur chaque image des vidéos (227) et les vidéos elles-mêmes (220 à 229) : cette section les décrit seulement.
- Le contrôle de neutralité (201 à 206).
- À trancher : le premier jet des fiches par IA est-il un outil dans le produit, ou un simple usage d'un assistant ? (trou du découpage). La page dit seulement que l'IA aide à écrire un premier jet.
