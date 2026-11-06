import { Suspense } from "react";
import { Accueil } from "@/components/Accueil";
import { PageEnAttente } from "@/components/PageEnAttente";
import { lireThemes } from "@/lib/contenu";
import { lireLaPresentation } from "@/lib/presentation";
import { lireProchaineParution, lireQuestionsPubliees } from "@/lib/publication";
import "./accueil.css";
import "./presentation/presentation.css";

async function Contenu() {
  const questions = await lireQuestionsPubliees();
  const [prochaineParution, presentation] = await Promise.all([lireProchaineParution(), lireLaPresentation(questions)]);
  return (
    <Accueil
      questions={questions.map(({ numero, theme, question }) => ({ numero, theme, question }))}
      prochaineParution={prochaineParution}
      themes={lireThemes()}
      presentation={presentation}
    />
  );
}

export default function PageAccueil() {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Contenu />
    </Suspense>
  );
}
