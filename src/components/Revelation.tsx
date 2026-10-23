"use client";

import { NumeroQuestion } from "@/components/NumeroQuestion";
import type { Candidat, Position, Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { melanger } from "@/lib/melange";
import { useCoteClient } from "@/lib/cote-client";
import { lireReponseEnCours, type ReponseEnCours } from "@/lib/reponses";

/** Le pion d'un candidat : le même pour tous, à ses initiales, jamais à la couleur de son parti. */
function Pion({ candidat, clair = false }: { candidat: Candidat; clair?: boolean }) {
  return (
    <span className={clair ? "pawn pawn--paper" : "pawn"} aria-hidden="true">
      {candidat.initiales}
    </span>
  );
}

/** Une ligne de l'alignement : un titre, puis les candidats concernés ; rien quand il n'y en a aucun. */
function LigneAlignement({ id, titre, candidats, principale = false }: { id: string; titre: string; candidats: Candidat[]; principale?: boolean }) {
  if (candidats.length === 0) return null;
  const Titre = principale ? "h2" : "h3";
  return (
    <div className="align-row">
      <Titre id={id} className={principale ? "align-h" : "align-h align-h--s"}>
        {titre}
      </Titre>
      <ul className="who" aria-labelledby={id}>
        {candidats.map((c) => (
          <li key={c.id}>
            {/* Le nom mènera à la fiche du candidat (ticket 122) : pas encore de lien. */}
            <a>
              <Pion candidat={c} />
              {c.nom}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ statut }: { statut: Position["statut"] }) {
  return statut === "officielle" ? (
    <span className="badge badge--off">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8.5l3.2 3.2L13 4.8" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
      </svg>{" "}
      position officielle
    </span>
  ) : (
    <span className="badge badge--ded">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 9c2-4 4-4 6 0s4 4 6 0" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" }} />
      </svg>{" "}
      position déduite
    </span>
  );
}

const nombreDeCandidats = (n: number) => `${n} candidat${n > 1 ? "s" : ""}`;

export function Revelation({ questions, candidats, themes }: { questions: Question[]; candidats: Candidat[]; themes: Theme[] }) {
  const brut = useCoteClient(lireReponseEnCours);
  const reponse = brut ? (JSON.parse(brut) as ReponseEnCours) : null;

  const question = reponse && questions.find((q) => q.numero === reponse.numero);
  const theme = question && themes.find((t) => t.id === question.theme);
  if (!reponse || !question || !theme) return null;

  const rangChoisi = question.options.findIndex((o) => o.id === reponse.option);
  const choisie = question.options[rangChoisi];
  const importance = reponse.importance;
  const alignes = melanger(
    candidats.filter((c) => question.positions[c.id]?.option === reponse.option),
    reponse.graine - 1,
  );
  const voisins = choisie ? [rangChoisi - 1, rangChoisi + 1].filter((r) => r >= 0 && r < question.options.length) : [];
  const rangDe = (c: Candidat) => question.options.findIndex((o) => o.id === question.positions[c.id]?.option);
  const proches = melanger(
    candidats.filter((c) => voisins.includes(rangDe(c))),
    reponse.graine - 2,
  );
  const inconnus = melanger(
    candidats.filter((c) => !question.positions[c.id]),
    reponse.graine + question.options.length,
  );

  return (
    <>
      <div className="strip">
        <NumeroQuestion numero={question.numero} date={question.date} avecJour={false} />
      </div>
      <main className={`res rev ${theme.classe}`}>
        <header className="rev-hero">
          <h1>La révélation</h1>
        </header>
        {choisie && (
          <section
            className="mine-card"
            aria-label={`Ta réponse : ${lettreOption(rangChoisi)} · ${choisie.libelle}${importance ? `. Importance ×${importance}` : ""}`}
          >
            <p className="mine-k" aria-hidden="true">Ta réponse</p>
            <div className="mine-main" aria-hidden="true">
              <span className="mine-letter">{lettreOption(rangChoisi)}</span>
              <span className="mine-title">{choisie.libelle}</span>
            </div>
            {importance && (
              <p className="mine-imp" aria-hidden="true">
                <span className="chips">
                  {[1, 2, 3].map((n) => (
                    <i key={n} className={n > importance ? "off" : undefined}></i>
                  ))}
                </span>
                Importance ×{importance}
              </p>
            )}
          </section>
        )}
        {choisie && (
          <section className="align" aria-label="Alignement sur ce sujet">
            <LigneAlignement id="alignes" titre="Sur ce sujet, tu es aligné·e avec" candidats={alignes} principale />
            <LigneAlignement id="proches" titre="et proche de" candidats={proches} />
            <p className="align-note">
              Aligné·e&nbsp;: même carte que toi ({lettreOption(rangChoisi)}). Proche&nbsp;:{" "}
              {voisins.length > 1 ? "cartes voisines" : "carte voisine"} ({voisins.map(lettreOption).join(" et ")}).
            </p>
          </section>
        )}
        <section className="rev-list" aria-labelledby="qui-defend-quoi">
          <div className="sec-h">
            <h2 id="qui-defend-quoi">Qui défend quoi</h2>
            <p>ordre mélangé</p>
          </div>
          <div className="ropts">
            {question.options.map((option, rang) => {
              const leurs = melanger(
                candidats.filter((c) => question.positions[c.id]?.option === option.id),
                reponse.graine + rang,
              );
              const sienne = option.id === reponse.option;
              return (
                <article key={option.id} className={sienne ? "ropt mine" : "ropt"} aria-labelledby={`o-${option.id}`}>
                  <header className="ropt-head">
                    <span className="ropt-letter" aria-hidden="true">{lettreOption(rang)}</span>
                    <h3 className="ropt-title" id={`o-${option.id}`}>
                      <span className="sr">Option {lettreOption(rang)} : </span>
                      {option.libelle}
                    </h3>
                    <p className="ropt-meta">
                      <span>{nombreDeCandidats(leurs.length)}</span>
                      {sienne && <span className="ropt-tag">Ta carte</span>}
                    </p>
                  </header>
                  <ul className="defs">
                    {leurs.map((c) => (
                      <li key={c.id} className="def">
                        <Pion candidat={c} />
                        <span className="def-name one">{c.nom}</span>
                        <span className="def-src">
                          <span className="def-doc one">{question.positions[c.id].source}</span>
                          <Badge statut={question.positions[c.id].statut} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
            {inconnus.length > 0 && (
              <article className="ropt unknown" aria-labelledby="o-inconnue">
                <header className="ropt-head">
                  <span className="ropt-letter" aria-hidden="true">?</span>
                  <h3 className="ropt-title" id="o-inconnue">Position inconnue</h3>
                  <p className="ropt-meta">
                    <span>
                      {nombreDeCandidats(inconnus.length)} · {inconnus.length > 1 ? "exclus" : "exclu"} du calcul sur ce sujet
                    </span>
                  </p>
                </header>
                <ul className="defs">
                  {inconnus.map((c) => (
                    <li key={c.id} className="def">
                      <Pion candidat={c} clair />
                      <span className="def-name one">{c.nom}</span>
                      <span className="def-src">
                        <span className="def-doc one">Pas de source à ce jour</span>
                        <span className="badge badge--none">position inconnue</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
