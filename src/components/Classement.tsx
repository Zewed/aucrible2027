"use client";

import { Pion } from "@/components/Pion";
import type { Candidat } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Les largeurs des noms estompés de l'aperçu, celles de maquettes/resultats-vide.html. */
const APERCU = [62, 48, 55];

/** Avant 10 réponses : ce qu'il manque, une jauge, et un aperçu estompé, sans aucun nom ni pourcentage. */
function ClassementAVenir({ comptees }: { comptees: number }) {
  const manque = SEUIL_DES_RESULTATS - comptees;
  return (
    <section className="sec" aria-labelledby="h-rank">
      <div className="sec-h">
        <h2 id="h-rank">Ton classement</h2>
        <p>à partir de {SEUIL_DES_RESULTATS} réponses</p>
      </div>
      <div className="empty">
        <div className="empty-body">
          <h3 className="empty-t">
            Encore {manque} {manque > 1 ? "réponses" : "réponse"} pour voir ton classement
          </h3>
          <div className="gauge-row">
            <p className="gauge-n">
              <b>
                {comptees}/{SEUIL_DES_RESULTATS}
              </b>
              <span>réponses</span>
            </p>
            <div className="gauge" role="img" aria-label={`${comptees} ${comptees > 1 ? "réponses" : "réponse"} sur ${SEUIL_DES_RESULTATS}`}>
              {Array.from({ length: SEUIL_DES_RESULTATS }, (_, i) => (
                <i key={i} className={i < comptees ? "on" : undefined}></i>
              ))}
            </div>
          </div>
        </div>
        <p className="ghost-k" aria-hidden="true">
          Il ressemblera à ça
        </p>
        <ol className="rank ghosts" aria-hidden="true">
          {APERCU.map((largeur, rang) => (
            <li key={rang} className="cand ghost">
              <span className="cand-n">{rang + 1}</span>
              <span className="pawn pawn--paper">?</span>
              <span className="cand-name">
                <i className="skel" style={{ "--w": `${largeur}%` } as React.CSSProperties}></i>
              </span>
              <span className="cand-pc">
                –<small> %</small>
              </span>
              <span className="bar"></span>
            </li>
          ))}
        </ol>
      </div>
      <p className="rank-note">Avant {SEUIL_DES_RESULTATS} réponses, un classement serait trop fragile pour être honnête.</p>
    </section>
  );
}

/**
 * « Ton classement » : les candidats, du plus proche au plus éloigné des réponses de l'appareil, à partir
 * de 10 réponses comptées.
 */
export function Classement({ questions, candidats }: { questions: QuestionDuCalcul[]; candidats: Candidat[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const lignes = classement(questions, reponses, candidats);
  const comptees = reponsesComptees(questions, reponses);
  if (comptees < SEUIL_DES_RESULTATS) return <ClassementAVenir comptees={comptees} />;

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
              {pourcentage !== null && (
                <span className="bar">
                  <i style={{ "--p": pourcentage, animationDelay: `${0.15 + rang * 0.05}s` } as React.CSSProperties}></i>
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="rank-note">
        {comptees > 1
          ? `Calculé sur tes ${comptees} réponses, pondérées par l'importance que tu leur donnes.`
          : "Calculé sur ta réponse, pondérée par l'importance que tu lui donnes."}
      </p>
    </section>
  );
}
