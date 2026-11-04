import { Suspense } from "react";
import { PageEnAttente } from "@/components/PageEnAttente";
import { ProchaineQuestion } from "@/components/ProchaineQuestion";
import { lireThemes } from "@/lib/contenu";
import { lireProchaineParution, lireQuestionsDeLaFiche } from "@/lib/publication";

/** `?theme=`, choisi dans la jauge des questions : le questionnaire enchaîne alors les questions de ce thème. */
async function Questionnaire({ theme }: { theme: Promise<string | null> }) {
  return (
    <ProchaineQuestion
      questions={await lireQuestionsDeLaFiche()}
      prochaineParution={await lireProchaineParution()}
      themes={lireThemes()}
      filtre={await theme}
    />
  );
}

export default function PageQuestionnaire({ searchParams }: PageProps<"/questionnaire">) {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Questionnaire theme={searchParams.then(({ theme }) => (typeof theme === "string" ? theme : null))} />
    </Suspense>
  );
}
