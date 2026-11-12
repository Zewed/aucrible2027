import postgres from "postgres";

/**
 * La base Postgres de Décrypte 2027 (SPEC.md, « Décisions de l'auteur du 25/10/2026 ») : en ligne, celle du projet
 * Vercel (Neon) ; en local et pour les tests, le conteneur de scripts/base-locale.sh. Elle garde les signalements, le
 * nombre de visites par jour et, depuis le 10/11/2026, une copie anonyme des réponses (lib/reponses-partagees.ts).
 */
let connexion: postgres.Sql | undefined;
let tablesPretes: Promise<unknown> | undefined;

/** La connexion, ouverte au premier besoin, et les tables, créées si elles manquent. */
export async function base() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manque : pas de base où écrire.");
  connexion ??= postgres(process.env.DATABASE_URL, { max: 5, onnotice: () => {} });
  tablesPretes ??= connexion`
    CREATE TABLE IF NOT EXISTS signalements (
      id bigserial PRIMARY KEY,
      recu_le timestamptz NOT NULL DEFAULT now(),
      question integer NOT NULL,
      type text NOT NULL,
      texte text NOT NULL,
      source text,
      email text
    )`.then(
    // La clé d'envoi (ticket 169) : un même signalement renvoyé après un échec n'arrive qu'une fois.
    () => connexion!`ALTER TABLE signalements ADD COLUMN IF NOT EXISTS cle text UNIQUE`,
  ).then(
    // Les visites (ticket 192) : un nombre par jour, rien d'autre ; ni appareil, ni adresse, ni réponse.
    () => connexion!`CREATE TABLE IF NOT EXISTS visites (jour date PRIMARY KEY, nombre integer NOT NULL DEFAULT 0)`,
  ).then(
    // Le genre des appareils (12/11/2026) : trois compteurs de plus par jour, et les robots, comptés hors des visites.
    () => connexion!`
      ALTER TABLE visites
        ADD COLUMN IF NOT EXISTS telephone integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tablette integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ordinateur integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS robot integer NOT NULL DEFAULT 0`,
  ).then(
    // Les réponses partagées (10/11/2026) : la session de l'onglet, la question, l'option, l'importance et le jour ;
    // ni appareil, ni adresse. Une question répondue deux fois dans la même session ne compte qu'une fois.
    () => connexion!`
      CREATE TABLE IF NOT EXISTS reponses_partagees (
        session uuid NOT NULL,
        question integer NOT NULL,
        option text NOT NULL,
        importance smallint,
        jour date NOT NULL,
        PRIMARY KEY (session, question)
      )`,
  );
  await tablesPretes;
  return connexion;
}
