import { estLAuteur } from "@/lib/auteur";
import { base } from "@/lib/base";

/** Une session : un numéro au format UUID. */
export const UNE_SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Les réponses partagées (décision du 10/11/2026) : chaque réponse validée part au serveur, pour tout le monde, sans case
 * à cocher. Elle n'emporte que la session de l'onglet (un numéro tiré au hasard, oublié quand l'onglet se ferme), la
 * question, l'option, l'importance, le jour et l'heure à la minute (depuis le 12/11/2026) : ni adresse IP, ni cookie, ni
 * identifiant de l'appareil. Les réponses d'une même session se relient entre elles ; deux sessions, jamais.
 */
export type ReponsePartagee = { session: string; question: number; option: string; importance: number | null; jour: string };

/** Une réponse partagée telle que la lit l'auteur : avec son heure, absente des réponses d'avant le 12/11/2026. */
export type ReponseLue = ReponsePartagee & { recueLe: Date | null };

/** Garde une réponse ; la même question, répondue à nouveau dans la même session, remplace la précédente. */
export async function enregistrerUneReponsePartagee({ session, question, option, importance, jour }: ReponsePartagee) {
  const sql = await base();
  await sql`
    INSERT INTO reponses_partagees (session, question, option, importance, jour, recue_le)
    VALUES (${session}, ${question}, ${option}, ${importance}, ${jour}, date_trunc('minute', now()))
    ON CONFLICT (session, question) DO UPDATE
      SET option = EXCLUDED.option, importance = EXCLUDED.importance, jour = EXCLUDED.jour, recue_le = EXCLUDED.recue_le`;
}

async function reserveeALAuteur() {
  if (!(await estLAuteur())) throw new Error("Les réponses partagées sont réservées à l'auteur.");
  return base();
}

export type TotauxDesReponses = {
  reponses: number;
  sessions: number;
  /** Pour chaque question qui a des réponses : combien pour chaque option, de A à la dernière, puis « Je ne sais pas ». */
  parQuestion: { question: number; options: { option: string; nombre: number }[] }[];
};

/** Les totaux, pour /admin : combien de réponses, de sessions, et la répartition des options, question par question. */
export async function lireLesTotaux(): Promise<TotauxDesReponses> {
  const sql = await reserveeALAuteur();
  const [[ensemble], lignes] = await Promise.all([
    sql<{ reponses: number; sessions: number }[]>`SELECT count(*)::int AS reponses, count(DISTINCT session)::int AS sessions FROM reponses_partagees`,
    sql<{ question: number; option: string; nombre: number }[]>`
      SELECT question, option, count(*)::int AS nombre FROM reponses_partagees GROUP BY question, option ORDER BY question, option`,
  ]);
  const parQuestion: TotauxDesReponses["parQuestion"] = [];
  for (const { question, option, nombre } of lignes) {
    if (parQuestion.at(-1)?.question !== question) parQuestion.push({ question, options: [] });
    parQuestion.at(-1)!.options.push({ option, nombre });
  }
  return { ...ensemble, parQuestion };
}

/** Les réponses d'une session, par question ; aucune si l'identifiant n'en est pas un. */
export async function lireLesReponsesDeLaSession(session: string): Promise<ReponseLue[]> {
  const sql = await reserveeALAuteur();
  if (!UNE_SESSION.test(session)) return [];
  return sql<ReponseLue[]>`
    SELECT session::text, question, option, importance, to_char(jour, 'YYYY-MM-DD') AS jour, recue_le AS "recueLe"
    FROM reponses_partagees WHERE session = ${session}::uuid ORDER BY question`;
}

/** Toutes les réponses, une ligne chacune, rangées par session : l'export CSV de /admin, pour les croiser ailleurs. */
export async function lireToutesLesReponses(): Promise<ReponseLue[]> {
  const sql = await reserveeALAuteur();
  return sql<ReponseLue[]>`
    SELECT session::text, question, option, importance, to_char(jour, 'YYYY-MM-DD') AS jour, recue_le AS "recueLe"
    FROM reponses_partagees ORDER BY session, question`;
}

/** Efface toutes les réponses de ces sessions : les tests de l'auteur, pour qu'ils ne faussent plus les chiffres. */
export async function supprimerLesSessions(sessions: string[]) {
  const sql = await reserveeALAuteur();
  const valides = sessions.filter((s) => UNE_SESSION.test(s));
  if (valides.length === 0) return 0;
  const { count } = await sql`DELETE FROM reponses_partagees WHERE session = ANY(${sql.array(valides)}::uuid[])`;
  return count;
}
