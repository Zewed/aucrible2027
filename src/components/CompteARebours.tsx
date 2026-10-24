import { joursEntre } from "@/lib/date";

/** Le 1er tour de la présidentielle (SPEC.md, introduction). */
export const PREMIER_TOUR = "2027-04-18";

/** « J-177 avant le 1er tour », pour le jour donné (AAAA-MM-JJ). */
export function CompteARebours({ jour }: { jour: string }) {
  const jours = joursEntre(jour, PREMIER_TOUR);
  // Ce que devient le compte à rebours à partir du 1er tour n'est pas encore tranché.
  if (jours < 1) return null;
  return (
    <span className="countdown">
      <b>J-{jours}</b> <span>avant le 1er tour</span>
    </span>
  );
}
