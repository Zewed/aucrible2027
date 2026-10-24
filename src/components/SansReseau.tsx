"use client";

import { useEffect, useState } from "react";
import { useCoteClient } from "@/lib/cote-client";

const lireLeReseau = () => (navigator.onLine ? "en-ligne" : "hors-ligne");
const abonnerAuReseau = (relire: () => void) => {
  window.addEventListener("online", relire);
  window.addEventListener("offline", relire);
  return () => {
    window.removeEventListener("online", relire);
    window.removeEventListener("offline", relire);
  };
};

/**
 * Sans réseau, toucher un lien de l'app vers une autre page l'arrêterait sur une page vide ou une erreur du navigateur.
 * Le lien est donc retenu, et un message dit qu'il faut une connexion ; le réseau revenu, le message s'efface et le lien
 * marche à nouveau. Le texte est provisoire : sa forme exacte reste à trancher.
 */
export function SansReseau() {
  const horsLigne = useCoteClient(lireLeReseau, abonnerAuReseau) === "hors-ligne";
  const [retenu, setRetenu] = useState(false);
  if (!horsLigne && retenu) setRetenu(false);

  useEffect(() => {
    if (!horsLigne) return;
    const retenir = (evenement: MouseEvent) => {
      const lien = (evenement.target as Element | null)?.closest("a[href]");
      if (!(lien instanceof HTMLAnchorElement) || lien.target === "_blank") return;
      const adresse = new URL(lien.href);
      if (adresse.origin !== location.origin || (adresse.pathname === location.pathname && adresse.hash)) return;
      evenement.preventDefault();
      evenement.stopPropagation();
      setRetenu(true);
    };
    document.addEventListener("click", retenir, true);
    return () => document.removeEventListener("click", retenir, true);
  }, [horsLigne]);

  if (!horsLigne || !retenu) return null;
  return (
    <p className="hors-ligne" role="alert">
      <b>Pas de connexion.</b> Cette page a besoin du réseau pour s&apos;ouvrir : reconnecte-toi, puis touche à nouveau le lien.
      Tes réponses, elles, restent sur ton téléphone.
    </p>
  );
}
