import { lAuteur } from "@/lib/auteur";
import { base } from "@/lib/base";

/** Les types d'erreur du formulaire, « Un chiffre » choisi au départ (maquettes/signaler.html). */
export const TYPES = [
  { valeur: "chiffre", nom: "Un chiffre" },
  { valeur: "position", nom: "La position d'un candidat" },
  { valeur: "formulation", nom: "Une formulation qui penche" },
  { valeur: "autre", nom: "Autre" },
];

export type Signalement = { question: number; type: string; texte: string };

export type SignalementRecu = Signalement & { id: string; recuLe: Date };

/**
 * La boîte privée de l'auteur : les signalements reçus, les plus récents d'abord. Elle vérifie elle-même que c'est
 * l'auteur qui demande, et ne rend rien à personne d'autre.
 */
export async function lireLesSignalements(): Promise<SignalementRecu[]> {
  const auteur = await lAuteur();
  if (!auteur || auteur === "refuse") throw new Error("La boîte des signalements est réservée à l'auteur.");
  const sql = await base();
  return sql<SignalementRecu[]>`SELECT id, recu_le AS "recuLe", question, type, texte FROM signalements ORDER BY recu_le DESC, id DESC LIMIT 200`;
}

/** Garde un signalement dans la base, pour la boîte privée de l'auteur. */
export async function enregistrerUnSignalement({ question, type, texte }: Signalement) {
  const sql = await base();
  await sql`INSERT INTO signalements (question, type, texte) VALUES (${question}, ${type}, ${texte})`;
}
