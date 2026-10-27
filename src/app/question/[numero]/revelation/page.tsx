import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Revelation } from "@/components/Revelation";
import { lireThemes } from "@/lib/contenu";
import { lireLesCandidats, lireQuestionsPubliees } from "@/lib/publication";
import "@/app/revelation/revelation.css";

/** La révélation d'une question déjà publiée ; avec `?theme=`, « Question suivante » reste dans ce thème. */
async function RevelationPubliee({ numero, theme }: { numero: string; theme: string | null }) {
  const questions = await lireQuestionsPubliees();
  const question = questions.find((q) => String(q.numero) === numero);
  if (!question) notFound();
  return <Revelation questions={questions} candidats={await lireLesCandidats()} themes={lireThemes()} numero={question.numero} filtre={theme} />;
}

export default function PageRevelationPubliee({ params, searchParams }: PageProps<"/question/[numero]/revelation">) {
  return (
    <Suspense>
      {Promise.all([params, searchParams]).then(([{ numero }, { theme }]) => (
        <RevelationPubliee numero={numero} theme={typeof theme === "string" ? theme : null} />
      ))}
    </Suspense>
  );
}
