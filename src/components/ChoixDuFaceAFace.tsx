import Link from "next/link";
import type { ReactNode } from "react";
import type { Candidat } from "@/lib/contenu";

/**
 * Le bouton qui ouvre le face-à-face d'un candidat : il déroule les autres candidats, et chacun mène au face-à-face des
 * deux (`/face-a-face/<candidat>/<autre>`). Il n'y a pas de duo par défaut : c'est l'électeur qui choisit
 * l'adversaire (décision de l'auteur, 24 octobre 2026). Sans script : un <details> s'ouvre et se referme seul.
 */
export function ChoixDuFaceAFace({ candidat, autres, classe, children }: { candidat: Candidat; autres: Candidat[]; classe: string; children: ReactNode }) {
  return (
    <details className="duo">
      <summary className={classe}>{children}</summary>
      <div className="duo-panel">
        <p className="duo-h">Face-à-face avec</p>
        <ul>
          {autres.map((c) => (
            <li key={c.id}>
              <Link href={`/face-a-face/${candidat.id}/${c.id}`}>
                <span className="pawn pawn--paper">{c.initiales}</span>
                <span className="one">{c.nom}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
