/** La date du jour à Paris, au format AAAA-MM-JJ. */
export function aujourdhuiAParis(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(maintenant);
}

/** « vendredi 23 octobre » (avecJour) ou « 23 octobre », pour une date AAAA-MM-JJ. */
export function dateLisible(date: string, avecJour: boolean): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: avecJour ? "long" : undefined,
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Le nombre de jours qui séparent deux dates AAAA-MM-JJ. */
export function joursEntre(de: string, a: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);
}
