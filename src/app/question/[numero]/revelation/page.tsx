import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Revelation } from "@/components/Revelation";
import { lireCandidats, lireThemes } from "@/lib/contenu";
import { lireQuestionsPubliees } from "@/lib/publication";
import "@/app/revelation/revelation.css";

/** La révélation d'une question déjà publiée, répondue depuis le rattrapage. */
async function RevelationPubliee({ numero }: { numero: string }) {
  const questions = await lireQuestionsPubliees();
  const question = questions.find((q) => String(q.numero) === numero);
  if (!question) notFound();
  return <Revelation questions={questions} candidats={lireCandidats()} themes={lireThemes()} numero={question.numero} />;
}

export default function PageRevelationPubliee({ params }: PageProps<"/question/[numero]/revelation">) {
  return <Suspense>{params.then(({ numero }) => <RevelationPubliee numero={numero} />)}</Suspense>;
}
