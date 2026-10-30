/** Jusqu'où le texte peut se resserrer pour que l'écran tienne sans défiler : au-delà, la page défile plutôt que de couper. */
const RESSERRE_AU_PLUS = 0.76;
/** Une longue question peut rapetisser davantage : c'est elle qui fait déborder sa colonne. */
const TITRE_AU_PLUS = 0.5;

/**
 * Une ref qui, quand `media` correspond (le grand écran), règle `--fit` sur l'élément : la plus grande valeur, de `auPlus`
 * à `RESSERRE_AU_PLUS`, pour laquelle la page tient dans la hauteur de la fenêtre ; le CSS multiplie ses tailles de texte
 * par `--fit`. Avec `colonneDuTitre`, la colonne de la question se règle d'abord à part, par `--titre` : seule une question
 * trop longue rapetisse, sans resserrer les chiffres d'à côté. Rien n'est jamais coupé : si la page ne tient toujours pas,
 * elle défile. À créer une fois par module, pour garder la même ref.
 */
export function tenirALEcran(media: string, auPlus = 1, colonneDuTitre?: string) {
  return (element: HTMLElement | null) => {
    if (!element) return;
    const grand = matchMedia(media);
    const deborde = () => document.documentElement.scrollHeight > window.innerHeight + 1;
    // La hauteur propre d'une colonne, sans l'étirement de la grille qui l'aligne sur sa voisine.
    const colonneDeborde = (colonne: HTMLElement) => {
      colonne.style.alignSelf = "start";
      const bas = colonne.getBoundingClientRect().bottom + window.scrollY;
      colonne.style.removeProperty("align-self");
      return bas > window.innerHeight + 1;
    };
    const ajuster = () => {
      element.style.removeProperty("--fit");
      element.style.removeProperty("--titre");
      if (!grand.matches || !element.isConnected) return;
      const colonne = colonneDuTitre ? element.querySelector<HTMLElement>(colonneDuTitre) : null;
      if (colonne) {
        let titre = 1;
        while (colonneDeborde(colonne) && titre > TITRE_AU_PLUS) {
          titre = Math.round((titre - 0.03) * 100) / 100;
          element.style.setProperty("--titre", String(titre));
        }
      }
      let fit = auPlus;
      element.style.setProperty("--fit", String(fit));
      while (deborde() && fit > RESSERRE_AU_PLUS) {
        fit = Math.round((fit - 0.03) * 100) / 100;
        element.style.setProperty("--fit", String(fit));
      }
    };
    ajuster();
    document.fonts.ready.then(ajuster);
    addEventListener("resize", ajuster);
    return () => removeEventListener("resize", ajuster);
  };
}
