import { Suspense } from "react";
import { ProchaineQuestion } from "@/components/ProchaineQuestion";
import { lireThemes } from "@/lib/contenu";
import { lireProchaineParution, lireQuestionsPubliees } from "@/lib/publication";

/** `?theme=`, choisi dans la jauge des questions : l'accueil enchaîne alors les questions de ce thème. */
async function Accueil({ theme }: { theme: Promise<string | null> }) {
  return (
    <ProchaineQuestion
      questions={await lireQuestionsPubliees()}
      prochaineParution={await lireProchaineParution()}
      themes={lireThemes()}
      filtre={await theme}
    />
  );
}

export default function PageAccueil({ searchParams }: PageProps<"/">) {
  return (
    <Suspense>
      <Accueil theme={searchParams.then(({ theme }) => (typeof theme === "string" ? theme : null))} />
    </Suspense>
  );
}
