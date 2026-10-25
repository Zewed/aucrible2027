"use server";

import { redirect } from "next/navigation";
import { lireLaSession } from "@/lib/auteur";

/** « Se déconnecter » : la session de l'espace de l'auteur est effacée. */
export async function seDeconnecter() {
  (await lireLaSession()).destroy();
  redirect("/admin");
}
