import type { Question } from "@/lib/contenu";

/**
 * Le rythme du reportage, sans dessin : les séquences d'une fiche et les textes qu'elles montrent, et combien de
 * temps chacune dure. Partagé par le reportage (Reportage.tsx) et par `pnpm video --ecrans`, qui rend la dernière
 * image de chaque séquence pour relire une vidéo sans la regarder.
 */

/** La musique du thème (content/musiques.yaml) : son fichier, son tempo et la seconde de son premier temps fort. */
export type MusiqueDuReportage = { src: string; tempo: number; premierTemps: number };

/** La vitesse de lecture qui règle le rythme : chaque texte reste à l'écran le temps d'être lu, pas plus. */
const MOTS_PAR_SECONDE = 4.5;
/** Le temps le plus court qu'un texte reste seul à l'écran, en secondes. */
const LECTURE_MINIMALE = 1.25;

export const APPEL = "Choisis ta carte sur aucrible2027.fr";

/**
 * Le pas sur lequel couper, en secondes : un temps de la musique, doublé ou divisé par deux pour rester entre 0,4 et
 * 0,8 s (un morceau lent coupe sur le demi-temps). Sans musique, celui d'un tempo de 96.
 */
export function pasDe(musique?: MusiqueDuReportage) {
  let pas = 60 / (musique?.tempo ?? 96);
  while (pas > 0.8) pas /= 2;
  while (pas < 0.4) pas *= 2;
  return pas;
}

const nombreDeMots = (texte: string) => texte.split(/\s+/).filter(Boolean).length;

/**
 * Le rythme d'une séquence, en secondes : un pas d'entrée, puis chaque texte le temps de le lire, puis un pas pour
 * souffler ; chaque durée arrondie au pas supérieur, la séquence à un nombre pair de pas, pour couper sur la mesure.
 */
export function rythmeDe(sequence: { textes: string[] }, pas: number) {
  const surLeTemps = (secondes: number, n = 1) => Math.ceil(secondes / (n * pas) - 1e-9) * n * pas;
  let t = pas;
  const instants = sequence.textes.map((texte) => {
    const debut = t;
    t += surLeTemps(Math.max(LECTURE_MINIMALE, nombreDeMots(texte) / MOTS_PAR_SECONDE));
    return { debut, fin: t };
  });
  return { instants, duree: surLeTemps(t + pas, 2) };
}

export type Camp = "pour" | "contre";
/**
 * Qui répond en premier, en ABBA (pour-contre, contre-pour, contre-pour, pour-contre…) : chaque camp ouvre et clôt
 * autant de fois, et le premier mot du débat et le dernier ne vont pas au même camp.
 */
export const ordreDesCamps = (rang: number): Camp[] => (rang % 4 === 0 || rang % 4 === 3 ? ["pour", "contre"] : ["contre", "pour"]);

/**
 * Les séquences du reportage d'une fiche, dans l'ordre, chacune avec les textes à lire l'un après l'autre : la
 * question, l'accroche, le mécanisme, le déficit, les leviers, chaque question puis le face-à-face, et la fin.
 */
export function textesDesSequences(question: Question): { nom: string; textes: string[] }[] {
  const r = question.reportage ?? {};
  const { accroche, mecanisme, ecart, leviers } = r;
  const leviersEnTexte = leviers?.choix.map((c) => `${c.texte} ${c.detail ?? ""}`).join(" ");
  return [
    { nom: "ouverture", textes: [question.question] },
    ...(accroche ? [{ nom: "accroche", textes: [...accroche.etapes.map((e) => `${e.quand} ${e.valeur}`), accroche.chute] }] : []),
    ...(mecanisme
      ? [{ nom: "mecanisme", textes: [`${mecanisme.titre} ${mecanisme.texte}`, ...mecanisme.points.map((p) => `${p.annee} ${p.valeur} pour 1`), mecanisme.chute] }]
      : []),
    ...(ecart ? [{ nom: "ecart", textes: [ecart.titre, ...ecart.etapes.map((e) => `${e.quand} ${e.valeur}`), ecart.chute] }] : []),
    ...(leviers && leviersEnTexte ? [{ nom: "leviers", textes: [leviers.titre, leviersEnTexte, leviers.chute] }] : []),
    ...(r.questions ?? []).flatMap((q, i) => [
      { nom: `question-${i + 1}`, textes: [q.question] },
      { nom: `question-${i + 1}-debat`, textes: ordreDesCamps(i).map((camp) => `${q[camp].affirmation} ${q[camp].chiffre} ${q[camp].texte}`) },
    ]),
    { nom: "fin", textes: [leviersEnTexte ?? question.question, "Et toi ?", APPEL] },
  ];
}
