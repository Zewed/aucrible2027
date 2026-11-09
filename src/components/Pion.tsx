import Image from "next/image";
import type { Candidat } from "@/lib/contenu";

/**
 * Le pion d'un candidat : le même pour tous, jamais à la couleur de son parti. Sa photo, en noir et blanc pour tous,
 * recouvre ses initiales, qui restent en dessous quand il n'en a pas.
 */
export function Pion({ candidat, clair = false }: { candidat: Candidat; clair?: boolean }) {
  return (
    <span className={clair ? "pawn pawn--paper" : "pawn"} aria-hidden="true">
      {candidat.initiales}
      {candidat.photo && <Image className="pawn-photo" src={`/candidats/${candidat.id}.jpg`} alt="" width={96} height={96} />}
    </span>
  );
}
