import type { Axes, Candidat } from "@/lib/contenu";
import { JE_NE_SAIS_PAS, type Reponse } from "@/lib/reponses";

/** Ce que le calcul lit d'une question publiée : ses options, dans l'ordre, et les positions connues. */
export type QuestionDuCalcul = {
  numero: number;
  theme: string;
  options: { id: string; horsEchelle?: boolean; axes?: Axes }[];
  positions: Record<string, { option: string }>;
};

/**
 * Ce que marque, sur une question, un candidat dont l'option est `candidat` quand l'électeur a choisi
 * `electeur` : `1 − écart / écart max` sur l'échelle des options, de A à la dernière ; 1 si la carte est
 * la même et 0 sinon dès que l'une des deux est hors échelle.
 */
function score(question: QuestionDuCalcul, electeur: string, candidat: string): number {
  if (electeur === candidat) return 1;
  const echelle = question.options.filter((o) => !o.horsEchelle).map((o) => o.id);
  const [rang, rangDuCandidat] = [echelle.indexOf(electeur), echelle.indexOf(candidat)];
  if (rang < 0 || rangDuCandidat < 0) return 0;
  return 1 - Math.abs(rang - rangDuCandidat) / Math.max(echelle.length - 1, 1);
}

/** Le nombre de réponses à partir duquel les candidats s'affichent (SPEC.md : « à partir d'environ 10 réponses »). */
export const SEUIL_DES_RESULTATS = 10;

/** Les réponses qui entrent dans le calcul : « Je ne sais pas » n'y entre pas, en attendant que ce soit tranché. */
export const reponsesComptees = (questions: QuestionDuCalcul[], reponses: Record<number, Reponse>) =>
  questions.filter((q) => reponses[q.numero] && reponses[q.numero].option !== JE_NE_SAIS_PAS).length;

/** Le nombre de réponses qu'il faut dans un thème pour en gagner la part (SPEC.md : « à partir de 3 réponses dans un thème »). */
export const REPONSES_PAR_PART = 3;

/** Les réponses comptées de chaque thème (« Je ne sais pas » non compris), par identifiant de thème. */
export function reponsesParTheme(questions: Pick<QuestionDuCalcul, "numero" | "theme">[], reponses: Record<number, Reponse>): Record<string, number> {
  const parTheme: Record<string, number> = {};
  for (const q of questions) {
    if (reponses[q.numero] && reponses[q.numero].option !== JE_NE_SAIS_PAS) parTheme[q.theme] = (parTheme[q.theme] ?? 0) + 1;
  }
  return parTheme;
}

/** Un candidat du classement et sa proximité en % ; null tant qu'aucune réponse ne le concerne. */
export type Proximite = { candidat: Candidat; pourcentage: number | null };

/**
 * Le classement, selon la méthode publiée (SPEC.md, « Méthode de calcul ») : sur chaque question
 * répondue, sauf « Je ne sais pas », un candidat de position connue marque son `score`, multiplié par
 * l'importance donnée (×1 sans importance). Une position inconnue ne compte pas pour lui. Sa proximité
 * est son total en % du maximum possible. À égalité, l'ordre alphabétique départage, en attendant que
 * ce soit tranché.
 */
export function classement(questions: QuestionDuCalcul[], reponses: Record<number, Reponse>, candidats: Candidat[]): Proximite[] {
  const totaux = new Map(candidats.map((c) => [c.id, { points: 0, maximum: 0 }]));
  for (const question of questions) {
    const reponse = reponses[question.numero];
    if (!reponse || reponse.option === JE_NE_SAIS_PAS) continue;
    if (!question.options.some((o) => o.id === reponse.option)) continue;
    const poids = reponse.importance ?? 1;
    for (const candidat of candidats) {
      const option = question.positions[candidat.id]?.option;
      if (!option || !question.options.some((o) => o.id === option)) continue;
      const total = totaux.get(candidat.id)!;
      total.points += poids * score(question, reponse.option, option);
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
