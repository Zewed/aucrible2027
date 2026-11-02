/** Active la feuille tant que son composant est à l'écran, la coupe quand Next le masque. */
function tantQuIlEstALEcran(style: HTMLStyleElement | null) {
  if (style) style.media = "";
  return () => {
    if (style) style.media = "not all";
  };
}

/**
 * Des styles pour le reste de la page, le temps qu'un écran est affiché. Next garde les pages quittées dans le document,
 * masquées : une règle en `body:has(.ecran)` continuerait de s'appliquer aux pages suivantes, celle-ci non.
 */
export function StylesDeLaPage({ children }: { children: string }) {
  return <style ref={tantQuIlEstALEcran}>{children}</style>;
}
