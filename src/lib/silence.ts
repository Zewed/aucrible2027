/**
 * Le silence électoral (SPEC.md, « Boucle principale ») : rien de nouveau n'est publié à partir du
 * vendredi 0 h avant chaque tour, jusqu'au jour du vote compris.
 */
const SILENCES = [
  { debut: "2027-04-16", fin: "2027-04-18" },
  { debut: "2027-04-30", fin: "2027-05-02" },
];

/** Le silence en cours le jour donné (AAAA-MM-JJ), ou null. */
export function silenceEnCours(jour: string) {
  return SILENCES.find((s) => s.debut <= jour && jour <= s.fin) ?? null;
}
