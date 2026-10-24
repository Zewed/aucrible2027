import Link from "next/link";
import type { Candidat } from "@/lib/contenu";

/**
 * Le candidat d'un duel : son pion, son prénom en petit et son nom en grand, et « changer », qui propose les autres
 * candidats, chacun menant à l'adresse du nouveau duel (maquettes/face-a-face.html, maquettes/moi-vs.html). Sans
 * script : un <details> s'ouvre et se referme seul.
 */
export function Pioche({ candidat, autres, adresse }: { candidat: Candidat; autres: Candidat[]; adresse: (c: Candidat) => string }) {
  const [prenom, ...nom] = candidat.nom.split(" ");
  return (
    <div className="pick">
      <span className="pawn pawn--paper">{candidat.initiales}</span>
      <p className="pick-name">
        <small>{prenom}</small>
        <b>{nom.join(" ")}</b>
      </p>
      <details className="chg">
        <summary aria-label={`Changer de candidat : ${candidat.nom}`}>
          <span>changer</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
          </svg>
        </summary>
        <div className="chg-panel">
          <p className="chg-h">Choisir un autre candidat</p>
          <ul>
            {autres.map((c) => (
              <li key={c.id}>
                <Link href={adresse(c)}>
                  <span className="pawn pawn--paper">{c.initiales}</span>
                  <span className="one">{c.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
