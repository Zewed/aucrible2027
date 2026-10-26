"use client";

import { useEffect } from "react";
import { aujourdhuiAParis } from "@/lib/date";

const CLE = "aucrible:visite";

/**
 * Compte cet appareil une fois par jour dans les statistiques de visite de l'auteur. Le jour déjà compté reste dans
 * l'appareil (pas de cookie) ; seul part « une visite », sans réponse ni identifiant. L'espace de l'auteur ne compte pas.
 */
export function Visite() {
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    let deja: string | null = null;
    try {
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
