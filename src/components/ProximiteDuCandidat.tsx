"use client";

import type { Candidat } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

const rangEnLettres = (rang: number) => (rang === 1 ? "1er" : `${rang}e`);

/**
 * « Ta proximité » sur la fiche d'un candidat : son pourcentage et son rang, ceux de « Mes résultats », calculés
 * sur les réponses de l'appareil. Rien avant 10 réponses comptées, comme le classement (ce que la fiche dit alors
 * reste à trancher), ni quand aucune de ses positions n'est connue sur ces réponses.
 */
export function ProximiteDuCandidat({
  questions,
  candidats,
  candidatId,
}: {
  questions: QuestionDuCalcul[];
  candidats: Candidat[];
  candidatId: string;
}) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const comptees = reponsesComptees(questions, reponses);
  if (comptees < SEUIL_DES_RESULTATS) return null;
  const lignes = classement(questions, reponses, candidats);
  const rang = lignes.findIndex((l) => l.candidat.id === candidatId);
  const pourcentage = lignes[rang]?.pourcentage;
  if (pourcentage == null) return null;

  return (
    <section className="prox" aria-label="Ta proximité">
      <p className="prox-line">
        <span className="prox-k">Ta proximité :</span>{" "}
        <b className="prox-v">
          {pourcentage}
          <small> %</small>
        </b>
      </p>
      <span className="prox-bar" aria-hidden="true">
        <i style={{ "--p": pourcentage } as React.CSSProperties}></i>
      </span>
      <p className="prox-note">
        {rangEnLettres(rang + 1)} sur {lignes.length}
      </p>
    </section>
  );
}
