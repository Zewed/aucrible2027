import type { Reponse } from "@/lib/reponses";

const veille = (jour: string) => new Date(Date.parse(`${jour}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Les jours d'affilée où l'électeur a répondu à la question du jour, en comptant aujourd'hui s'il a
 * déjà répondu, sinon à partir d'hier.
 */
export function joursDAffilee(reponses: Reponse[], aujourdhui: string): number {
  const jours = new Set(reponses.filter((r) => r.duJour).map((r) => r.jour));
  let jour = jours.has(aujourdhui) ? aujourdhui : veille(aujourdhui);
  let serie = 0;
  while (jours.has(jour)) {
    serie++;
    jour = veille(jour);
  }
  return serie;
}
