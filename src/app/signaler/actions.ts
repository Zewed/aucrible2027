"use server";

import { lireQuestionsPubliees } from "@/lib/publication";
import { enregistrerUnSignalement, TYPES } from "@/lib/signalement";

/**
 * Ce que l'envoi a donné : parti, ou refusé (`vide` : sans texte, ou rien que des espaces). `echec`, posé par le
 * formulaire, dit que la réponse du serveur n'est pas arrivée (réseau coupé).
 */
export type EtatDeLEnvoi = { envoye: boolean; vide?: boolean; echec?: boolean };

/**
 * « Envoyer » : le signalement part dans la base, sans compte ni connexion. Il ne vaut que pour une question déjà
 * publiée, un type du formulaire et un texte qui n'est pas vide ; le reste est refusé sans rien garder.
 */
export async function envoyerUnSignalement(_precedent: EtatDeLEnvoi, formulaire: FormData): Promise<EtatDeLEnvoi> {
  const numero = Number(formulaire.get("question"));
  const type = String(formulaire.get("type"));
  const publiee = (await lireQuestionsPubliees()).some((q) => q.numero === numero);
  if (!publiee || !TYPES.some((t) => t.valeur === type)) return { envoye: false };
  const texte = String(formulaire.get("quoi") ?? "").trim();
  if (!texte) return { envoye: false, vide: true };
  const cle = String(formulaire.get("cle") ?? "");
  if (!/^[\w-]{16,64}$/.test(cle)) return { envoye: false };
  const source = String(formulaire.get("lien") ?? "").trim();
  const email = String(formulaire.get("mel") ?? "").trim();
  await enregistrerUnSignalement({ question: numero, type, texte, source: source || null, email: email || null }, cle);
  return { envoye: true };
}
