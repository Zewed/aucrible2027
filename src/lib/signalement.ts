import { base } from "@/lib/base";

/** Les types d'erreur du formulaire, « Un chiffre » choisi au départ (maquettes/signaler.html). */
export const TYPES = [
  { valeur: "chiffre", nom: "Un chiffre" },
  { valeur: "position", nom: "La position d'un candidat" },
  { valeur: "formulation", nom: "Une formulation qui penche" },
  { valeur: "autre", nom: "Autre" },
];

export type Signalement = { question: number; type: string; texte: string };

/** Garde un signalement dans la base, pour la boîte privée de l'auteur. */
export async function enregistrerUnSignalement({ question, type, texte }: Signalement) {
  const sql = await base();
  await sql`INSERT INTO signalements (question, type, texte) VALUES (${question}, ${type}, ${texte})`;
}
