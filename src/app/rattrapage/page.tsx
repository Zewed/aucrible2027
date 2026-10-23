import Link from "next/link";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { PuceTheme } from "@/components/PuceTheme";
import { lireThemes } from "@/lib/contenu";
import { dateLisible } from "@/lib/date";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "./rattrapage.css";

/** Toutes les questions déjà publiées, une carte chacune qui ouvre sa fiche, les plus récentes d'abord. */
async function Rattrapage() {
  const [jour, questions] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const themes = lireThemes();
  const publiees = [...questions].sort((a, b) => b.numero - a.numero);

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
              {publiees.length} {publiees.length > 1 ? "publiées" : "publiée"}
            </p>
          </div>
          <ul className="qlist">
            {publiees.map((question, i) => {
              const theme = themes.find((t) => t.id === question.theme);
              return (
                <li key={question.numero} className={`qitem ${theme?.classe ?? ""}`} style={{ "--i": i } as React.CSSProperties}>
                  <Link className="qr" href={`/question/${question.numero}`}>
                    <div className="qr-top">
                      <div className="qr-meta">
                        {theme && <PuceTheme theme={theme} />}
                        <span className="qr-no">n°&nbsp;{question.numero}</span>
                      </div>
                      <h3 className="qr-q">{question.question}</h3>
                    </div>
                    <div className="qr-foot">
                      <span className="power">
                        <span className="power-t">
                          <small>{dateLisible(question.date, false)}</small>
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
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
