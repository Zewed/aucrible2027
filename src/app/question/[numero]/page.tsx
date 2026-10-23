import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Fiche } from "@/components/Fiche";
import { lireThemes } from "@/lib/contenu";
import { lireQuestionsPubliees } from "@/lib/publication";

/** La fiche d'une question déjà publiée, ouverte depuis le rattrapage. Une autre adresse n'existe pas. */
async function QuestionPubliee({ numero }: { numero: string }) {
  const question = (await lireQuestionsPubliees()).find((q) => String(q.numero) === numero);
  const theme = question && lireThemes().find((t) => t.id === question.theme);
  if (!question || !theme) notFound();
  return <Fiche question={question} theme={theme} revelation={`/question/${question.numero}/revelation`} />;
}

export default function PageQuestion({ params }: PageProps<"/question/[numero]">) {
  return <Suspense>{params.then(({ numero }) => <QuestionPubliee numero={numero} />)}</Suspense>;
}
