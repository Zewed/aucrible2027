import { Suspense } from "react";
import { ProchaineQuestion } from "@/components/ProchaineQuestion";
import { lireThemes } from "@/lib/contenu";
import { lireProchaineParution, lireQuestionsPubliees } from "@/lib/publication";

async function Accueil() {
  return (
    <ProchaineQuestion
      questions={await lireQuestionsPubliees()}
      prochaineParution={await lireProchaineParution()}
      themes={lireThemes()}
    />
  );
}

export default function PageAccueil() {
  return (
    <Suspense>
      <Accueil />
    </Suspense>
  );
}
