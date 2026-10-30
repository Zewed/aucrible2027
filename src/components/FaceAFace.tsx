"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Position } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que le face-à-face montre d'un candidat sur une question : son option, ou rien si sa position est inconnue. */
export type PositionComparee = { lettre: string; titre: string; implique: string; source: string; statut: Position["statut"] } | null;
/** Une question du face-à-face, réduite à ce qu'il en montre, et aux positions des deux candidats seulement. */
export type QuestionComparee = {
  numero: number;
  question: string;
  theme: { nom: string; classe: string };
  positions: [PositionComparee, PositionComparee];
};
export type Joueur = { nom: string; initiales: string };

/** Le badge de la position : il suit la source (officielle, déduite ou estimée), jamais le candidat. */
function Badge({ statut }: { statut: Position["statut"] }) {
  const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (statut === "officielle")
    return (
      <span className="badge badge--off">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" style={trait} />
        </svg>
        Position officielle
      </span>
    );
  if (statut === "estimee")
    return (
      <span className="badge badge--est">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12.5c2.7-3 5.3 3 8 0s5.3 3 8 0" style={trait} />
        </svg>
        Position estimée
      </span>
    );
  return (
    <span className="badge badge--ded">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9c2.7-3 5.3 3 8 0s5.3 3 8 0M4 16c2.7-3 5.3 3 8 0s5.3 3 8 0" style={trait} />
      </svg>
      Position déduite
    </span>
  );
}

/** L'icône de document devant la source. */
export function Document() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6zM14 3v4h4" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
    </svg>
  );
}

/**
 * Un côté de la carte : le candidat, puis son option, sa lettre et sa phrase d'explication ; ou, sans source,
 * « Position inconnue ». La maquette dit « Aucune source datée de moins de 12 mois » : une source plus ancienne
 * (le programme 2022) compte pourtant, d'où « Pas de source à ce jour ».
 */
export function Cote({ joueur, position }: { joueur: Joueur; position: PositionComparee }) {
  return (
    <section className={position ? "side" : "side unk"} aria-label={`Position de ${joueur.nom}`}>
      <p className="who">
        <span className="pawn">{joueur.initiales}</span>
        <b className="one">{joueur.nom}</b>
      </p>
      {!position && (
        <>
          <div className="pos">
            <span className="opt-letter" aria-hidden="true">
              ?
            </span>
            <p className="pos-t">Position inconnue</p>
            <p className="pos-i">Pas de source à ce jour. Cette question est exclue du calcul pour ce candidat.</p>
          </div>
          <div className="meta">
            <span className="badge badge--none">Exclue du calcul</span>
            <p className="src">
              <Document />
              <span>Aucune source</span>
            </p>
          </div>
        </>
      )}
      {position && (
        <div className="pos">
          <span className="opt-letter">{position.lettre}</span>
          <p className="pos-t">{position.titre}</p>
          <p className="pos-i">{position.implique}</p>
        </div>
      )}
      {/* La source est du texte, comme la maquette : en faire un lien reste à trancher. */}
      {position && (
        <div className="meta">
          <Badge statut={position.statut} />
          <p className="src">
            <Document />
            <span>{position.source}</span>
          </p>
        </div>
      )}
    </section>
  );
}

/** Le verdict d'une question : la même option, des options différentes, ou rien à comparer (une position inconnue). */
const verdict = (q: QuestionComparee): "agree" | "differ" | "unk" =>
  q.positions[0] && q.positions[1] ? (q.positions[0].lettre === q.positions[1].lettre ? "agree" : "differ") : "unk";

/** Le disque entre les deux positions, et ce qu'il dit. */
export function Verdict({ etat }: { etat: "agree" | "differ" | "unk" }) {
  if (etat === "unk")
    return (
      <div className="link">
        <div className="link-in">
          <span className="disc" aria-hidden="true">
            <span aria-hidden="true">?</span>
          </span>
          <span className="verdict">Non comparée</span>
        </div>
      </div>
    );
  return (
    <div className="link">
      <div className="link-in">
        <span className="disc" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={etat === "agree" ? "M5 12.5l4.5 4.5L19 7.5" : "M6 9h12M6 15h12M16 4.5L8 19.5"}
              style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
            />
          </svg>
        </span>
        <span className="verdict">{etat === "agree" ? "Même option" : "Options différentes"}</span>
      </div>
    </div>
  );
}

const sansAbonnement = () => () => {};

/**
 * Les questions répondues par l'électeur, les seules que le face-à-face compare ; null tant que la page n'est pas dans
 * le navigateur, seul à connaître les réponses : rien ne s'affiche avant, ni une liste vide ni l'invitation à répondre.
 */
function useQuestionsRepondues(questions: QuestionComparee[]) {
  const dansLeNavigateur = useSyncExternalStore(sansAbonnement, () => true, () => false);
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  return dansLeNavigateur ? questions.filter((q) => reponses[q.numero]) : null;
}

const nomDeFamille = (joueur: Joueur) => joueur.nom.split(" ").slice(1).join(" ");
const enQuestions = (n: number) => `${n} question${n > 1 ? "s" : ""}`;

/**
 * « D'accord sur N questions sur M » : le compte des verdicts des cartes, sur les questions répondues, et une pastille
 * par question, dans l'ordre de la liste (maquettes/face-a-face.html). Rien sans aucune question répondue (ticket 111).
 */
export function ResumeDuFaceAFace({ questions, joueurs }: { questions: QuestionComparee[]; joueurs: [Joueur, Joueur] }) {
  const repondues = useQuestionsRepondues(questions);
  if (!repondues || repondues.length === 0) return null;
  const etats = repondues.map(verdict);
  const [memes, differentes, inconnues] = (["agree", "differ", "unk"] as const).map((e) => etats.filter((x) => x === e).length);
  return (
    <section className="sum" aria-labelledby="h-sum">
      <p className="sum-k">
        Entre {nomDeFamille(joueurs[0])} et {nomDeFamille(joueurs[1])}
      </p>
      <h2 className="sum-t" id="h-sum">
        <span className="sum-pre">D&apos;accord sur</span>{" "}
        <span className="sum-n">
          <em>{memes}</em> {memes > 1 ? "questions" : "question"} sur <em>{repondues.length}</em>
        </span>
      </h2>
      <p className="sum-s">
        <b>{differentes}</b> fois, ils ne choisissent pas la même option. <b>{inconnues}</b>{" "}
        {inconnues > 1 ? "questions restent" : "question reste"} sans comparaison : un des deux n&apos;a pas de position connue.
      </p>
      <div
        className="tally"
        role="img"
        aria-label={`Sur ${enQuestions(repondues.length)} : ${memes} fois la même option, ${differentes} fois des options différentes, ${inconnues} ${inconnues > 1 ? "comparaisons impossibles" : "comparaison impossible"}`}
      >
        {etats.map((e, i) => (
          <i key={i} className={e === "agree" ? "on" : e === "unk" ? "none" : undefined}></i>
        ))}
      </div>
      <ul className="tally-key" aria-hidden="true">
        <li>
          <i className="on"></i>même option
        </li>
        <li>
          <i></i>options différentes
        </li>
        <li>
          <i className="none"></i>position inconnue
        </li>
      </ul>
    </section>
  );
}

/**
 * « Filtrer par thème » : « Toutes », puis les 11 thèmes, un seul à la fois. Le filtre est celui de la maquette, sans
 * script : le bouton coché masque, par la feuille de style, les cartes des autres thèmes. Le nombre est celui des
 * questions répondues, quel que soit le thème choisi (que le résumé et ce nombre suivent le filtre reste à trancher).
 */
export function FiltreDuFaceAFace({ themes, questions }: { themes: { nom: string; classe: string }[]; questions: QuestionComparee[] }) {
  const repondues = useQuestionsRepondues(questions);
  // Sans aucune réponse, rien à filtrer (à trancher : la maquette ne dessine pas ce cas).
  if (!repondues || repondues.length === 0) return null;
  return (
    <fieldset className="filt">
      <legend>
        <span className="sec-h">
          <h2>Filtrer par thème</h2>
          <p>{enQuestions(repondues.length)}</p>
        </span>
      </legend>
      <div className="chips-row">
        <label className="chip all">
          <input type="radio" name="theme" id="f-all" defaultChecked />
          <span>
            <i></i>Toutes
          </span>
        </label>
        {themes.map((theme) => (
          <label key={theme.classe} className={`chip ${theme.classe}`}>
            <input type="radio" name="theme" id={`f-${theme.classe.replace("theme-", "")}`} />
            <span>
              <i></i>
              {theme.nom}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Les questions du face-à-face, de la plus récente à la plus ancienne. Seules celles auxquelles l'électeur a déjà
 * répondu sont montrées, pour ne rien révéler avant sa réponse (SPEC.md, « Règles validées sur les maquettes »).
 */
export function QuestionsDuFaceAFace({ questions, joueurs }: { questions: QuestionComparee[]; joueurs: [Joueur, Joueur] }) {
  const repondues = useQuestionsRepondues(questions);
  if (!repondues) return null;
  const cachees = questions.length - repondues.length;
  return (
    <ul className="vs-list">
      {repondues.map((q) => {
        const etat = verdict(q);
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
                <Cote joueur={joueurs[0]} position={q.positions[0]} />
                <Verdict etat={etat} />
                <Cote joueur={joueurs[1]} position={q.positions[1]} />
              </div>
            </article>
          </li>
        );
      })}
      {/* La carte retournée : les questions pas encore répondues, dont les positions restent cachées. Sans aucune
          réponse, elle invite à répondre d'abord (texte provisoire : la maquette ne dessine pas ce cas). */}
      {cachees > 0 && (
        <li className="vs fd-row">
          <article className="fd-card">
            <p className="label">
              <i style={{ background: "var(--muted)" }}></i>Questions cachées
            </p>
            {repondues.length > 0 ? (
              <>
                <h3 className="fd-q">
                  {cachees > 1 ? `${cachees} questions attendent` : "1 question attend"} encore ta réponse
                </h3>
              </>
            ) : (
              <>
                <h3 className="fd-q">{cachees > 1 ? `Les ${cachees} questions attendent` : "La question attend"} ta réponse</h3>
              </>
            )}
            <Link className="btn-link" href="/">
              Répondre
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
              </svg>
            </Link>
          </article>
        </li>
      )}
    </ul>
  );
}
