/**
 * Posé par l'espace de l'auteur sur chacun de ses appareils (app/admin/AppareilDeLAuteur.tsx) : ses passages n'y comptent
 * plus dans les visites ni dans la mesure d'audience, et ses réponses ne partent plus au serveur.
 */
export const APPAREIL_DE_L_AUTEUR = "aucrible:auteur";

/** Cet appareil est-il un de ceux de l'auteur ? Sans stockage lisible, non. */
export function estLAppareilDeLAuteur() {
  try {
    return Boolean(localStorage.getItem(APPAREIL_DE_L_AUTEUR));
  } catch {
    return false;
  }
}
