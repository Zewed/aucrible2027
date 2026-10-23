/** La réponse qui vient d'être validée, le temps d'afficher sa révélation. */
export type ReponseEnCours = { numero: number; option: string };

/** L'option « Je ne sais pas », que toute fiche propose en plus des siennes. */
export const JE_NE_SAIS_PAS = "nsp";

const CLE = "aucrible:reponse-en-cours";

export function enregistrerReponseEnCours(reponse: ReponseEnCours) {
  sessionStorage.setItem(CLE, JSON.stringify(reponse));
}

/** La réponse en cours, brute (une chaîne stable entre deux lectures). */
export function lireReponseEnCours(): string | null {
  return sessionStorage.getItem(CLE);
}
