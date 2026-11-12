"use client";

import { useEffect } from "react";
import { aujourdhuiAParis } from "@/lib/date";

const CLE = "aucrible:visite";

/** Posé par l'espace de l'auteur sur chacun de ses appareils (app/admin/AppareilDeLAuteur.tsx) : ils ne comptent plus. */
export const APPAREIL_DE_L_AUTEUR = "aucrible:auteur";

/**
 * Compte cet appareil une fois par jour dans les statistiques de visite de l'auteur. Le jour déjà compté reste dans
 * l'appareil (pas de cookie) ; seul part « une visite », sans réponse ni identifiant. L'espace de l'auteur ne compte pas,
 * ni aucun appareil où l'auteur est entré.
 */
export function Visite() {
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    let deja: string | null = null;
    try {
      if (localStorage.getItem(APPAREIL_DE_L_AUTEUR)) return;
      deja = localStorage.getItem(CLE);
    } catch {
      return;
    }
    if (deja === aujourdhuiAParis()) return;
    fetch("/visite", { method: "POST", keepalive: true })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((compte: { jour: string } | null) => {
        if (compte) localStorage.setItem(CLE, compte.jour);
      })
      .catch(() => {});
  }, []);
  return null;
}
