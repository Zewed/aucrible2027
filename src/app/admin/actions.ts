"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { bonMotDePasse, lireLaSession } from "@/lib/auteur";
import { supprimerLesSessions } from "@/lib/reponses-partagees";

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

/** Les sessions cochées (des numéros de session) : leurs réponses sont effacées, et le tableau de bord se recalcule. */
export async function supprimerDesSessions(donnees: FormData) {
  await supprimerLesSessions(donnees.getAll("session").filter((s) => typeof s === "string"));
  refresh();
}

/** Une seule session, depuis sa page : effacée, retour au tableau de bord. */
export async function supprimerLaSession(donnees: FormData) {
  await supprimerLesSessions(donnees.getAll("session").filter((s) => typeof s === "string"));
  redirect("/admin");
}
