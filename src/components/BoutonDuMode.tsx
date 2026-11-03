"use client";

import { useLayoutEffect } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuMode, choisirMode, lireMode } from "@/lib/mode";

const TRAIT = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/**
 * Le bouton du mode clair ou sombre : une icône dans la colonne du menu sur ordinateur, une ligne du pied de page au
 * téléphone, où la barre du haut est pleine. L'icône suit `data-sombre` en CSS : elle est juste dès le premier affichage,
 * avant que `mode` ne soit lu. L'effet applique le choix, fait ici ou dans un autre onglet.
 */
export function BoutonDuMode() {
  const mode = useCoteClient(lireMode, abonnerAuMode);
  useLayoutEffect(() => {
    if (mode) document.documentElement.toggleAttribute("data-sombre", mode === "sombre");
  }, [mode]);
  const autre = mode === "sombre" ? "clair" : "sombre";
  return (
    <button type="button" className="mode" aria-label={`Passer en mode ${autre}`} title={`Passer en mode ${autre}`} onClick={() => choisirMode(autre)}>
      <svg className="mode-lune" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" style={TRAIT} />
      </svg>
      <svg className="mode-soleil" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" style={TRAIT} />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" style={TRAIT} />
      </svg>
      <span>Mode {autre}</span>
    </button>
  );
}
