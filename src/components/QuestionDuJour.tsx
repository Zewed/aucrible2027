"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumeroQuestion } from "@/components/NumeroQuestion";
import { PuceTheme } from "@/components/PuceTheme";
import type { Question, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { enregistrerReponseEnCours } from "@/lib/reponses";

export function QuestionDuJour({ questions, themes }: { questions: Question[]; themes: Theme[] }) {
  const router = useRouter();
  const [choix, setChoix] = useState<string | null>(null);
  const jour = useCoteClient(() => aujourdhuiAParis());
  const question = questions.find((q) => q.date === jour) ?? null;
  const theme = question && themes.find((t) => t.id === question.theme);

  if (!question || !theme) return null;

  function valider(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!question || !choix) return;
    enregistrerReponseEnCours({ numero: question.numero, option: choix });
    router.push("/revelation");
  }

  return (
    <>
    <div className="strip">
      <NumeroQuestion numero={question.numero} date={question.date} avecJour />
    </div>
    <main className={`today ${theme.classe}`}>
      <div className="left">
        <div className="deck">
          <article className="qcard" aria-labelledby="q">
            <div className="qcard-top">
              <PuceTheme theme={theme} />
              <h1 id="q">{question.question}</h1>
            </div>
            <div className="qcard-body">
              <section aria-labelledby="contexte">
                <h2 id="contexte" className="label"><i></i>Le contexte</h2>
                <div className="context">
                  {question.contexte.map((phrase) => (
                    <p key={phrase}>{phrase}</p>
                  ))}
                </div>
              </section>
              <section aria-labelledby="chiffres">
                <h2 id="chiffres" className="label" style={{ marginTop: 22 }}><i></i>{question.chiffres.length} chiffres clés</h2>
                <ul className="figures">
                  {question.chiffres.map((chiffre) => (
                    <li key={chiffre.legende} className="fig">
                      <span className="fig-num">
                        {chiffre.valeur}
                        {chiffre.unite && <> <small>{chiffre.unite}</small></>}
                      </span>
                      <span className="fig-txt">{chiffre.legende}</span>
                      <span className="fig-src">
                        Source : <b>{chiffre.source.organisme}, {chiffre.source.document && `${chiffre.source.document} `}{chiffre.source.annee}</b>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        </div>
      </div>
      <form className="answer" onSubmit={valider}>
        <div className="answer-head">
          <h2>Choisis ta carte</h2>
          <p>Les noms des candidats s&apos;affichent après ta réponse.</p>
        </div>
        <div className="opts" role="radiogroup" aria-label="Les options">
          {question.options.map((option, rang) => (
            <label key={option.id} className="opt">
              <input
                type="radio"
                name="choix"
                value={option.id}
                checked={choix === option.id}
                onChange={() => setChoix(option.id)}
                aria-labelledby={`lettre-${option.id} titre-${option.id}`}
                aria-describedby={`implique-${option.id} defenseurs-${option.id} critiques-${option.id}`}
              />
              <span className="opt-face">
                <span className="opt-letter" id={`lettre-${option.id}`}>{String.fromCharCode(65 + rang)}</span>
                <span className="opt-title" id={`titre-${option.id}`}>{option.libelle}</span>
                <span className="opt-impl" id={`implique-${option.id}`}>{option.implique}</span>
                <span className="opt-args">
                  <span className="arg" id={`defenseurs-${option.id}`}>
                    <b>Ce qu&apos;en disent ses défenseurs</b>
                    {option.defenseurs}
                  </span>
                  <span className="arg" id={`critiques-${option.id}`}>
                    <b>Ce que lui reprochent ses critiques</b>
                    {option.critiques}
                  </span>
                </span>
              </span>
              <span className="picked">Ta carte</span>
            </label>
          ))}
        </div>
        <button type="submit" className="go" aria-disabled={!choix}>Valider ma réponse</button>
      </form>
    </main>
    </>
  );
}
