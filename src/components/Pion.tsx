import Image from "next/image";
import type { Candidat } from "@/lib/contenu";

/**
 * Le pion d'un candidat : le même pour tous, jamais à la couleur de son parti. Sa photo, en noir et blanc pour tous,
 * recouvre ses initiales, qui restent en dessous quand il n'en a pas. Posé sur le plateau, `place` le situe sur le
 * champ, en %.
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
      {candidat.photo && <Image className="pawn-photo" src={`/candidats/${candidat.id}.jpg`} alt="" width={96} height={96} />}
    </span>
  );
}
