import type { Metadata } from "next";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { PREMIER_TOUR } from "@/components/CompteARebours";
import { Logo } from "@/components/Logo";
import { PartDuTheme } from "@/components/PuceTheme";
import { lireThemes, type Question, type Theme } from "@/lib/contenu";
import { joursEntre } from "@/lib/date";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "../visuels.css";
import "./carrousel.css";

// Un outil de l'auteur : la page n'a pas à être trouvée par les moteurs de recherche.
export const metadata: Metadata = { title: "Carrousel du jour — Au crible 2027", robots: { index: false } };

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
        <span>@aucrible2027</span>
        {rang < 6 && (
          <span className="next">
            Glisse <Fleche />
          </span>
        )}
      </div>
    </article>
  );
}

/** Les six images de la fiche du jour, chacune tirée de la fiche : corriger la fiche corrige le carrousel. */
function lesImages(question: Question, theme: Theme): React.ReactElement[] {
  const jours = joursEntre(question.date, PREMIER_TOUR);
  return [
    <Visuel key={1} rang={1} nom="la question">
      <div className="s-deck">
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
 * réseaux de l'auteur, et la légende proposée. Seule la fiche du jour, déjà publiée, est lue. La story, le
 * téléchargement et le lien vers la vidéo viennent avec les tickets 217, 219 et 220.
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
                Les visuels de la <b>question n° {question.numero}</b> : 6 images à faire défiler.
              </>
            ) : (
              "Pas de question aujourd'hui : pas de carrousel."
            )}
          </p>
          <ul className="specs" aria-label="Formats">
            <li>
              <b>6</b> images 4:5 · 1080×1350
            </li>
            <li>Dessinées ici à 320 px de large</li>
          </ul>
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
        {question && <Legende question={question} />}
      </main>
    </>
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
