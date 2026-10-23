"use client";

import { Pion } from "@/components/Pion";
import type { Candidat } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** « Ton classement » : les candidats, du plus proche au plus éloigné des réponses de l'appareil. */
export function Classement({ questions, candidats }: { questions: QuestionDuCalcul[]; candidats: Candidat[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const lignes = classement(questions, reponses, candidats);
  // Ce que montre la page sans aucune réponse comptée reste à trancher : pour l'instant, rien.
  if (lignes.every((ligne) => ligne.pourcentage === null)) return null;

  return (
    <section className="sec" aria-labelledby="h-rank">
      <div className="sec-h">
        <h2 id="h-rank">Ton classement</h2>
        <p>proximité, en %</p>
      </div>
      <ol className="rank">
        {lignes.map(({ candidat, pourcentage }, rang) => (
          <li key={candidat.id}>
            <div className="cand">
              <span className="cand-n">{rang + 1}</span>
              <Pion candidat={candidat} clair />
              <span className="cand-name one">{candidat.nom}</span>
              <span className="cand-pc">
                {pourcentage === null ? (
                  "—"
                ) : (
                  <>
                    {pourcentage}
                    <small> %</small>
                  </>
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
