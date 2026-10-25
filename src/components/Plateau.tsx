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
    // « vide » : la légende de resultats-vide.html, sur une colonne, avant 10 réponses.
    <section className={avecCandidats ? "sec" : "sec vide"} aria-labelledby="h-board">
      <div className="sec-h">
        <h2 id="h-board">Ton plateau</h2>
        <p>{avecCandidats ? `2 axes, ${enLegende.length + 1} pions` : "2 axes"}</p>
      </div>
      <div className="board-wrap">
        <div
          className="board"
          role="img"
          aria-label={
            avecCandidats
              ? "Carte à deux axes : plus de redistribution à gauche, plus de marché à droite, progressiste en haut, conservateur en bas, avec les pions des candidats et ton pion « toi »"
              : "Carte à deux axes : ta position est encore floue, elle s'affinera avec tes réponses"
          }
        >
          <PisteDuPlateau />
          <div className="field">
            {enLegende.map((candidat) => (
              <Pion key={candidat.id} candidat={candidat} place={surLeChamp(placeDuCandidat(questions, candidat.id))} />
            ))}
            {/* Avant 10 réponses, la place se lit sur les premières réponses, mais floue : un halo, un pion estompé. */}
            {!avecCandidats && <span className="halo" aria-hidden="true" style={{ "--x": `${x}%`, "--y": `${y}%` } as React.CSSProperties}></span>}
            <span className={avecCandidats ? "you" : "you faint"} style={{ "--x": `${x}%`, "--y": `${y}%` } as React.CSSProperties}>
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
              <b>Toi</b>, {avecCandidats ? "ton camembert" : "ta position encore floue"}
            </span>
          </li>
          {!avecCandidats && (
            <li>
              <span className="pawn pawn--ghost">?</span>
              <span>Les pions des candidats arrivent à {SEUIL_DES_RESULTATS} réponses</span>
            </li>
          )}
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
