/** Jusqu'où le texte peut se resserrer pour que l'écran tienne sans défiler : au-delà, la page défile plutôt que de couper. */
const RESSERRE_AU_PLUS = 0.76;
/** Une longue question peut rapetisser davantage : c'est elle qui fait déborder sa colonne. */
const TITRE_AU_PLUS = 0.5;

/**
 * Une ref qui, quand `media` correspond (le grand écran), règle `--fit` sur l'élément : la plus grande valeur, de `auPlus`
 * à `RESSERRE_AU_PLUS`, pour laquelle la page tient dans la hauteur de la fenêtre ; le CSS multiplie ses tailles de texte
 * par `--fit`. Avec `puisLeTitre`, si le texte resserré au plus ne tient toujours pas, la question rapetisse à son tour,
 * par `--titre` : seule une question trop longue y perd. Rien n'est jamais coupé : si la page ne tient toujours pas, elle
 * défile. À créer une fois par module, pour garder la même ref.
 */
export function tenirALEcran(media: string, auPlus = 1, puisLeTitre = false) {
  return (element: HTMLElement | null) => {
    if (!element) return;
    const grand = matchMedia(media);
    const deborde = () => document.documentElement.scrollHeight > window.innerHeight + 1;
    const ajuster = () => {
      element.style.removeProperty("--fit");
      element.style.removeProperty("--titre");
      if (!grand.matches || !element.isConnected) return;
      let fit = auPlus;
      element.style.setProperty("--fit", String(fit));
      while (deborde() && fit > RESSERRE_AU_PLUS) {
        fit = Math.round((fit - 0.03) * 100) / 100;
        element.style.setProperty("--fit", String(fit));
      }
      let titre = 1;
      while (puisLeTitre && deborde() && titre > TITRE_AU_PLUS) {
        titre = Math.round((titre - 0.03) * 100) / 100;
        element.style.setProperty("--titre", String(titre));
      }
    };
    ajuster();
    document.fonts.ready.then(ajuster);
    addEventListener("resize", ajuster);
    return () => removeEventListener("resize", ajuster);
  };
}
