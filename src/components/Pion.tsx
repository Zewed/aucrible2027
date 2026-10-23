import type { Candidat } from "@/lib/contenu";

/**
 * Le pion d'un candidat : le même pour tous, à ses initiales, jamais à la couleur de son parti. Posé sur
 * le plateau, `place` le situe sur le champ, en %.
 */
export function Pion({ candidat, clair = false, place }: { candidat: Candidat; clair?: boolean; place?: { x: number; y: number } }) {
  return (
    <span
      className={clair ? "pawn pawn--paper" : "pawn"}
      aria-hidden="true"
      title={place ? candidat.nom : undefined}
      style={place ? ({ "--x": `${place.x}%`, "--y": `${place.y}%` } as React.CSSProperties) : undefined}
    >
      {candidat.initiales}
    </span>
  );
}
