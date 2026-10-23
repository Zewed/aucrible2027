import { cookies } from "next/headers";
import { connection } from "next/server";
import { lireQuestions, type Question } from "@/lib/contenu";
import { aujourdhuiAParis } from "@/lib/date";

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

/** Les fiches déjà parues : datées d'aujourd'hui (à Paris) ou avant. Les autres ne quittent pas le serveur. */
export async function lireQuestionsPubliees(): Promise<Question[]> {
  const jour = aujourdhuiAParis(await maintenant());
  return lireQuestions().filter((q) => q.date <= jour);
}

/** La date de la prochaine fiche à paraître, ou null s'il n'y en a aucune : sa date seulement, jamais son contenu. */
export async function lireProchaineParution(): Promise<string | null> {
  const jour = aujourdhuiAParis(await maintenant());
  return lireQuestions().find((q) => q.date > jour)?.date ?? null;
}
