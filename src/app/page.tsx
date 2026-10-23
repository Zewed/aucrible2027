import { Suspense } from "react";
import { QuestionDuJour } from "@/components/QuestionDuJour";
import { lireThemes } from "@/lib/contenu";
import { lireProchaineParution, lireQuestionsPubliees } from "@/lib/publication";
import "./silence.css";

async function FicheDuJour() {
  return (
    <QuestionDuJour
      questions={await lireQuestionsPubliees()}
      prochaineParution={await lireProchaineParution()}
      themes={lireThemes()}
    />
  );
}

export default function Accueil() {
  return (
    <Suspense>
      <FicheDuJour />
    </Suspense>
  );
}
