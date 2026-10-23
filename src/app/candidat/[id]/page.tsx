import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { PartDuTheme } from "@/components/PuceTheme";
import { lireCandidats, lireThemes, type Position, type Question, type Theme } from "@/lib/contenu";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "./candidat.css";

/** Le badge d'une position : dite par le candidat (officielle) ou tirée de son groupe ou de son parti (déduite). */
function Badge({ statut }: { statut: Position["statut"] }) {
  return statut === "officielle" ? (
    <span className="badge badge--off">
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      position officielle
    </span>
  ) : (
    <span className="badge badge--ded">
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5c2.7-3 5.3 3 8 0s5.3 3 8 0M4 16c2.7-3 5.3 3 8 0s5.3 3 8 0" />
      </svg>
      position déduite
    </span>
  );
}

/** Les positions d'un candidat sur les questions publiées d'un thème, de la plus ancienne à la plus récente. */
function PositionsDuTheme({ theme, questions, candidatId }: { theme: Theme; questions: Question[]; candidatId: string }) {
  return (
    <section className={`pos-theme ${theme.classe}`} aria-labelledby={`t-${theme.id}`}>
      <header className="pos-h">
        <PartDuTheme />
        <h3 id={`t-${theme.id}`} className="one">
          {theme.nom}
        </h3>
      </header>
      <ul className="pos-list">
        {questions.map((question) => {
          const position = question.positions[candidatId];
          const option = question.options.find((o) => o.id === position?.option);
          return (
            <li key={question.numero} className={option ? "pos" : "pos pos--unk"}>
              <p className="pos-q">
                <span className="pos-n">Q{question.numero}</span>
                {question.question}
              </p>
              <div className="pos-r">
                <p className="pos-a">
                  {option ? (
                    <>
                      <span className="pos-letter">{option.id}</span>
                      <span className="pos-title">{option.libelle}</span>
                    </>
                  ) : (
                    <>
                      <span className="pos-letter" aria-hidden="true">
                        ?
                      </span>
                      <span className="pos-title">Position inconnue — pas de source à ce jour</span>
                    </>
                  )}
                </p>
                {option && position && (
                  // La source est du texte, comme la maquette : en faire un lien reste à trancher (SPEC.md dit « lien + date »).
                  <p className="pos-src">
                    <Badge statut={position.statut} />
                    <span className="src">
                      <span className="sr">Source : </span>
                      {position.source}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * La fiche d'un candidat : son pion, le même que pour les 12 autres, son nom et son parti, en texte,
 * sans couleur de parti, puis le statut de sa candidature quand le contenu le donne ; à côté, ses positions sur
 * les questions publiées, rangées par thème. Toutes sont montrées, comme la maquette (où l'électeur n'a pas répondu
 * à toutes) : les cacher avant la réponse, comme le face-à-face, reste à trancher.
 */
async function FicheCandidat({ id }: { id: string }) {
  const candidat = lireCandidats().find((c) => c.id === id);
  if (!candidat) notFound();
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const questions = [...publiees].sort((a, b) => a.numero - b.numero);
  // Un thème sans question publiée n'a pas de bloc : la maquette n'en dessine pas.
  const themes = lireThemes().filter((t) => questions.some((q) => q.theme === t.id));
  return (
    <>
      {/* Le retour « Mes résultats » de la maquette n'est porté par aucun ticket. */}
      <div className="strip">
        <span></span>
        <CompteARebours jour={jour} />
      </div>
      <main className="fiche">
        <div className="fiche-grid">
          <aside className="fiche-side" aria-label="Qui est-ce">
            <section className="id-card" aria-labelledby="nom">
              <div className="id-top">
                <span className="pawn pawn--paper pawn--big" aria-hidden="true">
                  {candidat.initiales}
                </span>
                <div className="id-name">
                  <p className="kicker">Fiche candidat</p>
                  <h1 id="nom">{candidat.nom}</h1>
                </div>
              </div>
              <p className="party">{candidat.parti}</p>
              {candidat.statut && (
                <p className="status">
                  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="15" rx="3" />
                    <path d="M3.5 10.5h17M8 3v4M16 3v4" />
                  </svg>
                  <span>
                    <b>{candidat.statut.etat}</b>
                    {candidat.statut.suite && ` — ${candidat.statut.suite}`}
                  </span>
                </p>
              )}
            </section>
          </aside>
          <div className="fiche-main">
            <section aria-labelledby="h-pos">
              <div className="sec-h">
                <h2 id="h-pos">Ses positions</h2>
                <p>
                  {questions.length} {questions.length > 1 ? "questions publiées" : "question publiée"}
                </p>
              </div>
              <p className="pos-sum">
                Pour chaque question : son option, d&apos;où ça vient, et si c&apos;est dit par {candidat.nom} ou déduit.
              </p>
              <div className="themes-pos">
                {themes.map((theme) => (
                  <PositionsDuTheme
                    key={theme.id}
                    theme={theme}
                    questions={questions.filter((q) => q.theme === theme.id)}
                    candidatId={candidat.id}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PageCandidat({ params }: PageProps<"/candidat/[id]">) {
  return <Suspense>{params.then(({ id }) => <FicheCandidat id={id} />)}</Suspense>;
}
