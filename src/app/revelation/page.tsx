import { Suspense } from "react";
import { Revelation } from "@/components/Revelation";
import { lireCandidats, lireThemes } from "@/lib/contenu";
import { lireQuestionsPubliees } from "@/lib/publication";
import "./revelation.css";

async function RevelationDuJour() {
  return <Revelation questions={await lireQuestionsPubliees()} candidats={lireCandidats()} themes={lireThemes()} />;
}

export default function PageRevelation() {
  return (
    <Suspense>
      <RevelationDuJour />
    </Suspense>
  );
}
