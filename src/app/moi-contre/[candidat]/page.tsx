import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { ChoixDuFaceAFace } from "@/components/ChoixDuFaceAFace";
import { QuestionsMoiContre, ScoreMoiContre, ThemesMoiContre, type QuestionMoiContre } from "@/components/MoiContre";
import { Pioche } from "@/components/Pioche";
import { lireThemes } from "@/lib/contenu";
import { melanger } from "@/lib/melange";
import { lireAujourdhui, lireLesCandidats, lireQuestionsDuCalcul, lireQuestionsPubliees } from "@/lib/publication";
import "@/app/face-a-face.css";
import "./moi-vs.css";

/**
 * « Moi contre » un candidat, nommé par l'adresse (`/moi-contre/<candidat>`) : la page s'ouvre depuis la fiche du
 * candidat, sans candidat par défaut (décision de l'auteur, 24 octobre 2026). Les réponses restent dans le navigateur :
 * le serveur n'envoie que les fiches et les positions du candidat.
 */
async function MoiContre({ id }: { id: string }) {
  const candidats = await lireLesCandidats();
  const candidat = candidats.find((c) => c.id === id);
  if (!candidat) notFound();
  const [jour, publiees, duCalcul] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees(), lireQuestionsDuCalcul()]);
  const themes = lireThemes();
  const questions: QuestionMoiContre[] = [...publiees]
    .sort((x, y) => y.date.localeCompare(x.date))
    .map((q) => {
      const theme = themes.find((t) => t.id === q.theme)!;
      const position = q.positions[candidat.id];
      const option = q.options.find((o) => o.id === position?.option);
      return {
        numero: q.numero,
        question: q.question,
        theme: { nom: theme.nom, classe: theme.classe },
        options: q.options.map((o) => ({ lettre: o.id, titre: o.libelle, implique: o.implique })),
        position: option
          ? { lettre: option.id, titre: option.libelle, implique: option.implique, source: position.source, officielle: position.statut === "officielle" }
          : null,
      };
    });
  // Les mêmes questions, réduites à ce que lit le calcul, dans l'ordre des cartes.
  const calcul = questions.map((q) => duCalcul.find((d) => d.numero === q.numero)!);
  // Les autres candidats, dans un ordre mélangé par le jour, comme le face-à-face.
  const autres = melanger(
    candidats.filter((c) => c.id !== candidat.id),
    Number(jour.replaceAll("-", "")),
  );
  return (
    <>
      <BandeauRetour jour={jour} vers="/resultats" libelle="Mes résultats" />
      <main className="res ff mv">
        <section className="res-hero" aria-labelledby="h1">
          <h1 className="mv-h1" id="h1">
            Moi contre un candidat<span>.</span>
          </h1>
          <p className="lead">
            Tes réponses face aux positions d&apos;un candidat, <b>question par question</b>.
          </p>
        </section>
        <section className="duel" aria-label="Toi et le candidat choisi">
          <div className="duel-grid">
            <div className="pick">
              <span className="pawn pawn--you">TOI</span>
              <p className="pick-name">
                <small>Tes réponses</small>
                <b>Toi</b>
              </p>
            </div>
            <span className="mid mid--txt" aria-hidden="true">
              contre
            </span>
            <Pioche candidat={candidat} autres={autres} adresse={(c) => `/moi-contre/${c.id}`} />
          </div>
        </section>
        <ScoreMoiContre questions={calcul} candidat={candidat} />
        <ThemesMoiContre questions={calcul} themes={themes} candidat={candidat} />
        <QuestionsMoiContre questions={questions} candidat={{ nom: candidat.nom, initiales: candidat.initiales }} />
        {/* Le face-à-face s'ouvre avec ce candidat, comme depuis sa fiche ; « Mes résultats », à côté dans la maquette,
            n'est porté par aucun ticket. */}
        <section className="ff-end" aria-label="Aller plus loin">
          <div className="actions">
            <ChoixDuFaceAFace candidat={candidat} autres={autres} classe="act primary">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="7" cy="9" r="4" style={{ fill: "currentColor" }} />
                <circle cx="17" cy="9" r="4" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.4 }} />
                <path d="M2 20c1-3 3-4 5-4s4 1 5 4M12 20c1-3 3-4 5-4s4 1 5 4" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" }} />
              </svg>
              Face-à-face entre deux candidats
            </ChoixDuFaceAFace>
          </div>
        </section>
      </main>
    </>
  );
}

export default function PageMoiContre({ params }: PageProps<"/moi-contre/[candidat]">) {
  return <Suspense>{params.then(({ candidat }) => <MoiContre id={candidat} />)}</Suspense>;
}
