import type { Candidat } from "@/lib/contenu";

/** Le pion d'un candidat : le même pour tous, à ses initiales, jamais à la couleur de son parti. */
export function Pion({ candidat, clair = false }: { candidat: Candidat; clair?: boolean }) {
  return (
    <span className={clair ? "pawn pawn--paper" : "pawn"} aria-hidden="true">
      {candidat.initiales}
    </span>
  );
}
