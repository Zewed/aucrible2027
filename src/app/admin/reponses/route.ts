import { estLAuteur } from "@/lib/auteur";
import { lireQuestionsPubliees } from "@/lib/publication";
import { JE_NE_SAIS_PAS } from "@/lib/reponses";
import { lireToutesLesReponses } from "@/lib/reponses-partagees";

/** Un champ du CSV, entre guillemets quand il le faut. */
const champ = (valeur: string | number | null) => {
  const texte = valeur === null ? "" : String(valeur);
  return /[";\n]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
};

/**
 * L'export des réponses partagées, pour l'auteur seul : une ligne par réponse, rangées par session, avec le libellé de
 * l'option pour se lire sans les fiches. Des points-virgules et un BOM, pour qu'Excel en français l'ouvre tel quel.
 */
export async function GET() {
  if (!(await estLAuteur())) return new Response(null, { status: 403 });
  const [reponses, questions] = await Promise.all([lireToutesLesReponses(), lireQuestionsPubliees()]);
  const libelles = new Map(questions.flatMap((q) => q.options.map((o) => [`${q.numero}:${o.id}`, o.libelle])));
  const lignes = [
    ["session", "question", "option", "libelle", "importance", "jour"],
    ...reponses.map((r) => [
      r.session,
      r.question,
      r.option,
      r.option === JE_NE_SAIS_PAS ? "Je ne sais pas" : (libelles.get(`${r.question}:${r.option}`) ?? null),
      r.importance,
      r.jour,
    ]),
  ];
  const csv = "﻿" + lignes.map((ligne) => ligne.map(champ).join(";")).join("\n") + "\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reponses-anonymes.csv"',
      "Cache-Control": "no-store",
    },
  });
}
