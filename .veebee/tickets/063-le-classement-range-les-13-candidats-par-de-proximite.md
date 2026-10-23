---
id: "063"
title: Le classement range les 13 candidats par % de proximité
milestone: null
depends_on: ["061"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur lit le classement des 13 candidats, du plus proche au plus éloigné de ses réponses.

## Ce qu'il voit
Dans « Ton classement » (« proximité, en % », maquettes/resultats.html), 13 lignes numérotées de 1 à 13 montrent chacune un pion, le nom du candidat et son pourcentage, de 81 % pour François Ruffin à 22 % pour Éric Zemmour.

## C'est fini quand
- [ ] Avec 23 réponses, « Ton classement » montre 13 lignes numérotées de 1 à 13, du plus haut pourcentage au plus bas : 1 François Ruffin 81 %, 2 David Lisnard 76 %, 3 Marine Tondelier 71 %, et ainsi de suite jusqu'à 13 Éric Zemmour 22 %.
- [ ] Les 13 candidats du lancement y figurent tous, une seule fois chacun : Le Pen, Mélenchon, Philippe, Glucksmann, Retailleau, Lisnard, Attal, Zemmour, Tondelier, Roussel, Dupont-Aignan, Ruffin, Arthaud.

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)
- "**Score global** : % du maximum possible." (SPEC.md, section « Méthode de calcul (publiée) »)
- "**Liste au lancement (au 23/10/2026)** — 13 candidats :" (SPEC.md, section « Candidats »)
- "Pas de classement entre utilisateurs, pas de badges gadgets." (SPEC.md, section « Ludique »)
- "**Mes résultats** : classement en %, fiabilité, carte 2 axes, détail par thème." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- Comment le % se calcule : option voisine (064), option hors échelle (065), importance (066), position inconnue (067), « Je ne sais pas » (068).
- La barre sous chaque nom : 069. Le pion : 070. La fiabilité : 071. « Ce n'est pas un sondage » : 072. Le classement avant 10 réponses : 073.
- Toucher un candidat pour ouvrir sa fiche : 123.
- Un candidat retiré ou ajouté en cours de route : 135 et 140.
- À trancher : l'ordre de deux candidats à égalité de pourcentage (SPEC.md ne le dit pas, non prévu par le découpage).
