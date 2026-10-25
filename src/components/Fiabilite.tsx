"use client";

import { useCoteClient } from "@/lib/cote-client";
import { reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Les niveaux de fiabilité du classement (décision de l'auteur, 25 octobre 2026) : faible dès 10, moyenne dès 20, forte dès 30. */
const NIVEAUX = [
  { des: 30, nom: "forte", crans: 3 },
  { des: 20, nom: "moyenne", crans: 2 },
  { des: SEUIL_DES_RESULTATS, nom: "faible", crans: 1 },
];

/** « Fiabilité : moyenne (23 réponses) », trois crans dont ceux du niveau allumés ; rien tant que le classement n'est pas là. */
export function Fiabilite({ questions }: { questions: QuestionDuCalcul[] }) {
  const comptees = reponsesComptees(questions, lesReponses(useCoteClient(lireReponses, abonnerAuxReponses)));
  const niveau = NIVEAUX.find((n) => comptees >= n.des);
  if (!niveau) return null;
  return (
    <p className="reliab">
      <span className="meter" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= niveau.crans ? "on" : undefined}></i>
        ))}
      </span>
      Fiabilité : {niveau.nom} ({comptees} {comptees > 1 ? "réponses" : "réponse"})
    </p>
  );
}
