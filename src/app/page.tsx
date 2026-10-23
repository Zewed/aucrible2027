import { QuestionDuJour } from "@/components/QuestionDuJour";
import { lireQuestions, lireThemes } from "@/lib/contenu";

export default function Accueil() {
  return <QuestionDuJour questions={lireQuestions()} themes={lireThemes()} />;
}
