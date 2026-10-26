import { lAuteur } from "@/lib/auteur";
import { base } from "@/lib/base";

/** Les types d'erreur du formulaire, « Un chiffre » choisi au départ (maquettes/signaler.html). */
export const TYPES = [
  { valeur: "chiffre", nom: "Un chiffre" },
  { valeur: "position", nom: "La position d'un candidat" },
  { valeur: "formulation", nom: "Une formulation qui penche" },
  { valeur: "autre", nom: "Autre" },
];

/**
 * Un signalement : sa question, son type, son texte, la source que l'électeur a pu joindre (un lien) et son e-mail,
 * les deux facultatifs. L'e-mail ne sert qu'à lui répondre.
 */
export type Signalement = { question: number; type: string; texte: string; source: string | null; email: string | null };

/**
 * Combien de temps l'e-mail d'un signalement est gardé : trois mois, le temps de répondre (décision du 25/10/2026).
 * Passé ce délai, l'adresse est effacée ; le signalement reste.
 */
const DUREE_DE_L_EMAIL = "3 months";

async function effacerLesVieuxEmails(sql: Awaited<ReturnType<typeof base>>) {
  await sql`UPDATE signalements SET email = NULL WHERE email IS NOT NULL AND recu_le < now() - ${DUREE_DE_L_EMAIL}::interval`;
}

export type SignalementRecu = Signalement & { id: string; recuLe: Date };

/**
 * La boîte privée de l'auteur : les signalements reçus, les plus récents d'abord. Elle vérifie elle-même que c'est
 * l'auteur qui demande, et ne rend rien à personne d'autre.
 */
export async function lireLesSignalements(): Promise<SignalementRecu[]> {
  const auteur = await lAuteur();
  if (!auteur || auteur === "refuse") throw new Error("La boîte des signalements est réservée à l'auteur.");
  const sql = await base();
  await effacerLesVieuxEmails(sql);
  return sql<SignalementRecu[]>`SELECT id, recu_le AS "recuLe", question, type, texte, source, email FROM signalements ORDER BY recu_le DESC, id DESC LIMIT 200`;
}

/** Garde un signalement dans la base, pour la boîte privée de l'auteur. */
export async function enregistrerUnSignalement({ question, type, texte, source, email }: Signalement) {
  const sql = await base();
  await sql`INSERT INTO signalements (question, type, texte, source, email) VALUES (${question}, ${type}, ${texte}, ${source}, ${email})`;
  await effacerLesVieuxEmails(sql);
}
