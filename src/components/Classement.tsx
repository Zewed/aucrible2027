"use client";

import { Pion } from "@/components/Pion";
import type { Candidat } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, JE_NE_SAIS_PAS, lesReponses, lireReponses } from "@/lib/reponses";

/** Le nombre de réponses à partir duquel le classement s'affiche (SPEC.md : « à partir d'environ 10 réponses »). */
const SEUIL = 10;

/** Les largeurs des noms estompés de l'aperçu, celles de maquettes/resultats-vide.html. */
const APERCU = [62, 48, 55];

/** Avant 10 réponses : ce qu'il manque, une jauge, et un aperçu estompé, sans aucun nom ni pourcentage. */
function ClassementAVenir({ comptees }: { comptees: number }) {
  const manque = SEUIL - comptees;
  return (
    <section className="sec" aria-labelledby="h-rank">
      <div className="sec-h">
        <h2 id="h-rank">Ton classement</h2>
        <p>à partir de {SEUIL} réponses</p>
      </div>
      <div className="empty">
        <div className="empty-body">
          <h3 className="empty-t">
            Encore {manque} {manque > 1 ? "réponses" : "réponse"} pour voir ton classement
          </h3>
          <div className="gauge-row">
            <p className="gauge-n">
              <b>
                {comptees}/{SEUIL}
              </b>
              <span>réponses</span>
            </p>
            <div className="gauge" role="img" aria-label={`${comptees} ${comptees > 1 ? "réponses" : "réponse"} sur ${SEUIL}`}>
              {Array.from({ length: SEUIL }, (_, i) => (
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
      <p className="rank-note">Avant {SEUIL} réponses, un classement serait trop fragile pour être honnête.</p>
    </section>
  );
}

/**
 * « Ton classement » : les candidats, du plus proche au plus éloigné des réponses de l'appareil, à partir
 * de 10 réponses comptées (« Je ne sais pas » n'est pas compté, en attendant que ce soit tranché).
 */
export function Classement({ questions, candidats }: { questions: QuestionDuCalcul[]; candidats: Candidat[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const lignes = classement(questions, reponses, candidats);
  // Les réponses qui entrent dans le calcul : « Je ne sais pas » n'y entre pas.
  const comptees = questions.filter((q) => reponses[q.numero] && reponses[q.numero].option !== JE_NE_SAIS_PAS).length;
  if (comptees < SEUIL) return <ClassementAVenir comptees={comptees} />;

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
