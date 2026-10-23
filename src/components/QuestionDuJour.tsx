"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Question } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { enregistrerReponseEnCours } from "@/lib/reponses";

export function QuestionDuJour({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [choix, setChoix] = useState<string | null>(null);
  const jour = useCoteClient(() => aujourdhuiAParis());
  const question = questions.find((q) => q.date === jour) ?? null;

  if (!question) return null;

  function valider(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!question || !choix) return;
    enregistrerReponseEnCours({ numero: question.numero, option: choix });
    router.push("/revelation");
  }

  return (
    <form onSubmit={valider}>
      <h1>{question.question}</h1>
      <fieldset>
        <legend>Choisis ta carte</legend>
        {question.options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={choix === option.id}
              onChange={() => setChoix(option.id)}
            />
            {option.libelle}
          </label>
        ))}
      </fieldset>
      <button type="submit">Valider ma réponse</button>
    </form>
  );
}
