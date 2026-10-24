import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { FiltreDuFaceAFace, QuestionsDuFaceAFace, ResumeDuFaceAFace, type Joueur, type PositionComparee, type QuestionComparee } from "@/components/FaceAFace";
import { Pioche } from "@/components/Pioche";
import { lireThemes, type Candidat, type Question } from "@/lib/contenu";
import { melanger } from "@/lib/melange";
import { lireAujourdhui, lireLesCandidats, lireQuestionsPubliees } from "@/lib/publication";
import "@/app/face-a-face.css";

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
 * candidat, sans duo par défaut (décision de l'auteur, 24 octobre 2026), et cette adresse se partage telle quelle ; le
 * disque central mène au duo inversé.
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
  // Les autres candidats, dans un ordre mélangé par le jour : le même pour tous dans la journée, sans rapport avec les
  // intentions de vote ni l'ordre alphabétique.
  const autres = melanger(
    candidats.filter((c) => c.id !== gauche.id && c.id !== droite.id),
    Number(jour.replaceAll("-", "")),
  );
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
        {/* « changer » propose les onze autres : ni l'un, ni l'autre des deux candidats. */}
        <section className="duel" aria-label="Les deux candidats comparés">
          <div className="duel-grid">
            <Pioche candidat={gauche} autres={autres} adresse={(c) => `/face-a-face/${c.id}/${droite.id}`} />
            <Link className="mid swap" href={`/face-a-face/${droite.id}/${gauche.id}`} aria-label="Inverser l'ordre des deux candidats">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"
                  style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
                />
              </svg>
            </Link>
            <Pioche candidat={droite} autres={autres} adresse={(c) => `/face-a-face/${gauche.id}/${c.id}`} />
          </div>
          {/* L'adresse ne nomme que les deux candidats : la partager ne livre aucune réponse. */}
          <p className="ff-share">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            <span>Lien partageable : ce face-à-face s&apos;ouvre tout prêt</span>
          </p>
        </section>
        {/* « Moi contre un candidat », à côté du résumé dans la maquette : ticket 120. */}
        <div className="ff-mid">
          <ResumeDuFaceAFace questions={questions} joueurs={joueurs} />
        </div>
        <FiltreDuFaceAFace themes={themes.map(({ nom, classe }) => ({ nom, classe }))} questions={questions} />
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
