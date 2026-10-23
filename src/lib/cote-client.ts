import { useSyncExternalStore } from "react";

const sansAbonnement = () => () => {};

/**
 * Lit une valeur qui n'existe que dans le navigateur (date locale, stockage) : null au rendu serveur.
 * `abonner` relit la valeur quand elle change sous la page (une réponse enregistrée, par exemple).
 */
export function useCoteClient(lire: () => string | null, abonner: (relire: () => void) => () => void = sansAbonnement): string | null {
  return useSyncExternalStore(abonner, lire, () => null);
}
