import type { Metadata } from "next";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { VisuelsDuJour } from "@/components/VisuelsDuJour";
import { lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import { DUREE, IMAGES } from "@/video/images";
import "../visuels.css";
import "./video.css";

// Un outil de l'auteur, comme le carrousel : la page n'a pas à être trouvée par les moteurs de recherche.
export const metadata: Metadata = { title: "Vidéo du jour — Au crible 2027", robots: { index: false } };

/**
 * « Vidéo du jour » (maquettes/video.html) : le storyboard de la vidéo verticale de la fiche du jour, les 7 images
 * telles que la vidéo les montre, chacune avec sa place dans les 75 secondes. La vidéo elle-même se rend sur l'ordinateur
 * de l'auteur, avec `pnpm video` (scripts/video.mts), depuis la même fiche et les mêmes images.
 */
async function VideoDuJour() {
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const question = publiees.find((q) => q.date === jour);
  const theme = question && lireThemes().find((t) => t.id === question.theme);
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className={theme ? `social page-vid ${theme.classe}` : "social page-vid"}>
        <header className="sheet-head">
          <h1>
            Vidéo
            <br />
            du jour<span>.</span>
          </h1>
          <p className="lead">
            {question ? (
              <>
                Le storyboard de la <b>vidéo</b> de la question n° {question.numero} : {IMAGES.length} images pour {DUREE} secondes.
              </>
            ) : (
              "Pas de question aujourd'hui : pas de vidéo."
            )}
          </p>
          <ul className="specs" aria-label="Légende">
            <li>Sans voix, lisible sans le son</li>
            <li>1080×1920</li>
            <li>
              <b>{DUREE} s</b>
            </li>
          </ul>
          <VisuelsDuJour page="video" />
        </header>
        {question && theme && (
          <section className="sheet sec" aria-labelledby="h-sb">
            <div className="sec-h">
              <h2 id="h-sb">Le storyboard</h2>
              <p>{IMAGES.length} images · 9:16</p>
            </div>
            <div className="planche">
              {IMAGES.map(({ debut, fin, Dessin, legende, ecran }, i) => (
                <figure key={debut} className="fr">
                  <Dessin question={question} theme={theme} />
                  <figcaption>
                    <span className="no">
                      Image {i + 1} sur {IMAGES.length}
                    </span>
                    <span className="cap">
                      <b>
                        {debut}–{fin} s
                      </b>{" "}
                      : {legende}
                    </span>
                    <span className="sub">{ecran}</span>
                    <span className="tl" style={{ "--a": debut, "--b": fin } as React.CSSProperties} aria-hidden="true">
                      <i></i>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default function PageVideo() {
  return (
    <Suspense>
      <VideoDuJour />
    </Suspense>
  );
}
