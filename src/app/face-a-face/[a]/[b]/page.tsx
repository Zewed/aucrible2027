import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { QuestionsDuFaceAFace, ResumeDuFaceAFace, type Joueur, type PositionComparee, type QuestionComparee } from "@/components/FaceAFace";
import { lireThemes, type Candidat, type Question } from "@/lib/contenu";
import { lireAujourdhui, lireLesCandidats, lireQuestionsPubliees } from "@/lib/publication";
import "@/app/face-a-face.css";

/** Le candidat du duel : son pion, son prénom en petit et son nom en grand (maquettes/face-a-face.html). */
function Pioche({ candidat }: { candidat: Candidat }) {
  const [prenom, ...nom] = candidat.nom.split(" ");
  return (
    <div className="pick">
      <span className="pawn pawn--paper">{candidat.initiales}</span>
      <p className="pick-name">
        <small>{prenom}</small>
        <b>{nom.join(" ")}</b>
      </p>
    </div>
  );
}

/** L'option d'un candidat sur une question, ou rien si sa position n'est pas connue. */
function positionDe(question: Question, candidat: Candidat): PositionComparee {
  const position = question.positions[candidat.id];
  const option = question.options.find((o) => o.id === position?.option);
  return option
    ? { lettre: option.id, titre: option.libelle, implique: option.implique, source: position.source, officielle: position.statut === "officielle" }
    : null;
}

/**
 * Le face-à-face de deux candidats, nommés par l'adresse (`/face-a-face/<a>/<b>`) : il s'ouvre depuis la fiche d'un
 * candidat, sans duo par défaut (décision de l'auteur, 24 octobre 2026). « Changer », l'inversion, les sources, les
 * accords, le filtre et le partage viennent avec les tickets 100 à 112.
 */
async function FaceAFace({ a, b }: { a: string; b: string }) {
  const candidats = await lireLesCandidats();
  const gauche = candidats.find((c) => c.id === a);
  const droite = candidats.find((c) => c.id === b);
  if (!gauche || !droite) notFound();
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const themes = lireThemes();
  const questions: QuestionComparee[] = [...publiees]
    .sort((x, y) => y.date.localeCompare(x.date))
    .map((q) => {
      const theme = themes.find((t) => t.id === q.theme)!;
      return {
        numero: q.numero,
        question: q.question,
        theme: { nom: theme.nom, classe: theme.classe },
        positions: [positionDe(q, gauche), positionDe(q, droite)],
      };
    });
  const joueurs: [Joueur, Joueur] = [gauche, droite].map((c) => ({ nom: c.nom, initiales: c.initiales })) as [Joueur, Joueur];
  return (
    <>
      <BandeauRetour jour={jour} vers="/resultats" libelle="Mes résultats" />
      <main className="res ff">
        <section className="res-hero" aria-labelledby="h1">
          <h1 id="h1">
            Face-à-face<span>.</span>
          </h1>
          <p className="lead">
            Deux candidats, les mêmes questions, <b>côte à côte</b>. Chaque position garde sa source et sa date.
          </p>
        </section>
        <section className="duel" aria-label="Les deux candidats comparés">
          <div className="duel-grid">
            <Pioche candidat={gauche} />
            {/* La place du disque central, qui inversera les deux candidats (ticket 106). */}
            <span className="ff-centre" aria-hidden="true"></span>
            <Pioche candidat={droite} />
          </div>
        </section>
        {/* « Moi contre un candidat », à côté du résumé dans la maquette : ticket 120. */}
        <div className="ff-mid">
          <ResumeDuFaceAFace questions={questions} joueurs={joueurs} />
        </div>
        <section aria-labelledby="h-list">
          <h2 className="sr" id="h-list">
            Les questions, une par une
          </h2>
          <QuestionsDuFaceAFace questions={questions} joueurs={joueurs} />
        </section>
      </main>
    </>
  );
}

export default function PageFaceAFace({ params }: PageProps<"/face-a-face/[a]/[b]">) {
  return <Suspense>{params.then(({ a, b }) => <FaceAFace a={a} b={b} />)}</Suspense>;
}
