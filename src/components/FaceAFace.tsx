"use client";

import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que le face-à-face montre d'un candidat sur une question : son option, ou rien si sa position est inconnue. */
export type PositionComparee = { lettre: string; titre: string; implique: string; source: string } | null;
/** Une question du face-à-face, réduite à ce qu'il en montre, et aux positions des deux candidats seulement. */
export type QuestionComparee = {
  numero: number;
  question: string;
  theme: { nom: string; classe: string };
  positions: [PositionComparee, PositionComparee];
};
export type Joueur = { nom: string; initiales: string };

/** Un côté de la carte : le candidat, puis son option, sa lettre et sa phrase d'explication. */
function Cote({ joueur, position }: { joueur: Joueur; position: PositionComparee }) {
  return (
    <section className="side" aria-label={`Position de ${joueur.nom}`}>
      <p className="who">
        <span className="pawn">{joueur.initiales}</span>
        <b className="one">{joueur.nom}</b>
      </p>
      {/* Une position inconnue : ticket 108. */}
      {position && (
        <div className="pos">
          <span className="opt-letter">{position.lettre}</span>
          <p className="pos-t">{position.titre}</p>
          <p className="pos-i">{position.implique}</p>
        </div>
      )}
      {/* La source est du texte, comme la maquette : en faire un lien reste à trancher. Le badge : ticket 101. */}
      {position && (
        <div className="meta">
          <p className="src">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 3h8l4 4v14H6zM14 3v4h4"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            <span>{position.source}</span>
          </p>
        </div>
      )}
    </section>
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
      {repondues.map((q) => (
        <li key={q.numero} className={`vs ${q.theme.classe}`}>
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
              {/* Le trait entre les deux positions ; ce qu'il dit, « Même option » ou non, est le ticket 102. */}
              <div className="link" aria-hidden="true"></div>
              <Cote joueur={joueurs[1]} position={q.positions[1]} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
