import { cookies } from "next/headers";
import { connection } from "next/server";
import { lireQuestions, type Question } from "@/lib/contenu";
import type { QuestionDuCalcul } from "@/lib/proximite";
import { aujourdhuiAParis } from "@/lib/date";
import { silenceEnCours } from "@/lib/silence";

/** Le cookie par lequel, en test seulement, le serveur apprend le jour simulé par le navigateur. */
const HORLOGE_DE_TEST = "aucrible-horloge-de-test";

/** L'heure de la requête. Les tests de bout en bout la fixent ; en production, c'est toujours l'heure réelle. */
async function maintenant(): Promise<Date> {
  await connection();
  if (process.env.AUCRIBLE_HORLOGE_DE_TEST === "1") {
    const simulee = (await cookies()).get(HORLOGE_DE_TEST)?.value;
    if (simulee) return new Date(simulee);
  }
  return new Date();
}

/** Le cookie par lequel, en test seulement, un test choisit son jeu de fiches (e2e/fiches/<jeu>). */
const JEU_DE_TEST = "aucrible-jeu-de-test";

/** Les fiches, parues ou non, du jeu de la requête : en production, toujours celles du contenu. */
async function lesFiches(): Promise<Question[]> {
  const jeu = process.env.AUCRIBLE_FICHES_DE_TEST ? (await cookies()).get(JEU_DE_TEST)?.value : undefined;
  return lireQuestions(jeu);
}

/** Le jour de la requête, à Paris (AAAA-MM-JJ). */
export async function lireAujourdhui(): Promise<string> {
  return aujourdhuiAParis(await maintenant());
}

/**
 * Les fiches déjà parues : datées d'aujourd'hui (à Paris) ou avant, sauf, pendant un silence électoral,
 * celles datées depuis son début. Les autres ne quittent pas le serveur.
 */
export async function lireQuestionsPubliees(): Promise<Question[]> {
  const jour = aujourdhuiAParis(await maintenant());
  const silence = silenceEnCours(jour);
  return (await lesFiches()).filter((q) => q.date <= jour && !(silence && q.date >= silence.debut));
}

/** La date de la prochaine fiche à paraître, ou null s'il n'y en a aucune : sa date seulement, jamais son contenu. */
export async function lireProchaineParution(): Promise<string | null> {
  const jour = aujourdhuiAParis(await maintenant());
  return (await lesFiches()).find((q) => q.date > jour)?.date ?? null;
}

/**
 * Le numéro de la question du jour de demain, ou null si demain n'en a pas (aucune fiche datée de
 * demain, ou silence électoral) : son numéro seulement, jamais son contenu.
 */
export async function lireNumeroDeDemain(): Promise<number | null> {
  // Le lendemain de la date de Paris, et non dans 24 h : un jour de changement d'heure n'en dure pas 24.
  const aujourdhui = aujourdhuiAParis(await maintenant());
  const demain = new Date(Date.parse(`${aujourdhui}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  if (silenceEnCours(demain)) return null;
  return (await lesFiches()).find((q) => q.date === demain)?.numero ?? null;
}

/** Les fiches déjà parues, réduites à ce que le calcul lit : c'est tout ce que le navigateur en reçoit. */
export async function lireQuestionsDuCalcul(): Promise<QuestionDuCalcul[]> {
  return (await lireQuestionsPubliees()).map((q) => ({
    numero: q.numero,
    theme: q.theme,
    options: q.options.map((o) => ({ id: o.id, horsEchelle: o.horsEchelle, axes: o.axes })),
    positions: Object.fromEntries(Object.entries(q.positions).map(([id, p]) => [id, { option: p.option }])),
  }));
}
