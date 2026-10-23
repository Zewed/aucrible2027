import { Revelation } from "@/components/Revelation";
import { lireCandidats, lireQuestions } from "@/lib/contenu";

export default function PageRevelation() {
  return (
    <main>
      <Revelation questions={lireQuestions()} candidats={lireCandidats()} />
    </main>
  );
}
