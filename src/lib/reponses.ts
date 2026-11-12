/** Une réponse validée, gardée sur l'appareil ; seule une copie anonyme en part (`partagerLaReponse`). */
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

/**
 * La session de l'appareil, qui relie entre elles les réponses partagées : tirée à la première réponse, gardée avec les
 * réponses (fermer l'onglet ne la coupe pas), effacée quand on recommence le questionnaire. Une session ouverte dans un
 * onglet avant le 12/11/2026 est reprise telle quelle.
 */
const SESSION = "aucrible:session";
let sessionSansStockage: string | undefined;

/** Un numéro au format UUID ; `crypto.randomUUID` manque hors HTTPS (un téléphone sur le réseau local, en développement). */
const tirerUneSession = () =>
  crypto.randomUUID?.() ?? "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));

function laSession() {
  try {
    const deja = localStorage.getItem(SESSION) ?? sessionStorage.getItem(SESSION);
    const session = deja ?? tirerUneSession();
    localStorage.setItem(SESSION, session);
    sessionStorage.removeItem(SESSION);
    return session;
  } catch {
    return (sessionSansStockage ??= tirerUneSession());
  }
}

/**
 * Envoie une copie anonyme de la réponse (lib/reponses-partagees.ts) : la session de l'onglet, la question, l'option et
 * l'importance, rien d'autre. Sans réseau, la copie se perd ; la réponse, elle, reste sur l'appareil.
 */
export function partagerLaReponse(numero: number, { option, importance }: Pick<Reponse, "option" | "importance">) {
  fetch("/reponse", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session: laSession(), question: numero, option, importance }),
  }).catch(() => {});
}

/** Remplace toutes les réponses de l'appareil, par exemple par celles importées d'un autre appareil. */
export function remplacerLesReponses(reponses: Record<number, Reponse>) {
  localStorage.setItem(CLE, JSON.stringify(reponses));
  window.dispatchEvent(new Event(NOUVELLE_REPONSE));
}

/**
 * Efface toutes les réponses de l'appareil, et sa session, pour recommencer le questionnaire. Sans prévenir la page : celle qui efface
 * se recharge aussitôt, et l'accueil ne montre pas la landing d'un appareil vide entre-temps.
 */
export function effacerLesReponses() {
  localStorage.removeItem(CLE);
  localStorage.removeItem(SESSION);
  sessionSansStockage = undefined;
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
