import { Suspense } from "react";
import { QuestionDuJour } from "@/components/QuestionDuJour";
import { lireThemes } from "@/lib/contenu";
import { lireQuestionsPubliees } from "@/lib/publication";

async function FicheDuJour() {
  return <QuestionDuJour questions={await lireQuestionsPubliees()} themes={lireThemes()} />;
}

export default function Accueil() {
  return (
    <Suspense>
      <FicheDuJour />
    </Suspense>
  );
}
