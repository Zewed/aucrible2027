import { Suspense } from "react";
import { Revelation } from "@/components/Revelation";
import { lireThemes } from "@/lib/contenu";
import { lireLesCandidats, lireQuestionsPubliees } from "@/lib/publication";
import "./revelation.css";

async function RevelationDuJour() {
  return <Revelation questions={await lireQuestionsPubliees()} candidats={await lireLesCandidats()} themes={lireThemes()} />;
}

export default function PageRevelation() {
  return (
    <Suspense>
      <RevelationDuJour />
    </Suspense>
  );
}
