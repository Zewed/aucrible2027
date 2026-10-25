import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BandeauRetour } from "@/components/BandeauRetour";
import { PREMIER_TOUR } from "@/components/CompteARebours";
import { Logo } from "@/components/Logo";
import { PartDuTheme } from "@/components/PuceTheme";
import { VisuelsDuJour } from "@/components/VisuelsDuJour";
import { lireThemes, type Question, type Theme } from "@/lib/contenu";
import { joursEntre } from "@/lib/date";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "../visuels.css";
import "./carrousel.css";

// Un outil de l'auteur : la page n'a pas à être trouvée par les moteurs de recherche.
export const metadata: Metadata = { title: "Carrousel du jour — Au crible 2027", robots: { index: false } };

/** La signature du compte, écrite à l'identique sur chaque image (SPEC.md : « comptes @aucrible2027 partout »). */
const SIGNATURE = "@aucrible2027";

/** La flèche « Glisse », en bas des images 1 à 5. */
function Fleche() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
    </svg>
  );
}

/** Une image du carrousel, dessinée à 320 × 400 (4:5), exportée à 1080 px de large : la marque, son numéro, la signature. */
function Visuel({ rang, nom, classe, children }: { rang: number; nom: string; classe?: string; children: React.ReactNode }) {
  return (
    <article className={classe ? `slide ${classe}` : "slide"} aria-label={`Image ${rang} sur 6 : ${nom}`}>
      <div className="s-top">
        <span className="s-brand">
          <Logo className="mark" />
          Au crible <b>2027</b>
        </span>
        <span className="s-page">{rang}/6</span>
      </div>
      {children}
      <div className="s-foot">
        <span>{SIGNATURE}</span>
        {rang < 6 && (
          <span className="next">
            Glisse <Fleche />
          </span>
        )}
      </div>
    </article>
  );
}

/** La carte question, telle qu'on la pioche dans l'app : en image 1 du carrousel et en haut de la story. */
function CarteQuestion({ question, theme, classe }: { question: Question; theme: Theme; classe?: string }) {
  const jours = joursEntre(question.date, PREMIER_TOUR);
  return (
    <div className={classe ? `s-deck ${classe}` : "s-deck"}>
      <div className="s-face">
        <div className="s-face-top">
          <p className="theme-chip">
            <PartDuTheme />
            {theme.nom}
          </p>
          <h3>{question.question}</h3>
        </div>
        <p className="s-face-body">
          <span>Question n° {question.numero} ·</span>
          {jours > 0 && <span className="s-pill">J-{jours}</span>}
        </p>
      </div>
    </div>
  );
}

/** Les six images de la fiche du jour, chacune tirée de la fiche : corriger la fiche corrige le carrousel. */
function lesImages(question: Question, theme: Theme): React.ReactElement[] {
  return [
    <Visuel key={1} rang={1} nom="la question">
      <CarteQuestion question={question} theme={theme} />
    </Visuel>,
    <Visuel key={2} rang={2} nom="le contexte" classe="themed">
      <h3 className="s-title">Le contexte</h3>
      <ul className="s-ctx">
        {question.contexte.map((phrase) => (
          <li key={phrase}>{phrase}</li>
        ))}
      </ul>
    </Visuel>,
    <Visuel key={3} rang={3} nom={`${question.chiffres.length} chiffres clés`} classe="themed">
      <h3 className="s-title">{question.chiffres.length} chiffres clés</h3>
      <ul className="s-figs">
        {question.chiffres.map((chiffre) => (
          <li key={chiffre.legende} className="s-fig">
            <span className="s-fig-num">
              {chiffre.valeur}
              {chiffre.unite && <small> {chiffre.unite}</small>}
            </span>
            <span className="s-fig-txt">{chiffre.legende}</span>
            <span className="s-fig-src">
              Source : <b>{chiffre.source.organisme}</b> · {chiffre.source.annee}
            </span>
          </li>
        ))}
      </ul>
    </Visuel>,
    <Visuel key={4} rang={4} nom={`les ${question.options.length} options`} classe="themed">
      <h3 className="s-title">Les {question.options.length} options</h3>
      <p className="s-sub">Les noms viennent après ta réponse.</p>
      <ul className="s-opts">
        {question.options.map((option) => (
          <li key={option.id} className="s-opt">
            <i>{option.id}</i>
            <b>{option.libelle}</b>
          </li>
        ))}
      </ul>
    </Visuel>,
    // Les deux côtés viennent de la fiche, que l'auteur écrit : deux blocs au même format, aucun mis en avant.
    <Visuel key={5} rang={5} nom="le meilleur argument des deux côtés" classe="themed">
      <h3 className="s-title">Le meilleur argument des deux côtés</h3>
      {question.cotes && (
        <div className="s-args">
          {question.cotes.map((cote) => (
            <section key={cote.titre} className="s-arg">
              <h4>
                <i></i>
                {cote.titre}
              </h4>
              <p>{cote.argument}</p>
            </section>
          ))}
        </div>
      )}
    </Visuel>,
    <Visuel key={6} rang={6} nom="et toi ?" classe="slide--theme">
      <div className="s-cta">
        <span className="mark-big">
          <Logo />
        </span>
        <h3>Et toi&nbsp;?</h3>
        <p>Réponds et découvre de quels candidats tu es proche</p>
        <span className="s-url">
          aucrible2027.fr <Fleche />
        </span>
      </div>
    </Visuel>,
  ];
}

const EN_LETTRES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six"];

/**
 * La légende proposée pour le carrousel : la question et ce que montrent les images, puis l'invitation à répondre.
 */
function Legende({ question }: { question: Question }) {
  return (
    <section className="sheet legende sec" aria-labelledby="h-leg">
      <div className="sec-h">
        <h2 id="h-leg">La légende</h2>
        <p>à copier</p>
      </div>
      <div className="box">
        <p>
          {question.question} Fais défiler : le contexte, {EN_LETTRES[question.chiffres.length]} chiffres sourcés, les{" "}
          {EN_LETTRES[question.options.length]} options et le meilleur argument de chaque côté.
        </p>
        <p>Réponds sur aucrible2027.fr (lien en bio). Ce n&apos;est pas un sondage : tes réponses restent sur ton téléphone.</p>
      </div>
      <div className="acts">
        <Link className="act second" href="/video">
          Voir la vidéo du jour <Fleche />
        </Link>
      </div>
    </section>
  );
}

const LEGENDES = [
  ["La question", "La carte du jour, telle qu'on la pioche dans l'app."],
  ["Le contexte", "Trois phrases courtes, sans jargon."],
  ["Les chiffres clés", "Chaque chiffre porte sa source et sa date."],
  ["Les options", "Des cartes, aucun nom de candidat."],
  ["Le meilleur argument", "Un argument de chaque côté, au même format."],
  ["Et toi ?", "L'appel à répondre, avec le camembert des 11 thèmes."],
];

/**
 * « Carrousel du jour » (maquettes/carrousel.html) : les visuels de la question du jour, tirés de sa fiche, pour les
 * réseaux de l'auteur, la story et la légende proposée. Seule la fiche du jour, déjà publiée, est lue. Le
 * téléchargement vient avec le ticket 219.
 */
async function CarrouselDuJour() {
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const question = publiees.find((q) => q.date === jour);
  const theme = question && lireThemes().find((t) => t.id === question.theme);
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className={theme ? `social page-car ${theme.classe}` : "social page-car"}>
        <header className="sheet-head">
          <h1>
            Carrousel
            <br />
            du jour<span>.</span>
          </h1>
          <p className="lead">
            {question ? (
              <>
                Les visuels de la <b>question n° {question.numero}</b> : 6 images à faire défiler et une story.
              </>
            ) : (
              "Pas de question aujourd'hui : pas de carrousel."
            )}
          </p>
          <ul className="specs" aria-label="Formats">
            <li>
              <b>6</b> images 4:5 · 1080×1350
            </li>
            <li>
              <b>1</b> story 9:16 · 1080×1920
            </li>
            <li>Dessinées ici à 320 px de large</li>
          </ul>
          <VisuelsDuJour page="carrousel" />
        </header>
        {question && theme && (
          <section className="sheet sec" aria-labelledby="h-car">
            <div className="sec-h">
              <h2 id="h-car">Le carrousel</h2>
              <p>6 images · 4:5</p>
            </div>
            <div className="planche">
              {/* Chaque image et sa légende, dans l'ordre du carrousel. */}
              <CarrouselEnFigures question={question} theme={theme} />
            </div>
          </section>
        )}
        {question && theme && <Story question={question} theme={theme} />}
        {question && <Legende question={question} />}
      </main>
    </>
  );
}

/**
 * La story du jour, 9:16, dessinée à 320 × 569 et exportée en 1080 × 1920 : la carte question, l'autocollant « Et toi ? »
 * aux deux choix que l'auteur écrit dans la fiche, et « Lien en bio ». Le vote se pose à la main dans Instagram :
 * l'autocollant est dessiné ici pour la relecture.
 */
function Story({ question, theme }: { question: Question; theme: Theme }) {
  return (
    <section className="sheet sec" aria-labelledby="h-story">
      <div className="sec-h">
        <h2 id="h-story">La story</h2>
        <p>1 image · 9:16</p>
      </div>
      <div className="story-row seule">
        <figure className="fr">
          <article className="slide slide--story" aria-label="Story : la question avec un autocollant à deux choix">
            <div className="s-top">
              <span className="s-brand">
                <Logo className="mark" />
                Au crible <b>2027</b>
              </span>
              <span className="s-page">{SIGNATURE}</span>
            </div>
            <CarteQuestion question={question} theme={theme} classe="st-card" />
            {question.story && (
              <div className="sticker" role="group" aria-label="Autocollant à deux choix">
                <p className="sticker-q">Et toi&nbsp;?</p>
                <div className="sticker-opts">
                  {question.story.map(({ choix, precision }) => (
                    <span key={choix}>
                      {choix} {precision && <small>{precision}</small>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="st-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
                  style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
                />
              </svg>
              Lien en bio
            </p>
          </article>
          <figcaption>
            <span className="no">Story · 9:16</span>
            <span className="cap">La question et le vote en un geste</span>
            <span className="sub">Le vote se pose à la main dans Instagram.</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/** Les images, chacune dans sa figure avec sa légende (maquettes/carrousel.html, « planche »). */
function CarrouselEnFigures({ question, theme }: { question: Question; theme: Theme }) {
  return lesImages(question, theme).map((image, i) => (
    <figure key={i} className="fr">
      {image}
      <figcaption>
        <span className="no">Image {i + 1} sur 6</span>
        <span className="cap">{LEGENDES[i][0]}</span>
        <span className="sub">{LEGENDES[i][1]}</span>
      </figcaption>
    </figure>
  ));
}

export default function PageCarrousel() {
  return (
    <Suspense>
      <CarrouselDuJour />
    </Suspense>
  );
}
