import { useSyncExternalStore } from "react";

const sansAbonnement = () => () => {};

/** Lit une valeur qui n'existe que dans le navigateur (date locale, stockage) : null au rendu serveur. */
export function useCoteClient(lire: () => string | null): string | null {
  return useSyncExternalStore(sansAbonnement, lire, () => null);
}
