/** Le mode d'affichage de l'appareil, dans le stockage local du navigateur : clair tant que rien d'autre n'est choisi. */
const CLE = "aucrible:mode";

/** Prévient la page que le mode vient de changer. */
const NOUVEAU_MODE = "aucrible:nouveau-mode";

/** Lu dans <head>, avant le premier affichage : la page s'ouvre dans le mode choisi, sans passer par le clair. */
export const SCRIPT_DU_MODE = `try{if(localStorage.getItem("${CLE}")==="sombre")document.documentElement.dataset.sombre=""}catch(e){}`;

export function lireMode(): "clair" | "sombre" {
  try {
    return localStorage.getItem(CLE) === "sombre" ? "sombre" : "clair";
  } catch {
    return "clair";
  }
}

export function choisirMode(mode: "clair" | "sombre") {
  localStorage.setItem(CLE, mode);
  window.dispatchEvent(new Event(NOUVEAU_MODE));
}

/** Pour `useCoteClient` : relire le mode quand il change, ici ou dans un autre onglet. */
export function abonnerAuMode(relire: () => void) {
  window.addEventListener(NOUVEAU_MODE, relire);
  window.addEventListener("storage", relire);
  return () => {
    window.removeEventListener(NOUVEAU_MODE, relire);
    window.removeEventListener("storage", relire);
  };
}
