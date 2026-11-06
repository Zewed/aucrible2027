"use client";

import { useState } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { oublierLOrdre } from "@/lib/ordre";
import { abonnerAuxReponses, effacerLesReponses, lesReponses, lireReponses } from "@/lib/reponses";

/**
 * « Recommencer le questionnaire » : une action de côté, discrète comme un lien. Elle demande d'abord, sur place,
 * « Effacer tes 23 réponses ? » ; puis l'appareil oublie ses réponses et son ordre des questions, et la première
 * question d'un nouvel ordre s'ouvre, page rechargée, pour que la jauge et le reste relisent l'appareil vide d'un coup.
 * Rien à recommencer sur un appareil sans réponse.
 */
export function Recommencer() {
  // « retour » : la confirmation vient d'être annulée, le bouton reprend le focus qu'elle avait.
  const [etape, setEtape] = useState<"bouton" | "confirmer" | "retour">("bouton");
  const faites = Object.keys(lesReponses(useCoteClient(lireReponses, abonnerAuxReponses))).length;
  if (faites === 0) return null;

  if (etape !== "confirmer")
    return (
      <button type="button" className="recommencer" autoFocus={etape === "retour"} onClick={() => setEtape("confirmer")}>
        Recommencer le questionnaire
      </button>
    );

  const question = `Effacer ${faites > 1 ? `tes ${faites} réponses` : "ta réponse"} ?`;
  return (
    <div className="recommencer-sur" role="group" aria-label={question} onKeyDown={(e) => e.key === "Escape" && setEtape("retour")}>
      <p>{question}</p>
      <button
        type="button"
        className="oui"
        onClick={() => {
          effacerLesReponses();
          oublierLOrdre();
          // Pas router.push : la jauge, qui ne quitte pas la page, garderait l'ancien compte.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          location.assign("/questionnaire");
        }}
      >
        Effacer
      </button>
      <button type="button" className="non" autoFocus onClick={() => setEtape("retour")}>
        Annuler
      </button>
    </div>
  );
}
