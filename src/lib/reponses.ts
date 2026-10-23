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

/** Prévient la page qu'une réponse vient d'être enregistrée. */
const NOUVELLE_REPONSE = "aucrible:nouvelle-reponse";

export function enregistrerReponse(numero: number, reponse: Reponse) {
  const toutes = lesReponses(lireReponses());
  localStorage.setItem(CLE, JSON.stringify({ ...toutes, [numero]: reponse }));
  window.dispatchEvent(new Event(NOUVELLE_REPONSE));
}

/** Pour `useCoteClient` : relire les réponses quand l'une est enregistrée, ici ou dans un autre onglet. */
export function abonnerAuxReponses(relire: () => void) {
  window.addEventListener(NOUVELLE_REPONSE, relire);
  window.addEventListener("storage", relire);
  return () => {
    window.removeEventListener(NOUVELLE_REPONSE, relire);
    window.removeEventListener("storage", relire);
  };
}

/** Les réponses, brutes (une chaîne stable entre deux lectures). */
export function lireReponses(): string | null {
  return localStorage.getItem(CLE);
}

export function lesReponses(brut: string | null): Record<number, Reponse> {
  return brut ? JSON.parse(brut) : {};
}
