---
id: "200"
title: Corriger une fiche publiée ajoute une ligne au journal
milestone: null
depends_on: ["195", "172"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Je corrige une erreur dans une fiche déjà publiée, et la correction apparaît dans le journal public.

## Ce qu'il voit
Pas de maquette pour ce ticket. Le « Journal des corrections » gagne une ligne tout en haut, avec la date, la fiche concernée, l'avant et l'après.

## C'est fini quand
- [ ] Je corrige le chiffre « 0,4 % du PIB » en « 0,3 % du PIB » dans la question n° 13, déjà publiée : au journal, une nouvelle ligne est tout en haut, datée d'aujourd'hui, sur la question n° 13, avec l'avant (0,4 %) et l'après (0,3 %).
- [ ] Je corrige la position d'Attal sur la question n° 12, de l'option B à l'option C : au journal, une nouvelle ligne montre l'avant (option B) et l'après (option C).
- [ ] Je corrige une fiche datée de demain, pas encore publiée : le journal n'a aucune nouvelle ligne.

## Les règles
- Corrections : « Page publique **« Journal des corrections »** : date, fiche, avant/après, raison. »
- Production du contenu : « Contenu stocké en fichiers structurés (MDX/YAML) dans le repo Git : l'historique Git sert de base au journal des corrections. »
- Principes non négociables : « **Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement. »

## Hors ticket
- L'apparence du journal et de ses lignes (maquettes/journal.html) : la liste du plus récent au plus ancien, ticket 172 ; la fiche concernée, 173 ; l'avant et l'après, 174 ; la raison, 175 ; qui a repéré l'erreur, 176 ; le filtre, 177 ; l'état vide, 178.
- Une erreur signalée par un électeur : tickets 160 à 171.
- À trancher : comment l'auteur donne la raison de la correction (SPEC.md demande une raison sur chaque ligne sans dire où elle est saisie).
