import { Suspense } from "react";
import { Accueil } from "@/components/Accueil";
import { lireThemes } from "@/lib/contenu";
import { lireProchaineParution, lireQuestionsPubliees } from "@/lib/publication";
import "./accueil.css";

async function Contenu() {
  const questions = await lireQuestionsPubliees();
  return (
    <Accueil
      questions={questions.map(({ numero, theme, question }) => ({ numero, theme, question }))}
      prochaineParution={await lireProchaineParution()}
      themes={lireThemes()}
    />
  );
}

export default function PageAccueil() {
  return (
    <Suspense>
      <Contenu />
    </Suspense>
  );
}
