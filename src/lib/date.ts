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
