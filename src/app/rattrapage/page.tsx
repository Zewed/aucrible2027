import { Fragment, Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { AJour, ListeDeRattrapage, TuileARattraper } from "@/components/ListeDeRattrapage";
import { PartDuTheme } from "@/components/PuceTheme";
import { lireThemes, type Theme } from "@/lib/contenu";
import { lireAujourdhui, lireNumeroDeDemain, lireQuestionsPubliees } from "@/lib/publication";
import "./rattrapage.css";

/** Le nom court d'un thème dans les sélecteurs du filtre de la maquette : « eco » pour « theme-eco ». */
const court = (theme: Theme) => theme.classe.replace("theme-", "");

/**
 * Le filtre par thème de la maquette, sans script : la puce cochée masque, par sa feuille de style,
 * les cartes des autres thèmes et se rappelle dans « Filtrer par thème ».
 */
function FiltreParTheme({ themes }: { themes: Theme[] }) {
  return (
    <div className="fdet">
      <input className="fopen sr" type="checkbox" id="f-open" />
      <label className="fsum" htmlFor="f-open">
        <span className="fsum-k">Filtrer par thème</span>
        <span className="fsum-v one">
          <span className="cur cur-all">Tous les thèmes</span>
          {themes.map((theme) => (
            <span key={theme.id} className={`cur cur-${court(theme)}`}>
              {theme.nom}
            </span>
          ))}
        </span>
        <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
        </svg>
      </label>
      <div className="tchips" role="radiogroup" aria-label="Filtrer par thème">
        <input className="fr sr" type="radio" name="theme" id="f-all" defaultChecked />
        <label className="chip" htmlFor="f-all">
          Tous les thèmes
        </label>
        {themes.map((theme) => (
          <Fragment key={theme.id}>
            <input className="fr sr" type="radio" name="theme" id={`f-${court(theme)}`} />
            <label className={`chip ${theme.classe}`} htmlFor={`f-${court(theme)}`}>
              <PartDuTheme />
              {theme.nom}
            </label>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Toutes les questions déjà publiées, une carte chacune qui ouvre sa fiche. */
async function Rattrapage() {
  const [jour, questions, numeroDeDemain] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees(), lireNumeroDeDemain()]);
  const themes = lireThemes();
  // Les plus récentes d'abord, en attendant le tri par pouvoir de départage (« À trancher »).
  const cartes = [...questions]
    .sort((a, b) => b.numero - a.numero)
    .map(({ numero, date, theme, question }) => ({ numero, date, theme, question }));

  return (
    <>
      <BandeauRetour jour={jour} />

      <main className="catch">
        <section className="catch-hero" aria-labelledby="titre">
          <div className="catch-text">
            <h1 id="titre">
              Rattraper les questions<span>.</span>
            </h1>
          </div>
          <div className="tiles">
            <TuileARattraper cartes={cartes} />
          </div>
        </section>

        <FiltreParTheme themes={themes} />

        <section className="grp" aria-labelledby="g-all">
          <div className="sec-h">
            <h2 id="g-all">Toutes les questions</h2>
            <p>
              {cartes.length} {cartes.length > 1 ? "publiées" : "publiée"}
            </p>
          </div>
          <ListeDeRattrapage cartes={cartes} themes={themes} />
        </section>

        <AJour cartes={cartes} numeroDeDemain={numeroDeDemain} />
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
