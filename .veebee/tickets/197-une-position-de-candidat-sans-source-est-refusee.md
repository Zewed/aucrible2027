---
id: 197
title: Une position de candidat sans source est refusée
milestone: null
depends_on: ["195"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
J'ajoute une fiche où la position d'un candidat n'a pas de source, et je veux qu'elle soit refusée.

## Ce qu'il voit
Pas de maquette pour ce ticket. L'auteur voit que la fiche est refusée, avec le nom du candidat et la question concernés. Un candidat pour lequel il n'existe aucune source n'est pas une erreur : il reste en « position inconnue ».

## C'est fini quand
- [ ] Je tente d'ajouter la fiche de la question n° 24 en donnant à Marine Tondelier l'option E sans source : la fiche est refusée et le refus nomme Marine Tondelier.
- [ ] Je donne à cette position un lien et sa date (par exemple une déclaration du 02/10/2026) : la fiche est acceptée et paraît à sa date.
- [ ] Un lien sans date est refusé de la même façon.

## Les règles
- Principes non négociables : « **Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement. »
- Sources des positions des candidats : « Sans source : position « inconnue », exclue du calcul. On ne devine jamais. On ne sollicite pas les équipes de campagne. »

## Hors ticket
- Un candidat sans aucune source se range sous « Position inconnue » : ticket 024, et sa position est exclue du calcul : ticket 067. Ce n'est pas un refus.
- Le badge « officielle » ou « déduite » de chaque position : ticket 023.
- Un chiffre sans source : ticket 196. Le contrôle de neutralité : ticket 201.
- À trancher : si l'outil vérifie aussi le type de source (ordre de priorité, déclaration de moins de 12 mois). SPEC.md ne le dit pas ; la page Méthode l'explique au lecteur : tickets 147 et 148.
