"use client";

import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { lesReponses, lireReponses } from "@/lib/reponses";
import { joursDAffilee } from "@/lib/serie";

/** Le dé de la maquette : six pastilles, quelle que soit la série. */
function De() {
  const pastille = { fill: "var(--trav)" };
  return (
    <svg className="die" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="3" width="38" height="36" rx="9" style={{ fill: "#B9B1DE" }} />
      <rect x="1" y="1" width="38" height="35" rx="9" style={{ fill: "#fff" }} />
      {[9.5, 18.5, 27.5].flatMap((cy) => [12, 28].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" style={pastille} />))}
    </svg>
  );
}

/** La barre du haut : pour l'instant, la série de jours d'affilée. */
export function EnTete() {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = Object.values(lesReponses(useCoteClient(lireReponses)));
  const serie = jour ? joursDAffilee(reponses, jour) : 0;

  return (
    <header className="topbar">
      {serie > 0 && (
        <div className="streak" style={{ marginLeft: "auto" }}>
          <De />
          <span>
            <b>
              {serie} {serie > 1 ? "jours" : "jour"}
            </b>{" "}
            <small>d&apos;affilée</small>
          </span>
        </div>
      )}
    </header>
  );
}
