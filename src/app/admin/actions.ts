"use server";

import { redirect } from "next/navigation";
import { bonMotDePasse, lireLaSession } from "@/lib/auteur";

export type EtatDeLaConnexion = { refuse: boolean };

/**
 * Le mot de passe de /admin : juste, la session s'ouvre ; faux, une seconde d'attente avant le refus, pour qu'on ne
 * puisse pas en essayer des milliers.
 */
export async function entrer(_precedent: EtatDeLaConnexion, donnees: FormData): Promise<EtatDeLaConnexion> {
  const tape = donnees.get("mot-de-passe");
  if (typeof tape !== "string" || !bonMotDePasse(tape)) {
    await new Promise((fin) => setTimeout(fin, 1000));
    return { refuse: true };
  }
  const session = await lireLaSession();
  session.auteur = true;
  await session.save();
  redirect("/admin");
}

/** « Se déconnecter » : la session de l'espace de l'auteur est effacée. */
export async function seDeconnecter() {
  (await lireLaSession()).destroy();
  redirect("/admin");
}
