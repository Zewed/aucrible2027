/** La date du jour à Paris, au format AAAA-MM-JJ. */
export function aujourdhuiAParis(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(maintenant);
}
