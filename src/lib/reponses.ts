/** Une réponse validée. Elle ne quitte jamais l'appareil (SPEC.md, « Données »). */
export type Reponse = {
  option: string;
  importance: number | null;
  /** Fixe l'ordre mélangé des candidats sur la révélation de cette réponse. */
  graine: number;
  /** Le jour de la réponse, à Paris (AAAA-MM-JJ). */
  jour: string;
  /** Le rang de la réponse sur l'appareil (1 pour la première) : c'est lui qui fait les paliers. Absent des plus anciennes. */
  rang?: number;
};

/** L'option « Je ne sais pas », que toute fiche propose en plus des siennes. */
export const JE_NE_SAIS_PAS = "nsp";

/** Les réponses de l'appareil, par numéro de question, dans le stockage local du navigateur. */
const CLE = "aucrible:reponses";

/** Prévient la page qu'une réponse vient d'être enregistrée. */
const NOUVELLE_REPONSE = "aucrible:nouvelle-reponse";

/**
 * Lu dans <head>, avant le premier affichage : un appareil sans réponse est marqué `data-nouveau-venu`, pour que l'accueil,
 * qui n'apprend qu'une fois chargé s'il doit montrer la landing, cache d'emblée le menu qu'elle n'a pas.
 */
export const SCRIPT_DU_NOUVEAU_VENU = `try{var r=localStorage.getItem("${CLE}");if(!r||r==="{}")document.documentElement.dataset.nouveauVenu=""}catch(e){}`;

export function enregistrerReponse(numero: number, reponse: Reponse) {
  const toutes = lesReponses(lireReponses());
  localStorage.setItem(CLE, JSON.stringify({ ...toutes, [numero]: reponse }));
  window.dispatchEvent(new Event(NOUVELLE_REPONSE));
}

/** Remplace toutes les réponses de l'appareil, par exemple par celles importées d'un autre appareil. */
export function remplacerLesReponses(reponses: Record<number, Reponse>) {
  localStorage.setItem(CLE, JSON.stringify(reponses));
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

/** Où en est l'électeur dans chaque thème qui a des questions : ses réponses, sur les questions du thème. */
export function avancementParTheme<T extends { id: string }>(themes: T[], questions: { numero: number; theme: string }[], reponses: Record<number, Reponse>) {
  return themes
    .map((theme) => {
      const siennes = questions.filter((q) => q.theme === theme.id);
      return { theme, total: siennes.length, faites: siennes.filter((q) => q.numero in reponses).length };
    })
    .filter(({ total }) => total > 0);
}
