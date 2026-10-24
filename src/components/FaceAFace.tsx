"use client";

import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que le face-à-face montre d'un candidat sur une question : son option, ou rien si sa position est inconnue. */
export type PositionComparee = { lettre: string; titre: string; implique: string; source: string; officielle: boolean } | null;
/** Une question du face-à-face, réduite à ce qu'il en montre, et aux positions des deux candidats seulement. */
export type QuestionComparee = {
  numero: number;
  question: string;
  theme: { nom: string; classe: string };
  positions: [PositionComparee, PositionComparee];
};
export type Joueur = { nom: string; initiales: string };

/** Le badge de la position : il suit la source (officielle ou déduite), jamais le candidat. */
function Badge({ officielle }: { officielle: boolean }) {
  const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return officielle ? (
    <span className="badge badge--off">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" style={trait} />
      </svg>
      Position officielle
    </span>
  ) : (
    <span className="badge badge--ded">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9c2.7-3 5.3 3 8 0s5.3 3 8 0M4 16c2.7-3 5.3 3 8 0s5.3 3 8 0" style={trait} />
      </svg>
      Position déduite
    </span>
  );
}

/** L'icône de document devant la source. */
function Document() {
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
function Cote({ joueur, position }: { joueur: Joueur; position: PositionComparee }) {
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
          <Badge officielle={position.officielle} />
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
function Verdict({ etat }: { etat: "agree" | "differ" | "unk" }) {
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

/**
 * Les questions du face-à-face, de la plus récente à la plus ancienne. Seules celles auxquelles l'électeur a déjà
 * répondu sont montrées, pour ne rien révéler avant sa réponse (SPEC.md, « Règles validées sur les maquettes »).
 */
export function QuestionsDuFaceAFace({ questions, joueurs }: { questions: QuestionComparee[]; joueurs: [Joueur, Joueur] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const repondues = questions.filter((q) => reponses[q.numero]);
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
    </ul>
  );
}
