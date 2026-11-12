"use client";

import { useEffect, useState } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuConsentement, choisirConsentement, lireConsentement, quandLeBandeauSeRouvre, rouvrirLeBandeau } from "@/lib/mesure";

/**
 * Le bandeau de consentement de la mesure d'audience (CNIL : accepter et refuser au même niveau, rien ne part avant le
 * choix). Il s'affiche tant que l'appareil n'a pas choisi, et revient quand on touche « Cookies » dans le pied de page.
 */
export function BandeauCookies() {
  const consentement = useCoteClient(lireConsentement, abonnerAuConsentement);
  const [rouvert, setRouvert] = useState(false);
  useEffect(() => quandLeBandeauSeRouvre(() => setRouvert(true)), []);

  if (consentement === null || (consentement !== "a-demander" && !rouvert)) return null;
  const choisir = (accepte: boolean) => {
    choisirConsentement(accepte);
    setRouvert(false);
  };
  return (
    <section className="bandeau-cookies" aria-label="Cookies">
      <p>Ce site mesure son audience avec des cookies.</p>
      <div className="bandeau-cookies-choix">
        <button type="button" onClick={() => choisir(false)} aria-pressed={consentement === "refuse"}>
          Refuser
        </button>
        <button type="button" onClick={() => choisir(true)} aria-pressed={consentement === "accepte"}>
          Accepter
        </button>
      </div>
    </section>
  );
}

/** Le lien du pied de page qui rouvre le bandeau ; absent quand la mesure ne tourne pas. */
export function LienCookies() {
  const consentement = useCoteClient(lireConsentement, abonnerAuConsentement);
  if (consentement === null) return null;
  return (
    <button type="button" className="lien-cookies" onClick={rouvrirLeBandeau}>
      Cookies
    </button>
  );
}
