"use client";

import { useSyncExternalStore } from "react";
import { Cote, Document, Verdict, type Joueur, type PositionComparee } from "@/components/FaceAFace";
import type { Candidat } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { dateCourte } from "@/lib/date";
import { classement, reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, JE_NE_SAIS_PAS, lesReponses, lireReponses, type Reponse } from "@/lib/reponses";

/** Une question de « Moi contre » : ses options (pour retrouver celle de l'électeur) et la position du candidat. */
export type QuestionMoiContre = {
  numero: number;
  question: string;
  theme: { nom: string; classe: string };
  options: { lettre: string; titre: string; implique: string }[];
  position: PositionComparee;
};

const sansAbonnement = () => () => {};

/** « qu'Édouard Philippe », « que Marine Le Pen ». */
const que = (nom: string) => (/^[aeiouyàâéèêëîïôû]/i.test(nom) ? `qu'${nom}` : `que ${nom}`);

/**
 * Le côté de l'électeur : sa carte (lettre, titre, phrase), « Ta réponse », et le jour et l'importance de sa réponse.
 * Après « Je ne sais pas », la carte le dit, sans lettre (à trancher : la maquette ne dessine pas ce cas).
 */
function CoteDeLElecteur({ question, reponse }: { question: QuestionMoiContre; reponse: Reponse }) {
  const option = question.options.find((o) => o.lettre === reponse.option);
  return (
    <section className="side me" aria-label="Ta réponse">
      <p className="who">
        <span className="pawn pawn--you">TOI</span>
        <b className="one">Toi</b>
      </p>
      <div className="pos">
        <span className="opt-letter" aria-hidden={!option}>
          {option ? option.lettre : "?"}
        </span>
        <p className="pos-t">{option ? option.titre : "Je ne sais pas"}</p>
        {option && <p className="pos-i">{option.implique}</p>}
      </div>
      <div className="meta">
        <span className="badge badge--me">Ta réponse</span>
        <p className="src">
          <Document />
          <span>
            {dateCourte(reponse.jour)} · importance ×{reponse.importance ?? 1}
          </span>
        </p>
      </div>
    </section>
  );
}

/**
 * Les réponses de l'électeur face aux positions d'un candidat, question par question, de la plus récente à la plus
 * ancienne : seules les questions répondues, et rien avant d'être dans le navigateur, seul à connaître les réponses.
 * Les questions non répondues (ticket 119) ne sont pas encore montrées.
 */
export function QuestionsMoiContre({ questions, candidat }: { questions: QuestionMoiContre[]; candidat: Joueur }) {
  const dansLeNavigateur = useSyncExternalStore(sansAbonnement, () => true, () => false);
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (!dansLeNavigateur) return null;
  const repondues = questions.filter((q) => reponses[q.numero]);
  return (
    <ul className="vs-list">
      {repondues.map((q) => {
        const reponse = reponses[q.numero];
        const etat =
          reponse.option === JE_NE_SAIS_PAS || !q.position ? "unk" : reponse.option === q.position.lettre ? "agree" : "differ";
        return (
          <li key={q.numero} className={`vs ${q.theme.classe} ${etat === "unk" ? "unk-row" : etat}`}>
            <article className="vs-card" aria-labelledby={`q${q.numero}`}>
              <header className="vs-head">
                <p className="label">
                  <i></i>
                  {q.theme.nom}
                </p>
                <h3 className="vs-q" id={`q${q.numero}`}>
                  {q.question}
                </h3>
              </header>
              <div className="vs-body">
                <CoteDeLElecteur question={q} reponse={reponse} />
                <Verdict etat={etat} />
                <Cote joueur={candidat} position={q.position} />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * « Ta proximité avec » le candidat : son pourcentage, celui de « Mes résultats », la phrase qui compte les questions
 * où l'électeur a choisi la même option que lui, et une pastille par question comparée, dans l'ordre des cartes (de la
 * plus récente à la plus ancienne). Une question n'est comparée que si l'électeur y a répondu autre chose que « Je ne
 * sais pas » et que la position du candidat est connue, comme dans le calcul. Rien avant 10 réponses comptées, comme
 * « Mes résultats » (à trancher : la maquette ne dessine pas ce cas).
 */
export function ScoreMoiContre({ questions, candidat }: { questions: QuestionDuCalcul[]; candidat: Candidat }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (reponsesComptees(questions, reponses) < SEUIL_DES_RESULTATS) return null;
  const pourcentage = classement(questions, reponses, [candidat])[0].pourcentage;
  if (pourcentage == null) return null;
  const valide = (q: QuestionDuCalcul, option?: string) => q.options.some((o) => o.id === option);
  const comparees = questions.filter(
    (q) => reponses[q.numero] && reponses[q.numero].option !== JE_NE_SAIS_PAS && valide(q, reponses[q.numero].option) && valide(q, q.positions[candidat.id]?.option),
  );
  const memes = comparees.filter((q) => reponses[q.numero].option === q.positions[candidat.id].option).length;
  return (
    <section className="score" aria-labelledby="h-score">
      <p className="score-k">Ta proximité avec {candidat.nom}</p>
      <p className="score-big" aria-hidden="true">
        {pourcentage}
        <small>&nbsp;%</small>
      </p>
      <h2 className="score-t" id="h-score">
        Tu es d&apos;accord avec {candidat.nom} sur {memes} {memes > 1 ? "questions" : "question"} sur {comparees.length}
        &nbsp;({pourcentage}&nbsp;%)
      </h2>
      <div
        className="tally"
        role="img"
        aria-label={`Sur tes ${comparees.length} réponses comparées : ${memes} fois la même option ${que(candidat.nom)}, ${comparees.length - memes} fois une autre`}
      >
        {comparees.map((q) => (
          <i key={q.numero} className={reponses[q.numero].option === q.positions[candidat.id].option ? "on" : undefined}></i>
        ))}
      </div>
      <ul className="score-key" aria-hidden="true">
        <li>
          <i className="on"></i>même option
        </li>
        <li>
          <i></i>autre option
        </li>
      </ul>
      {/* Le lien « Comment on calcule » de la maquette n'est porté par aucun ticket. */}
      <p className="score-n">Le pourcentage compte aussi les options proches et l&apos;importance que tu donnes à chaque sujet.</p>
    </section>
  );
}
