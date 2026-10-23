import type { Reponse } from "@/lib/reponses";
import { silenceEnCours } from "@/lib/silence";

const veille = (jour: string) => new Date(Date.parse(`${jour}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** La veille, en sautant les jours de silence électoral : ils mettent la série en pause sans la casser. */
function veilleHorsSilence(jour: string) {
  let precedent = veille(jour);
  while (silenceEnCours(precedent)) precedent = veille(precedent);
  return precedent;
}

/**
 * Les jours d'affilée où l'électeur a répondu à la question du jour, en comptant aujourd'hui s'il a
 * déjà répondu, sinon à partir de la veille. Les jours de silence électoral ne comptent pas et ne
 * cassent rien : sans question du jour, la série attend.
 */
export function joursDAffilee(reponses: Reponse[], aujourdhui: string): number {
  const jours = new Set(reponses.filter((r) => r.duJour).map((r) => r.jour));
  let jour = jours.has(aujourdhui) ? aujourdhui : veilleHorsSilence(aujourdhui);
  let serie = 0;
  while (jours.has(jour)) {
    serie++;
    jour = veilleHorsSilence(jour);
  }
  return serie;
}
