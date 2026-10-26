import postgres from "postgres";

/**
 * La base Postgres d'Au crible 2027 (SPEC.md, « Décisions de l'auteur du 25/10/2026 ») : en ligne, celle du projet
 * Vercel (Neon) ; en local et pour les tests, le conteneur de scripts/base-locale.sh. Les réponses des électeurs n'y
 * entrent jamais : elle ne garde que ce qu'on lui envoie exprès, comme un signalement, et le nombre de visites par jour.
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
  );
  await tablesPretes;
  return connexion;
}
