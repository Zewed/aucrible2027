import Link from "next/link";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { ListeDeRattrapage } from "@/components/ListeDeRattrapage";
import { lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "./rattrapage.css";

/** Toutes les questions déjà publiées, une carte chacune qui ouvre sa fiche. */
async function Rattrapage() {
  const [jour, questions] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  // Les plus récentes d'abord, en attendant le tri par pouvoir de départage (« À trancher »).
  const cartes = [...questions]
    .sort((a, b) => b.numero - a.numero)
    .map(({ numero, date, theme, question }) => ({ numero, date, theme, question }));

  return (
    <>
      <div className="strip">
        <Link className="back" href="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19 12H6M11 6l-6 6 6 6"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
            />
          </svg>
          Question du jour
        </Link>
        <CompteARebours jour={jour} />
      </div>

      <main className="catch">
        <section className="catch-hero" aria-labelledby="titre">
          <div className="catch-text">
            <h1 id="titre">
              Rattraper les questions<span>.</span>
            </h1>
          </div>
        </section>

        <section className="grp" aria-labelledby="g-all">
          <div className="sec-h">
            <h2 id="g-all">Toutes les questions</h2>
            <p>
              {cartes.length} {cartes.length > 1 ? "publiées" : "publiée"}
            </p>
          </div>
          <ListeDeRattrapage cartes={cartes} themes={lireThemes()} />
        </section>
      </main>
    </>
  );
}

export default function PageRattrapage() {
  return (
    <Suspense>
      <Rattrapage />
    </Suspense>
  );
}
