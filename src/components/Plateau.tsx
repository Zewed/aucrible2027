"use client";

import { Camembert } from "@/components/Camembert";
import { Pion } from "@/components/Pion";
import { PisteDuPlateau } from "@/components/PisteDuPlateau";
import { useCoteClient } from "@/lib/cote-client";
import type { Candidat } from "@/lib/contenu";
import { melanger } from "@/lib/melange";
import { placeDeLElecteur, placeDuCandidat, surLeChamp } from "@/lib/plateau";
import { reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** « Ton plateau » : la carte à deux axes, les pions des candidats, et le pion « TOI » à la place que donnent tes réponses. */
export function Plateau({ questions, candidats }: { questions: QuestionDuCalcul[]; candidats: Candidat[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const { x, y } = surLeChamp(placeDeLElecteur(questions, reponses));
  // La légende range les candidats au hasard (SPEC.md, « Neutralité ») : un ordre fixé par les graines des
  // réponses de l'appareil, qui ne bouge qu'avec une nouvelle réponse.
  const graine = Object.values(reponses).reduce((somme, r) => (somme + r.graine) >>> 0, 0);
  // Comme le classement, les candidats n'arrivent qu'à 10 réponses.
  const avecCandidats = reponsesComptees(questions, reponses) >= SEUIL_DES_RESULTATS;
  const enLegende = avecCandidats ? melanger(candidats, graine) : [];

  return (
    <section className="sec" aria-labelledby="h-board">
      <div className="sec-h">
        <h2 id="h-board">Ton plateau</h2>
        <p>2 axes, {enLegende.length + 1 > 1 ? `${enLegende.length + 1} pions` : "1 pion"}</p>
      </div>
      <div className="board-wrap">
        <div
          className="board"
          role="img"
          aria-label="Carte à deux axes : plus de redistribution à gauche, plus de marché à droite, progressiste en haut, conservateur en bas, avec les pions des candidats et ton pion « toi »"
        >
          <PisteDuPlateau />
          <div className="field">
            {enLegende.map((candidat) => (
              <Pion key={candidat.id} candidat={candidat} place={surLeChamp(placeDuCandidat(questions, candidat.id))} />
            ))}
            <span className="you" style={{ "--x": `${x}%`, "--y": `${y}%` } as React.CSSProperties}>
              <Camembert />
              <span>TOI</span>
            </span>
          </div>
          <span className="edge top">↑ progressiste</span>
          <span className="edge bottom">↓ conservateur</span>
          <span className="edge left">← plus de redistribution</span>
          <span className="edge right">plus de marché →</span>
        </div>
        <ul className="legend" aria-label="Légende du plateau">
          <li className="me">
            <span className="pawn pawn--you">TOI</span>
            <span>
              <b>Toi</b>, ton camembert
            </span>
          </li>
          {enLegende.map((candidat) => (
            <li key={candidat.id}>
              <Pion candidat={candidat} />
              <span>{candidat.nom}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
