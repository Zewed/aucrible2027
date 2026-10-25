import { PREMIER_TOUR } from "@/components/CompteARebours";
import { Logo } from "@/components/Logo";
import { PartDuTheme } from "@/components/PuceTheme";
import type { Question, Theme } from "@/lib/contenu";
import { joursEntre } from "@/lib/date";

/** Ce que reçoit chaque image de la vidéo : la fiche du jour et son thème. Corriger la fiche corrige la vidéo. */
type Fiche = { question: Question; theme: Theme };

/** Une image de la vidéo, dessinée à 240 px de large (9:16), comme dans maquettes/video.html. */
function Cadre({ nom, classe, children }: { nom: string; classe?: string; children: React.ReactNode }) {
  return (
    <div className={classe ? `vf ${classe}` : "vf"} role="img" aria-label={nom}>
      <div className="v-brand">
        <Logo className="mark" />
        <span>
          Au crible <b>2027</b>
        </span>
      </div>
      {children}
    </div>
  );
}

function Carte({ question, theme }: Fiche) {
  return (
    <Cadre nom="Image 1 : la carte question">
      <div className="v-body">
        <div className="v-flip">
          <div className="v-card">
            <div className="v-card-top">
              <p className="theme-chip">
                <PartDuTheme />
                {theme.nom}
              </p>
              <h3>{question.question}</h3>
            </div>
            <p className="v-card-foot">
              Question n° {question.numero} · J-{joursEntre(question.date, PREMIER_TOUR)}
            </p>
          </div>
        </div>
      </div>
    </Cadre>
  );
}

function Contexte({ question }: Fiche) {
  return (
    <Cadre nom="Image 2 : le contexte">
      <div className="v-body">
        <p className="v-k">
          <i></i>Le contexte
        </p>
        <div className="v-words">
          {question.contexte.map((phrase) => (
            <p key={phrase} className="on">
              {phrase}
            </p>
          ))}
        </div>
      </div>
    </Cadre>
  );
}

function Chiffres({ question }: Fiche) {
  return (
    <Cadre nom={`Image 3 : ${question.chiffres.length} chiffres clés`}>
      <div className="v-body">
        <p className="v-k">
          <i></i>
          {question.chiffres.length} chiffres clés
        </p>
        <div className="v-figs">
          {question.chiffres.map((chiffre) => (
            <div key={chiffre.legende} className="v-fig">
              <span className="v-fig-num">
                {chiffre.valeur}
                {chiffre.unite && <small> {chiffre.unite}</small>}
              </span>
              <span className="v-fig-txt">{chiffre.legende}</span>
              <span className="v-fig-src">
                <span>
                  Source : <b>{chiffre.source.organisme}</b> {chiffre.source.annee}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Cadre>
  );
}

function Options({ question }: Fiche) {
  return (
    <Cadre nom={`Image 4 : les ${question.options.length} options`}>
      <div className="v-body">
        <p className="v-k">
          <i></i>Les {question.options.length} options
        </p>
        <ul className="v-opts">
          {question.options.map((option) => (
            <li key={option.id} className="v-opt">
              <i>{option.id}</i>
              <b>{option.libelle}</b>
            </li>
          ))}
        </ul>
      </div>
    </Cadre>
  );
}

function DeuxCotes({ question }: Fiche) {
  return (
    <Cadre nom="Image 5 : les deux côtés">
      <div className="v-body">
        <p className="v-k">
          <i></i>Les deux côtés
        </p>
        {question.cotes && (
          <div className="v-args">
            {question.cotes.map((cote) => (
              <section key={cote.titre} className="v-arg">
                <h4>
                  <i></i>
                  {cote.titre}
                </h4>
                <p>{cote.argument}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </Cadre>
  );
}

function EtToi() {
  return (
    <Cadre nom="Image 6 : et toi ? aucrible2027.fr" classe="vf--theme">
      <div className="v-body v-cta">
        <span className="mark-big">
          <Logo />
        </span>
        <h3>Et toi&nbsp;?</h3>
        <p>Réponds et découvre de quels candidats tu es proche</p>
        <span className="v-url">aucrible2027.fr</span>
      </div>
    </Cadre>
  );
}

function Fin() {
  return (
    <Cadre nom="Image 7 : carte de fin">
      <div className="v-body v-cta v-end">
        <span className="mark-big">
          <Logo />
        </span>
        <h3>
          Au crible <span className="v-annee">2027</span>
        </h3>
        <p className="v-handle">
          <span>aucrible2027.fr</span>
          <span>@aucrible2027</span>
        </p>
      </div>
    </Cadre>
  );
}

/**
 * Les 7 images de la vidéo du jour, dans l'ordre, avec leur place dans les 75 secondes (maquettes/video.html) :
 * le storyboard de la page « Vidéo du jour » les montre telles quelles, la vidéo les enchaîne.
 */
export const IMAGES = [
  { debut: 0, fin: 3, Dessin: Carte, legende: "la carte question", ecran: "La question en grand, sur la carte du thème." },
  { debut: 3, fin: 12, Dessin: Contexte, legende: "le contexte en 3 phrases", ecran: "Une phrase après l'autre." },
  { debut: 12, fin: 30, Dessin: Chiffres, legende: "les chiffres clés", ecran: "Chaque chiffre avec sa source et sa date." },
  { debut: 30, fin: 45, Dessin: Options, legende: "les options en cartes", ecran: "Sans aucun nom de candidat." },
  { debut: 45, fin: 60, Dessin: DeuxCotes, legende: "un argument de chaque côté", ecran: "Les deux au même format." },
  { debut: 60, fin: 70, Dessin: EtToi, legende: "Et toi ? aucrible2027.fr", ecran: "L'appel à répondre et l'adresse." },
  { debut: 70, fin: 75, Dessin: Fin, legende: "la carte de fin", ecran: "La marque, l'adresse et le pseudo." },
];

/** La durée de la vidéo, en secondes : la fin de sa dernière image. */
export const DUREE = IMAGES[IMAGES.length - 1].fin;
