"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <main className="today">
      <div className="left">
        <div className="deck">
          <article className="qcard" aria-labelledby="q">
            <div className="qcard-top">
              <PuceTheme theme={theme} />
              <h1 id="q">{question.question}</h1>
            </div>
          </article>
        </div>
      </div>
      <form className="answer" onSubmit={valider}>
        <div className="answer-head">
          <h2>Choisis ta carte</h2>
        </div>
        <div className="opts" role="radiogroup" aria-label="Les options">
          {question.options.map((option) => (
            <label key={option.id} className="opt">
              <input
                type="radio"
                name="choix"
                value={option.id}
                checked={choix === option.id}
                onChange={() => setChoix(option.id)}
              />
              <span className="opt-face">
                <span className="opt-title">{option.libelle}</span>
              </span>
            </label>
          ))}
        </div>
        <button type="submit" className="go">Valider ma réponse</button>
      </form>
    </main>
  );
}
