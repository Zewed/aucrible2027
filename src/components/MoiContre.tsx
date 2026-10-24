"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Cote, Document, Verdict, type Joueur, type PositionComparee } from "@/components/FaceAFace";
import { PartDuTheme } from "@/components/PuceTheme";
import { couleurDe } from "@/components/Themes";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { dateCourte } from "@/lib/date";
import { classement, REPONSES_PAR_PART, reponsesComptees, reponsesParTheme, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
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

const voyelle = (nom: string) => /^[aeiouyàâéèêëîïôû]/i.test(nom);
/** « qu'Édouard Philippe », « que Marine Le Pen ». */
const que = (nom: string) => (voyelle(nom) ? `qu'${nom}` : `que ${nom}`);
/** « d'Édouard Philippe », « de Marine Le Pen ». */
const de = (nom: string) => (voyelle(nom) ? `d'${nom}` : `de ${nom}`);

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

/** L'icône d'œil barré de la carte sans réponse. */
function OeilBarre() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4 10 6-.7 1-1.8 2.3-3.2 3.4M6.5 7.6C4.6 8.9 3.2 10.6 2 12c1.5 2 5 6 10 6 1.4 0 2.7-.3 3.8-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"
        style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
      />
    </svg>
  );
}

/**
 * « Question par question » : les réponses de l'électeur face aux positions d'un candidat, de la question la plus
 * récente à la plus ancienne. Une question sans réponse garde sa place, grisée et sans la position du candidat, pour ne
 * rien révéler avant la réponse, avec « Répondre » vers le rattrapage. « Je ne sais pas » compte comme une réponse (à
 * trancher). Rien avant d'être dans le navigateur, seul à connaître les réponses.
 */
export function QuestionsMoiContre({ questions, candidat }: { questions: QuestionMoiContre[]; candidat: Joueur }) {
  const dansLeNavigateur = useSyncExternalStore(sansAbonnement, () => true, () => false);
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const repondues = questions.filter((q) => reponses[q.numero]).length;
  const sansReponse = questions.length - repondues;
  return (
    <section className="sec" aria-labelledby="h-list">
      <div className="sec-h">
        <h2 id="h-list">Question par question</h2>
        {dansLeNavigateur && (
          <p>
            {repondues} {repondues > 1 ? "réponses" : "réponse"} · {sansReponse} sans réponse
          </p>
        )}
      </div>
      {dansLeNavigateur && (
        <ul className="vs-list">
          {questions.map((q) => {
            const reponse = reponses[q.numero];
            if (!reponse)
              return (
                <li key={q.numero} className={`vs ${q.theme.classe} fd-row`}>
                  <article className="fd-card">
                    <p className="label">
                      <i></i>
                      {q.theme.nom}
                    </p>
                    <h3 className="fd-q">{q.question}</h3>
                    <p className="fd-s">
                      <OeilBarre />
                      Tu n&apos;as pas encore répondu
                    </p>
                    <p className="fd-n">La position {de(candidat.nom)} s&apos;affiche après ta réponse.</p>
                    <Link className="btn-link" href="/rattrapage">
                      Répondre
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
                      </svg>
                    </Link>
                  </article>
                </li>
              );
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
      )}
    </section>
  );
}

/**
 * Les questions où l'électeur et le candidat se comparent : répondues autre chose que « Je ne sais pas », et dont la
 * position du candidat est connue, comme dans le calcul.
 */
function questionsComparees(questions: QuestionDuCalcul[], reponses: Record<number, Reponse>, candidat: Candidat) {
  const valide = (q: QuestionDuCalcul, option?: string) => q.options.some((o) => o.id === option);
  return questions.filter(
    (q) => reponses[q.numero] && reponses[q.numero].option !== JE_NE_SAIS_PAS && valide(q, reponses[q.numero].option) && valide(q, q.positions[candidat.id]?.option),
  );
}

/**
 * « Ta proximité avec » le candidat : son pourcentage, celui de « Mes résultats », la phrase qui compte les questions
 * où l'électeur a choisi la même option que lui, et une pastille par question comparée, dans l'ordre des cartes (de la
 * plus récente à la plus ancienne). Rien avant 10 réponses comptées, comme « Mes résultats » (à trancher : la maquette
 * ne dessine pas ce cas).
 */
export function ScoreMoiContre({ questions, candidat }: { questions: QuestionDuCalcul[]; candidat: Candidat }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (reponsesComptees(questions, reponses) < SEUIL_DES_RESULTATS) return null;
  const pourcentage = classement(questions, reponses, [candidat])[0].pourcentage;
  if (pourcentage == null) return null;
  const comparees = questionsComparees(questions, reponses, candidat);
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

/**
 * « Thème par thème » : le pourcentage d'accord avec le candidat sur les seules questions d'un thème, dès 3 réponses
 * comptées dans le thème, comme les parts de « Mes résultats » ; avant, une pastille par réponse, sur 3. Rien avant
 * d'être dans le navigateur, seul à connaître les réponses.
 */
export function ThemesMoiContre({ questions, themes, candidat }: { questions: QuestionDuCalcul[]; themes: Theme[]; candidat: Candidat }) {
  const dansLeNavigateur = useSyncExternalStore(sansAbonnement, () => true, () => false);
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (!dansLeNavigateur) return null;
  const parTheme = reponsesParTheme(questions, reponses);
  return (
    <section className="sec" aria-labelledby="h-th">
      <div className="sec-h">
        <h2 id="h-th">Thème par thème</h2>
        <p>score dès {REPONSES_PAR_PART} réponses</p>
      </div>
      <ul className="themes">
        {themes.map((theme) => {
          const nombre = parTheme[theme.id] ?? 0;
          const duTheme = questions.filter((q) => q.theme === theme.id);
          const pourcentage = nombre >= REPONSES_PAR_PART ? classement(duTheme, reponses, [candidat])[0].pourcentage : null;
          if (pourcentage == null)
            return (
              <li key={theme.id} className={`th ${theme.classe}`}>
                <PartDuTheme vide />
                <span className="th-name one">{theme.nom}</span>
                <span className="pips" aria-label={`${nombre} ${nombre > 1 ? "réponses" : "réponse"}`}>
                  {Array.from({ length: REPONSES_PAR_PART }, (_, k) => (
                    <i key={k} style={k < nombre ? { background: couleurDe(theme) } : undefined}></i>
                  ))}
                </span>
                <span className="th-who one">
                  {nombre >= REPONSES_PAR_PART ? "positions inconnues sur ce thème" : "pas encore assez de réponses"}
                </span>
              </li>
            );
          const comparees = questionsComparees(duTheme, reponses, candidat);
          const memes = comparees.filter((q) => reponses[q.numero].option === q.positions[candidat.id].option).length;
          return (
            <li key={theme.id} className={`th done ${theme.classe}`} style={{ "--p": pourcentage } as React.CSSProperties}>
              <PartDuTheme />
              <span className="th-name one">{theme.nom}</span>
              <span className="th-pc" aria-label={`${pourcentage} pour cent`}>
                {pourcentage}
                <small>&nbsp;%</small>
              </span>
              <span className="th-who one">
                d&apos;accord sur <b>{memes}</b> {memes > 1 ? "questions" : "question"} sur {comparees.length}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
