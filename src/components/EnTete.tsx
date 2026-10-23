"use client";

import { De } from "@/components/De";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";
import { joursDAffilee } from "@/lib/serie";

/** La barre du haut : pour l'instant, la série de jours d'affilée. */
export function EnTete() {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = Object.values(lesReponses(useCoteClient(lireReponses, abonnerAuxReponses)));
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
