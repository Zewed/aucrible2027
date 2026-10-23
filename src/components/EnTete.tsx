"use client";

import { useState } from "react";
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

  // La série déjà affichée par cet en-tête, qui reste monté d'une page à l'autre : le dé ne roule que
  // si elle augmente sous ses yeux, pas au chargement d'une page.
  const [affichee, setAffichee] = useState<number | null>(null);
  const [roule, setRoule] = useState(false);
  if (jour && affichee !== serie) {
    if (affichee !== null && serie > affichee) setRoule(true);
    setAffichee(serie);
  }

  return (
    <header className="topbar">
      {serie > 0 && (
        <div className="streak" style={{ marginLeft: "auto" }}>
          <De roule={roule} onRoule={() => setRoule(false)} />
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
