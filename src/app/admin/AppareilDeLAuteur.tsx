"use client";

import { useEffect } from "react";
import { APPAREIL_DE_L_AUTEUR } from "@/components/Visite";

/** Marque l'appareil où l'auteur vient d'entrer : ses propres passages sur le site ne comptent plus dans les visites. */
export function AppareilDeLAuteur() {
  useEffect(() => {
    try {
      localStorage.setItem(APPAREIL_DE_L_AUTEUR, "1");
    } catch {}
  }, []);
  return null;
}
