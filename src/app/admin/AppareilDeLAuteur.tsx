"use client";

import { useEffect } from "react";
import { APPAREIL_DE_L_AUTEUR } from "@/lib/appareil-de-l-auteur";

/** Marque l'appareil où l'auteur vient d'entrer : ses passages et ses réponses ne comptent plus. */
export function AppareilDeLAuteur() {
  useEffect(() => {
    try {
      localStorage.setItem(APPAREIL_DE_L_AUTEUR, "1");
    } catch {}
  }, []);
  return null;
}
