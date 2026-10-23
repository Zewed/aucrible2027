import type { QuestionDuCalcul } from "@/lib/proximite";
import { JE_NE_SAIS_PAS, type Reponse } from "@/lib/reponses";

/** Une place sur le plateau : de −2 à +2 sur chaque axe (−2 : plus de redistribution, progressiste). */
export type Place = { economie: number; societe: number };

/**
 * La place de l'électeur (SPEC.md, « Méthode de calcul », Carte) : sur chaque axe, la moyenne de la note
 * des options qu'il a choisies, pondérée par l'importance donnée (×1 sans importance). « Je ne sais pas »
 * et une option sans note sur cet axe n'y entrent pas. Sans aucune note, il reste au centre de cet axe.
 */
export function placeDeLElecteur(questions: QuestionDuCalcul[], reponses: Record<number, Reponse>): Place {
  const sommes = { economie: { notes: 0, poids: 0 }, societe: { notes: 0, poids: 0 } };
  for (const question of questions) {
    const reponse = reponses[question.numero];
    if (!reponse || reponse.option === JE_NE_SAIS_PAS) continue;
    const axes = question.options.find((o) => o.id === reponse.option)?.axes;
    const poids = reponse.importance ?? 1;
    for (const axe of ["economie", "societe"] as const) {
      const note = axes?.[axe];
      if (note === undefined) continue;
      sommes[axe].notes += poids * note;
      sommes[axe].poids += poids;
    }
  }
  const moyenne = ({ notes, poids }: { notes: number; poids: number }) => (poids > 0 ? notes / poids : 0);
  return { economie: moyenne(sommes.economie), societe: moyenne(sommes.societe) };
}

/**
 * La place d'un candidat, par la même formule : sur chaque axe, la moyenne de la note de ses options sur
 * toutes les questions publiées où sa position est connue, chacune ×1 (un candidat ne donne pas
 * d'importance). Sans aucune note, il reste au centre de cet axe.
 */
export function placeDuCandidat(questions: QuestionDuCalcul[], candidat: string): Place {
  const sommes = { economie: { notes: 0, nombre: 0 }, societe: { notes: 0, nombre: 0 } };
  for (const question of questions) {
    const option = question.positions[candidat]?.option;
    const axes = option ? question.options.find((o) => o.id === option)?.axes : undefined;
    for (const axe of ["economie", "societe"] as const) {
      const note = axes?.[axe];
      if (note === undefined) continue;
      sommes[axe].notes += note;
      sommes[axe].nombre += 1;
    }
  }
  const moyenne = ({ notes, nombre }: { notes: number; nombre: number }) => (nombre > 0 ? notes / nombre : 0);
  return { economie: moyenne(sommes.economie), societe: moyenne(sommes.societe) };
}

/** Où poser une place sur le champ du plateau, en % : redistribution à gauche, progressiste en haut. */
export const surLeChamp = (place: Place) => ({ x: ((place.economie + 2) / 4) * 100, y: ((place.societe + 2) / 4) * 100 });
