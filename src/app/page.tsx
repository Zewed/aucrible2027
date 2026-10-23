import { QuestionDuJour } from "@/components/QuestionDuJour";
import { lireQuestions } from "@/lib/contenu";

export default function Accueil() {
  return (
    <main>
      <QuestionDuJour questions={lireQuestions()} />
    </main>
  );
}
