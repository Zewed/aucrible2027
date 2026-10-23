/** Une réponse validée. Elle ne quitte jamais l'appareil (SPEC.md, « Données »). */
export type Reponse = {
  option: string;
  importance: number | null;
  /** Fixe l'ordre mélangé des candidats sur la révélation de cette réponse. */
  graine: number;
  /** Le jour de la réponse, à Paris (AAAA-MM-JJ). */
  jour: string;
  /** Répondue le jour même, comme question du jour : c'est ce qui fait la série. */
  duJour: boolean;
};

/** L'option « Je ne sais pas », que toute fiche propose en plus des siennes. */
export const JE_NE_SAIS_PAS = "nsp";

/** Les réponses de l'appareil, par numéro de question, dans le stockage local du navigateur. */
const CLE = "aucrible:reponses";

export function enregistrerReponse(numero: number, reponse: Reponse) {
  const toutes = lesReponses(lireReponses());
  localStorage.setItem(CLE, JSON.stringify({ ...toutes, [numero]: reponse }));
}

/** Les réponses, brutes (une chaîne stable entre deux lectures). */
export function lireReponses(): string | null {
  return localStorage.getItem(CLE);
}

export function lesReponses(brut: string | null): Record<number, Reponse> {
  return brut ? JSON.parse(brut) : {};
}
