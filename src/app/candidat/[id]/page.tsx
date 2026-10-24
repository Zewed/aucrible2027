import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { ProximiteDuCandidat } from "@/components/ProximiteDuCandidat";
import { PartDuTheme } from "@/components/PuceTheme";
import { lireThemes, type Candidat, type Position, type Question, type Theme } from "@/lib/contenu";
import { lireAujourdhui, lireCandidatsEnLice, lireLesCandidats, lireQuestionsDuCalcul, lireQuestionsPubliees } from "@/lib/publication";
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

const RETIRE = { feminin: "retirée", masculin: "retiré" } as const;

/**
 * Le retrait d'un candidat : son jour, celui qu'il soutient (un lien vers sa fiche), et ce que devient sa fiche.
 * « Elle » est la fiche : la phrase ne dépend pas du candidat.
 */
function Retrait({ candidat, candidats }: { candidat: Candidat; candidats: Candidat[] }) {
  const { date, soutien, accord } = candidat.retrait!;
  const soutenu = candidats.find((c) => c.id === soutien);
  return (
    <div className="gone">
      <span className="pawn pawn--paper" aria-hidden="true">
        {candidat.initiales}
      </span>
      <p>
        {candidat.nom} s&apos;est {accord ? RETIRE[accord] : "retiré·e"} le {date.split("-").reverse().join("/")}
        {soutenu && (
          <>
            {" "}
            et soutient <Link href={`/candidat/${soutenu.id}`}>{soutenu.nom}</Link>
          </>
        )}
        .
      </p>
      <p className="gone-note">Sa fiche reste consultable, mais elle sort du classement.</p>
    </div>
  );
}

/**
 * « Comment lire une position » : les trois badges et ce qu'ils veulent dire. La maquette écrit « Elle l'a dit ou écrit
 * elle-même » pour Marine Tondelier : la phrase dit le nom du candidat, pour ne genrer personne.
 */
function Legende({ nom }: { nom: string }) {
  return (
    <div className="leg" role="group" aria-labelledby="h-leg">
      <h3 id="h-leg">Comment lire une position</h3>
      <ul>
        <li>
          <Badge statut="officielle" />
          <span>{nom} l&apos;a dit ou écrit en personne : programme 2027, déclaration datée.</span>
        </li>
        <li>
          <Badge statut="deduite" />
          <span>Tirée d&apos;un vote de son groupe ou du programme de son parti.</span>
        </li>
        <li>
          <span className="badge badge--unk">
            <span className="q" aria-hidden="true">
              ?
            </span>
            position inconnue
          </span>
          <span>Pas de source : on ne devine jamais.</span>
        </li>
      </ul>
      {/* La page Méthode arrive avec le ticket 143. */}
      <Link className="leg-link" href="/methode">
        Voir la méthode et les sources
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}

/** Les positions d'un candidat sur les questions publiées d'un thème, de la plus ancienne à la plus récente. */
function PositionsDuTheme({ theme, questions, candidatId }: { theme: Theme; questions: Question[]; candidatId: string }) {
  const connue = (q: Question) => q.options.some((o) => o.id === q.positions[candidatId]?.option);
  const inconnues = questions.filter((q) => !connue(q)).length;
  const compte = `${questions.length} ${questions.length > 1 ? "questions publiées" : "question publiée"}`;
  return (
    <section className={`pos-theme ${theme.classe}`} aria-labelledby={`t-${theme.id}`}>
      <header className="pos-h">
        <PartDuTheme />
        <h3 id={`t-${theme.id}`} className="one">
          {theme.nom}
        </h3>
        {/* Une pastille par question publiée du thème, creuse quand la position est inconnue. */}
        <span className="pips" role="img" aria-label={inconnues ? `${compte}, ${inconnues} sans position connue` : compte}>
          {questions.map((q) => (
            <i key={q.numero} className={connue(q) ? "" : "gap"} />
          ))}
        </span>
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
                {!option && <p className="pos-src">Elle ne compte pas dans ta proximité tant qu&apos;on n&apos;a rien de sûr.</p>}
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
  const [candidats, enLice] = await Promise.all([lireLesCandidats(), lireCandidatsEnLice()]);
  const candidat = candidats.find((c) => c.id === id);
  if (!candidat) notFound();
  const [jour, publiees, duCalcul] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees(), lireQuestionsDuCalcul()]);
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
            {/* La maquette montre le retrait en bas de page, en annotation : il prend ici la place de la proximité. */}
            {enLice.some((c) => c.id === candidat.id) ? (
              <ProximiteDuCandidat questions={duCalcul} candidats={enLice} candidatId={candidat.id} />
            ) : (
              <Retrait candidat={candidat} candidats={candidats} />
            )}
            <div className="actions side-actions">
              <Link className="act primary" href={`/moi-contre/${candidat.id}`}>
                Moi contre {candidat.nom}
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </Link>
              {/* « Face-à-face », juste dessous : ticket 134. */}
            </div>
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
              <Legende nom={candidat.nom} />
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
            {/* Ce que le formulaire remplit quand il vient d'une fiche candidat reste à trancher : il s'ouvre sans fiche. */}
            <div className="report">
              <p>Une erreur, un chiffre ou une source à revoir ?</p>
              <Link href="/signaler">
                Signaler une erreur sur cette fiche{" "}
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PageCandidat({ params }: PageProps<"/candidat/[id]">) {
  return <Suspense>{params.then(({ id }) => <FicheCandidat id={id} />)}</Suspense>;
}
