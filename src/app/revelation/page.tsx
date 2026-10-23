import { Revelation } from "@/components/Revelation";
import { lireCandidats, lireQuestions, lireThemes } from "@/lib/contenu";
import "./revelation.css";

export default function PageRevelation() {
  return <Revelation questions={lireQuestions()} candidats={lireCandidats()} themes={lireThemes()} />;
}
