import type { Candidat } from "@/lib/contenu";
import { JE_NE_SAIS_PAS, type Reponse } from "@/lib/reponses";

/** Ce que le calcul lit d'une question publiée : ses options, dans l'ordre, et les positions connues. */
export type QuestionDuCalcul = { numero: number; options: { id: string }[]; positions: Record<string, { option: string }> };

/** Un candidat du classement et sa proximité en % ; null tant qu'aucune réponse ne le concerne. */
export type Proximite = { candidat: Candidat; pourcentage: number | null };

/**
 * Le classement, selon la méthode publiée (SPEC.md, « Méthode de calcul ») : sur chaque question
 * répondue, sauf « Je ne sais pas », un candidat de position connue marque `1 − écart / écart max`
 * entre son option et celle de l'électeur, multiplié par l'importance donnée (×1 sans importance).
 * Une position inconnue ne compte pas pour lui. Sa proximité est son total en % du maximum possible.
 * Les options d'une fiche sont lues comme une échelle, de A à la dernière, tant que la fiche ne dit pas
 * le contraire. À égalité, l'ordre alphabétique départage, en attendant que ce soit tranché.
 */
export function classement(questions: QuestionDuCalcul[], reponses: Record<number, Reponse>, candidats: Candidat[]): Proximite[] {
  const totaux = new Map(candidats.map((c) => [c.id, { points: 0, maximum: 0 }]));
  for (const question of questions) {
    const reponse = reponses[question.numero];
    if (!reponse || reponse.option === JE_NE_SAIS_PAS) continue;
    const rang = question.options.findIndex((o) => o.id === reponse.option);
    if (rang < 0) continue;
    const ecartMax = Math.max(question.options.length - 1, 1);
    const poids = reponse.importance ?? 1;
    for (const candidat of candidats) {
      const option = question.positions[candidat.id]?.option;
      const rangDuCandidat = question.options.findIndex((o) => o.id === option);
      if (rangDuCandidat < 0) continue;
      const total = totaux.get(candidat.id)!;
      total.points += poids * (1 - Math.abs(rang - rangDuCandidat) / ecartMax);
      total.maximum += poids;
    }
  }
  return candidats
    .map((candidat) => {
      const { points, maximum } = totaux.get(candidat.id)!;
      return { candidat, pourcentage: maximum > 0 ? Math.round((100 * points) / maximum) : null };
    })
    .sort((a, b) => (b.pourcentage ?? -1) - (a.pourcentage ?? -1) || a.candidat.nom.localeCompare(b.candidat.nom, "fr"));
}
