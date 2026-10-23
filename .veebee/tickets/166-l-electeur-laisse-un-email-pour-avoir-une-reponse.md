---
id: "166"
title: L'électeur laisse un email pour avoir une réponse
milestone: null
depends_on: ["163"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
Je laisse mon e-mail pour qu'on me réponde.

## Ce qu'il voit
Le champ « Ton e-mail », marqué « facultatif », avec l'explication « Pour qu'on te réponde. Il ne sert qu'à ça. » (maquettes/signaler.html).

## C'est fini quand
- [ ] Le champ « Ton e-mail » porte l'étiquette « facultatif » et la phrase « Pour qu'on te réponde. Il ne sert qu'à ça. » est écrite dessous ; sans e-mail, l'envoi marche.
- [ ] Avec « marie@exemple.fr » saisi, l'auteur retrouve cette adresse dans sa boîte privée, à côté du signalement, pour pouvoir répondre ; elle n'apparaît nulle part en public (ni journal, ni fiche).

## Les règles
- « Réponse sous 72 h. » (SPEC.md, section « Corrections »)
- « « Signaler une erreur » arrive dans une boîte privée (pas publique, pour éviter les raids). » (SPEC.md, section « Corrections »)

## Hors ticket
- La réponse sous 72 h promise sur le formulaire : 170. La phrase « Si tu as laissé ton e-mail, on te répond sous 72 h. » après l'envoi : 167.
- Ce que le journal dit de l'origine d'une correction, sans jamais nommer la personne : 176.
- À trancher : combien de temps l'adresse est conservée. SPEC.md ne le dit pas.
