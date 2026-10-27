/** Un palier toutes les 5 réponses (SPEC.md, « Boucle principale », 25 octobre 2026). */
export const REPONSES_PAR_PALIER = 5;

/** Ce que dit le palier atteint à la `rang`-ième réponse, ou null si ce rang n'en est pas un. */
export function messageDuPalier(rang: number): string | null {
  if (rang % REPONSES_PAR_PALIER !== 0) return null;
  if (rang < 10) return "Encore 5 pour ton classement.";
  return rang === 10 ? "Ton classement est prêt." : "Ton classement s'affine.";
}
