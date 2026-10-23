"use client";

import { Camembert } from "@/components/Camembert";
import { PisteDuPlateau } from "@/components/PisteDuPlateau";
import { useCoteClient } from "@/lib/cote-client";
import { placeDeLElecteur, surLeChamp } from "@/lib/plateau";
import type { QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** « Ton plateau » : la carte à deux axes, et le pion « TOI » à la place que donnent tes réponses. */
export function Plateau({ questions }: { questions: QuestionDuCalcul[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const { x, y } = surLeChamp(placeDeLElecteur(questions, reponses));

  return (
    <section className="sec" aria-labelledby="h-board">
      <div className="sec-h">
        <h2 id="h-board">Ton plateau</h2>
        <p>2 axes</p>
      </div>
      <div className="board-wrap">
        <div
          className="board"
          role="img"
          aria-label="Carte à deux axes : plus de redistribution à gauche, plus de marché à droite, progressiste en haut, conservateur en bas, avec ton pion « toi »"
        >
          <PisteDuPlateau />
          <div className="field">
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
      </div>
    </section>
  );
}
