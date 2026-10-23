"use client";

import { NumeroQuestion } from "@/components/NumeroQuestion";
import type { Candidat, Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { useCoteClient } from "@/lib/cote-client";
import { lireReponseEnCours, type ReponseEnCours } from "@/lib/reponses";

const nombreDeCandidats = (n: number) => `${n} candidat${n > 1 ? "s" : ""}`;

export function Revelation({ questions, candidats, themes }: { questions: Question[]; candidats: Candidat[]; themes: Theme[] }) {
  const brut = useCoteClient(lireReponseEnCours);
  const reponse = brut ? (JSON.parse(brut) as ReponseEnCours) : null;

  const question = reponse && questions.find((q) => q.numero === reponse.numero);
  const theme = question && themes.find((t) => t.id === question.theme);
  if (!reponse || !question || !theme) return null;

  const defenseurs = candidats.filter((c) => question.positions[c.id] === reponse.option);
  const rangChoisi = question.options.findIndex((o) => o.id === reponse.option);
  const choisie = question.options[rangChoisi];

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
          <section className="mine-card" aria-label={`Ta réponse : ${lettreOption(rangChoisi)} · ${choisie.libelle}`}>
            <p className="mine-k" aria-hidden="true">Ta réponse</p>
            <div className="mine-main" aria-hidden="true">
              <span className="mine-letter">{lettreOption(rangChoisi)}</span>
              <span className="mine-title">{choisie.libelle}</span>
            </div>
          </section>
        )}
        <section className="align" aria-labelledby="defenseurs">
          <h2 id="defenseurs" className="align-h">Ils défendent ton option</h2>
          <ul className="who" aria-labelledby="defenseurs">
            {defenseurs.map((c) => (
              <li key={c.id}>{c.nom}</li>
            ))}
          </ul>
        </section>
        <section className="rev-list" aria-labelledby="qui-defend-quoi">
          <div className="sec-h">
            <h2 id="qui-defend-quoi">Qui défend quoi</h2>
          </div>
          <div className="ropts">
            {question.options.map((option, rang) => {
              const leurs = candidats.filter((c) => question.positions[c.id] === option.id);
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
                        <span className="def-name one">{c.nom}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
