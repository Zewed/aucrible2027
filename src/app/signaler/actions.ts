"use server";

import { lireQuestionsPubliees } from "@/lib/publication";
import { enregistrerUnSignalement, TYPES } from "@/lib/signalement";

export type EtatDeLEnvoi = { envoye: boolean };

/**
 * « Envoyer » : le signalement part dans la base, sans compte ni connexion. Il ne vaut que pour une question déjà
 * publiée et un type du formulaire ; le reste est refusé sans rien garder.
 */
export async function envoyerUnSignalement(_precedent: EtatDeLEnvoi, formulaire: FormData): Promise<EtatDeLEnvoi> {
  const numero = Number(formulaire.get("question"));
  const type = String(formulaire.get("type"));
  const publiee = (await lireQuestionsPubliees()).some((q) => q.numero === numero);
  if (!publiee || !TYPES.some((t) => t.valeur === type)) return { envoye: false };
  const source = String(formulaire.get("lien") ?? "").trim();
  await enregistrerUnSignalement({ question: numero, type, texte: String(formulaire.get("quoi") ?? ""), source: source || null });
  return { envoye: true };
}
