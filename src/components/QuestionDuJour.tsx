"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { NumeroQuestion } from "@/components/NumeroQuestion";
import { PuceTheme } from "@/components/PuceTheme";
import { Silence } from "@/components/Silence";
import type { Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { tirerGraine } from "@/lib/melange";
import { silenceEnCours } from "@/lib/silence";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis, dateLisible } from "@/lib/date";
import { enregistrerReponse, JE_NE_SAIS_PAS, lesReponses, lireReponses } from "@/lib/reponses";

const IMPORTANCES = [
  { poids: 1, libelle: "Un peu" },
  { poids: 2, libelle: "Beaucoup" },
  { poids: 3, libelle: "Essentiel" },
];

/** Ce que montre l'accueil quand il n'y a pas de question à poser : une carte, un message. */
function Annonce({ message }: { message: string }) {
  return (
    <main className="today">
      <div className="left">
        <div className="deck">
          <article className="qcard" aria-labelledby="annonce">
            <div className="qcard-body">
              <h1 id="annonce">{message}</h1>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

export function QuestionDuJour({
  questions,
  prochaineParution,
  themes,
}: {
  questions: Question[];
  prochaineParution: string | null;
  themes: Theme[];
}) {
  const router = useRouter();
  const [choix, setChoix] = useState<string | null>(null);
  const [poids, setPoids] = useState<number | null>(null);
  const jour = useCoteClient(() => aujourdhuiAParis());
  const question = questions.find((q) => q.date === jour) ?? null;
  const theme = question && themes.find((t) => t.id === question.theme);
  const reponses = lesReponses(useCoteClient(lireReponses));
  const dejaRepondue = question !== null && question.numero in reponses;

  // Une question déjà répondue sur cet appareil rouvre sur sa révélation.
  useEffect(() => {
    if (dejaRepondue) router.replace("/revelation");
  }, [dejaRepondue, router]);

  if (!jour || dejaRepondue) return null;

  const bandeau = (
    <div className="strip">
      <CompteARebours jour={jour} />
      {question && <NumeroQuestion numero={question.numero} date={question.date} avecJour />}
    </div>
  );
  const silence = silenceEnCours(jour);
  if (silence) {
    return (
      <>
        {bandeau}
        <Silence jour={jour} silence={silence} />
      </>
    );
  }
  if (questions.length === 0 && prochaineParution) {
    // Texte provisoire : le message exact reste à trancher (ticket 040).
    return (
      <>
        {bandeau}
        <Annonce message={`La première question arrive le ${dateLisible(prochaineParution, true)}.`} />
      </>
    );
  }
  if (!question && !prochaineParution) {
    // Texte provisoire : le message exact, et ce que l'accueil propose à la place, restent à trancher (ticket 041).
    return (
      <>
        {bandeau}
        <Annonce message="Il n'y a plus de nouvelle question." />
      </>
    );
  }
  if (!question || !theme) return bandeau;

  function valider(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!question || !choix) return;
    enregistrerReponse(question.numero, { option: choix, importance: poids, graine: tirerGraine(), jour: question.date, duJour: true });
    router.push("/revelation");
  }

  return (
    <>
    {bandeau}
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
                <span className="opt-letter" id={`lettre-${option.id}`}>{lettreOption(rang)}</span>
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
          <label className="opt idk">
            <input
              type="radio"
              name="choix"
              value={JE_NE_SAIS_PAS}
              checked={choix === JE_NE_SAIS_PAS}
              onChange={() => setChoix(JE_NE_SAIS_PAS)}
              aria-labelledby="titre-nsp"
              aria-describedby="implique-nsp"
            />
            <span className="opt-face">
              <span className="opt-letter" aria-hidden="true">?</span>
              <span className="opt-title" id="titre-nsp">Je ne sais pas</span>
              <span className="opt-impl" id="implique-nsp">Tu passes, ta série continue.</span>
            </span>
          </label>
        </div>
        <fieldset className="imp">
          <legend>Ce sujet compte pour toi&nbsp;?</legend>
          <div className="imp-row">
            {IMPORTANCES.map((importance) => (
              <label key={importance.poids}>
                <input
                  type="radio"
                  name="poids"
                  value={importance.poids}
                  checked={poids === importance.poids}
                  onChange={() => setPoids(importance.poids)}
                />
                <span className="imp-face">
                  <span className="chips">
                    {Array.from({ length: importance.poids }, (_, i) => (
                      <i key={i}></i>
                    ))}
                  </span>
                  <b>×{importance.poids}</b> <span>{importance.libelle}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="go" aria-disabled={!choix}>Valider ma réponse</button>
        <p className="go-note">Tes réponses restent sur ton téléphone, sans compte.</p>
      </form>
    </main>
    </>
  );
}
