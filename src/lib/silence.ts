/**
 * Le silence électoral (SPEC.md, « Boucle principale ») : rien de nouveau n'est publié à partir du
 * vendredi 0 h avant chaque tour, jusqu'au jour du vote compris.
 */
export type Silence = { debut: string; fin: string; tour: string };

/** Chaque silence finit le jour du vote de son tour. */
const SILENCES: Silence[] = [
  { debut: "2027-04-16", fin: "2027-04-18", tour: "1er tour" },
  { debut: "2027-04-30", fin: "2027-05-02", tour: "2nd tour" },
];

/** Le silence en cours le jour donné (AAAA-MM-JJ), ou null. */
export function silenceEnCours(jour: string): Silence | null {
  return SILENCES.find((s) => s.debut <= jour && jour <= s.fin) ?? null;
}
