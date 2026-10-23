"use client";

import type { Candidat, Question } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { lireReponseEnCours, type ReponseEnCours } from "@/lib/reponses";

export function Revelation({ questions, candidats }: { questions: Question[]; candidats: Candidat[] }) {
  const brut = useCoteClient(lireReponseEnCours);
  const reponse = brut ? (JSON.parse(brut) as ReponseEnCours) : null;

  const question = reponse && questions.find((q) => q.numero === reponse.numero);
  if (!reponse || !question) return null;

  const defenseurs = candidats.filter((c) => question.positions[c.id] === reponse.option);

  return (
    <section>
      <h1>La révélation</h1>
      <h2 id="defenseurs">Ils défendent ton option</h2>
      <ul aria-labelledby="defenseurs">
        {defenseurs.map((c) => (
          <li key={c.id}>{c.nom}</li>
        ))}
      </ul>
    </section>
  );
}
