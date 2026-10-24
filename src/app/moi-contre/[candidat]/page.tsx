import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { QuestionsMoiContre, type QuestionMoiContre } from "@/components/MoiContre";
import { lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireLesCandidats, lireQuestionsPubliees } from "@/lib/publication";
import "@/app/face-a-face.css";
import "./moi-vs.css";

/**
 * « Moi contre » un candidat, nommé par l'adresse (`/moi-contre/<candidat>`) : la page s'ouvre depuis la fiche du
 * candidat, sans candidat par défaut (décision de l'auteur, 24 octobre 2026). Les réponses restent dans le navigateur :
 * le serveur n'envoie que les fiches et les positions du candidat.
 */
async function MoiContre({ id }: { id: string }) {
  const candidat = (await lireLesCandidats()).find((c) => c.id === id);
  if (!candidat) notFound();
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
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
  const [prenom, ...nom] = candidat.nom.split(" ");
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
                <small>Ta partie</small>
                <b>Toi</b>
              </p>
            </div>
            <span className="mid mid--txt" aria-hidden="true">
              contre
            </span>
            {/* « changer » de candidat : ticket 116. */}
            <div className="pick">
              <span className="pawn pawn--paper">{candidat.initiales}</span>
              <p className="pick-name">
                <small>{prenom}</small>
                <b>{nom.join(" ")}</b>
              </p>
            </div>
          </div>
        </section>
        <section className="sec" aria-labelledby="h-list">
          <div className="sec-h">
            <h2 id="h-list">Question par question</h2>
          </div>
          <QuestionsMoiContre questions={questions} candidat={{ nom: candidat.nom, initiales: candidat.initiales }} />
        </section>
      </main>
    </>
  );
}

export default function PageMoiContre({ params }: PageProps<"/moi-contre/[candidat]">) {
  return <Suspense>{params.then(({ candidat }) => <MoiContre id={candidat} />)}</Suspense>;
}
