import { Fragment, useId } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "@/components/Logo";
import { PartDuTheme } from "@/components/PuceTheme";
import type { DatesEnGrand, Question, Reponse, Reportage as DonneesDuReportage, Theme } from "@/lib/contenu";
import { type Camp, type MusiqueDuReportage, ordreDesCamps, pasDe, rythmeDe, textesDesSequences } from "@/video/reportage/rythme";

export type { MusiqueDuReportage };
export type ProprietesDuReportage = { question: Question; theme: Theme; musique?: MusiqueDuReportage };

/** La seule courbe de mouvement du kit : exponentielle, sans rebond. */
const sortie = Easing.bezier(0.16, 1, 0.3, 1);

/** De 0 à 1 entre deux instants (en images), sans dépasser. */
function progres(image: number, debut: number, duree: number) {
  return interpolate(image, [debut, debut + duree], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: sortie });
}

/** Le volume de la musique, seule sous l'image. */
const VOLUME = 0.6;


/** Quand paraît un texte d'une séquence, et quand vient le suivant, en images depuis le début de la séquence. */
type Instant = { debut: number; fin: number };
/** Ce que reçoit chaque séquence : la fiche, son thème, sa durée en images et l'instant de chacun de ses textes. */
type Scene = { question: Question; theme: Theme; images: number; instants: Instant[] };


/** La marque, en haut à gauche de chaque séquence. */
function Marque() {
  return (
    <div className="rp-marque">
      <Logo className="rp-logo" />
      <span>
        Au crible <b>2027</b>
      </span>
    </div>
  );
}

/** Le titre d'une séquence, qui glisse depuis la gauche. */
function Titre({ children }: { children: React.ReactNode }) {
  const image = useCurrentFrame();
  const p = progres(image, 0, 14);
  return (
    <h2 className="rp-titre" style={{ opacity: p, transform: `translateX(${(1 - p) * -80}px)` }}>
      <i></i>
      {children}
    </h2>
  );
}

/** Une phrase qui conclut l'écran, posée en bas comme un sous-titre. */
function Chute({ children, debut }: { children: string; debut: number }) {
  const image = useCurrentFrame();
  const p = progres(image, debut - 2, 12);
  return (
    <p className="rp-chute" style={{ opacity: p, transform: `translate(-50%, ${(1 - p) * 30}px)` }}>
      {insecable(children)}
    </p>
  );
}

/** Où en sont les questions : un losange par question, celle en cours à la couleur du thème. */
function Avancee({ rang, total }: { rang: number; total: number }) {
  return (
    <div className="rp-avancee" aria-hidden="true">
      {Array.from({ length: total }, (_, k) => (
        <i key={k} className={k < rang ? "fait" : k === rang ? "en-cours" : undefined} />
      ))}
    </div>
  );
}

/**
 * Une phrase où rien ne se coupe en fin de ligne là où le français l'interdit : la ponctuation haute, « % » et « € »
 * restent collés au mot d'avant, « « » au mot d'après, et les tranches d'un nombre (« 1 174 978 ») ensemble.
 */
const insecable = (texte: string) =>
  texte
    .replace(/ ([?!:;»%€])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0")
    .replace(/(\d) (?=\d{3}\b)/g, "$1\u00a0");

/** Les mots d'une phrase, pour les faire apparaître un à un, chacun gardant ce qui ne s'en sépare pas. */
const motsDe = (texte: string) => insecable(texte).split(" ");

/** Une question qui s'écrit mot à mot, en très grand. */
function QuestionEnGrand({ texte, className }: { texte: string; className: string }) {
  const image = useCurrentFrame();
  return (
    <h1 className={className}>
      {motsDe(texte).map((mot, i) => {
        const p = progres(image, 6 + i * 3, 12);
        return (
          <span key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
            {mot}
          </span>
        );
      })}
    </h1>
  );
}

function Ouverture({ question, theme }: Scene) {
  const image = useCurrentFrame();
  return (
    <AbsoluteFill className="rp-plein rp-couleur">
      <Marque />
      <p className="theme-chip rp-puce" style={{ opacity: progres(image, 2, 10) }}>
        <PartDuTheme />
        {theme.nom}
      </p>
      <QuestionEnGrand texte={question.question} className="rp-question" />
    </AbsoluteFill>
  );
}

/** Des dates et leur valeur, en très grand, l'une après l'autre (l'accroche, le déficit), puis la chute. */
function DatesEnImages({ dates, titre, source, instants }: { dates: DatesEnGrand; titre?: string; source?: string; instants: Instant[] }) {
  const image = useCurrentFrame();
  // Une valeur longue fait passer toutes les valeurs de l'écran au même format, pour qu'aucune ne paraisse plus grosse.
  const longue = dates.etapes.some((e) => e.valeur.length > 14);
  return (
    <AbsoluteFill className="rp-plein rp-table">
      <Marque />
      {titre && <Titre>{titre}</Titre>}
      <div className="rp-accroche">
        {dates.etapes.map((etape, i) => {
          const p = progres(image, instants[i].debut - 2, 12);
          return (
            <div
              key={etape.quand}
              className={["rp-etape-accroche", etape.projection && "projection", longue && "longue"].filter(Boolean).join(" ")}
              style={{ opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}
            >
              <span>
                {etape.quand}
                {etape.projection && <small>prévision</small>}
              </span>
              <b>{insecable(etape.valeur)}</b>
            </div>
          );
        })}
      </div>
      {source && <p className="rp-meca-source">Source : {source}</p>}
      <Chute debut={instants.at(-1)!.debut}>{dates.chute}</Chute>
    </AbsoluteFill>
  );
}

/** Un personnage, plein ou en partie (`part` de 0 à 1, rempli depuis la gauche), son contour toujours visible. */
function Personnage({ part = 1, className }: { part?: number; className: string }) {
  const id = useId();
  const forme = (
    <>
      <circle cx="30" cy="18" r="15" />
      <rect x="8" y="38" width="44" height="78" rx="20" />
    </>
  );
  return (
    <svg className={className} viewBox="0 0 60 120" aria-hidden="true">
      <clipPath id={id}>
        <rect x="0" y="0" width={60 * part} height="120" />
      </clipPath>
      <g className="contour">{forme}</g>
      <g clipPath={`url(#${id})`}>{forme}</g>
    </svg>
  );
}

const ecrire = (nombre: number) => nombre.toLocaleString("fr-FR");

/** Le mécanisme : combien de personnes paient pour une qui reçoit, à deux dates, en personnages. */
function Mecanisme({ mecanisme, instants }: { mecanisme: NonNullable<DonneesDuReportage["mecanisme"]>; instants: Instant[] }) {
  const image = useCurrentFrame();
  return (
    <AbsoluteFill className="rp-plein rp-table">
      <Marque />
      <Titre>{mecanisme.titre}</Titre>
      <p className="rp-meca-texte" style={{ opacity: progres(image, instants[0].debut, 12) }}>
        {insecable(mecanisme.texte)}
      </p>
      <div className="rp-ratios">
        {mecanisme.points.map((point, i) => {
          const debut = instants[i + 1].debut;
          const p = progres(image, debut - 2, 12);
          const pleins = Math.floor(point.valeur);
          const reste = point.valeur - pleins;
          const personnages = [...Array.from({ length: pleins }, () => 1), ...(reste > 0 ? [reste] : [])];
          return (
            <div key={point.annee} className={point.projection ? "rp-ratio projection" : "rp-ratio"} style={{ opacity: p }}>
              <b className="rp-ratio-annee">
                {point.annee}
                {point.projection && <small>prévision</small>}
              </b>
              <div className="rp-actifs">
                {personnages.map((part, k) => {
                  const q = progres(image, debut + 4 + k * 4, 10);
                  return (
                    <span key={k} style={{ opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
                      <Personnage part={part} className="rp-actif" />
                    </span>
                  );
                })}
              </div>
              <svg className="rp-paie" viewBox="0 0 120 40" aria-hidden="true">
                <path d="M4 20h100M90 6l14 14-14 14" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progres(image, debut + 16, 12)} />
              </svg>
              <Personnage className="rp-retraite" />
              <span className="rp-ratio-valeur">
                {ecrire(point.valeur)}
                <small>pour 1 retraité</small>
              </span>
            </div>
          );
        })}
      </div>
      <p className="rp-meca-source">Source : {mecanisme.source}</p>
      <Chute debut={instants.at(-1)!.debut}>{mecanisme.chute}</Chute>
    </AbsoluteFill>
  );
}

/** Les leviers, à égalité : ils arrivent l'un après l'autre, sans numéro ni mise en avant. */
function LeviersEnImages({ leviers, instants }: { leviers: NonNullable<DonneesDuReportage["leviers"]>; instants: Instant[] }) {
  const image = useCurrentFrame();
  const [, choix, chute] = instants;
  const pas = (choix.fin - choix.debut) / leviers.choix.length;
  return (
    <AbsoluteFill className="rp-plein rp-table">
      <Marque />
      <Titre>{leviers.titre}</Titre>
      <div className="rp-leviers" data-n={leviers.choix.length}>
        {leviers.choix.map((levier, k) => {
          const p = progres(image, choix.debut + k * pas - 2, 12);
          return (
            <Fragment key={levier.texte}>
              {k > 0 && (
                <span className="rp-ou" style={{ opacity: p }}>
                  ou
                </span>
              )}
              <div className="rp-levier" style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
                <b>{levier.texte}</b>
                {levier.detail && <small>{insecable(levier.detail)}</small>}
              </div>
            </Fragment>
          );
        })}
      </div>
      <p className="rp-meca-source">Source : {leviers.source}</p>
      <Chute debut={chute.debut}>{leviers.chute}</Chute>
    </AbsoluteFill>
  );
}

/** L'écran titre d'une question, plein écran, avant les réponses. */
function TitreDeQuestion({ texte, rang, total }: { texte: string; rang: number; total: number }) {
  return (
    <AbsoluteFill className="rp-plein rp-couleur">
      <Marque />
      <Avancee rang={rang} total={total} />
      <QuestionEnGrand texte={texte} className="rp-question rp-question-enjeu" />
    </AbsoluteFill>
  );
}



/**
 * Les formats d'une carte du face-à-face, du plus grand au plus serré, en pixels : leurs tailles doivent suivre celles
 * de reportage.css (.rp-cote-carte, .serre, .tres-serre).
 */
const FORMATS_DES_CARTES = [
  { classe: "", affirmation: 60, chiffre: 200, chiffreLong: 130, texte: 46, ecart: 24 },
  { classe: " serre", affirmation: 54, chiffre: 176, chiffreLong: 112, texte: 42, ecart: 20 },
  { classe: " tres-serre", affirmation: 50, chiffre: 150, chiffreLong: 96, texte: 38, ecart: 16 },
];
type FormatDeCarte = (typeof FORMATS_DES_CARTES)[number];
/** La place pour le contenu d'une carte : sa hauteur dans l'écran, moins ses marges et la place de la source. */
const HAUTEUR_UTILE = 480;
/** La largeur d'une ligne de carte, moins ce que la coupure entre les mots laisse perdre. */
const LARGEUR_DE_LIGNE = 720 * 0.92;
const lignes = (texte: string, largeurDUnCaractere: number) => Math.ceil((texte.length * largeurDUnCaractere) / LARGEUR_DE_LIGNE);

/**
 * Un chiffre trop large pour tenir en grand sur une ligne passe en taille réduite, sur deux lignes au besoin : plus de
 * neuf caractères, ou une largeur estimée qui dépasse la carte (une flèche compte pour deux chiffres et demi).
 */
const chiffreLong = (chiffre: string, f: FormatDeCarte) =>
  chiffre.length > 9 || (chiffre.length + 1.5 * (chiffre.match(/→/g)?.length ?? 0)) * 0.42 * f.chiffre > 720;

/** La hauteur qu'une réponse prend dans une carte de ce format, estimée d'après la largeur moyenne des caractères. */
function hauteurDeLaCarte(r: Reponse, f: FormatDeCarte) {
  const affirmation = lignes(r.affirmation, 0.33 * f.affirmation) * 1.04 * f.affirmation;
  const chiffre = chiffreLong(r.chiffre, f) ? lignes(r.chiffre, 0.32 * f.chiffreLong) * 0.95 * f.chiffreLong : 0.88 * f.chiffre;
  const texte = lignes(r.texte, 0.38 * f.texte) * 1.15 * f.texte;
  return affirmation + chiffre + texte + 2 * f.ecart;
}

/**
 * Le face-à-face d'une question : POUR à gauche, CONTRE à droite, toujours à la même place ; les deux réponses
 * arrivent l'une après l'autre (dans l'ordre `ordre`), celle qu'on lit en avant, puis restent côte à côte.
 */
function FaceAFace({ question, camps, ordre, rang, total, instants }: {
  question: NonNullable<DonneesDuReportage["questions"]>[number];
  camps: NonNullable<DonneesDuReportage["camps"]>;
  ordre: Camp[];
  rang: number;
  total: number;
  instants: Instant[];
}) {
  const image = useCurrentFrame();
  const fin = instants.at(-1)!.fin;
  // Les deux cartes prennent le plus grand format où chacune tient : les deux camps gardent la même taille de texte.
  const format = FORMATS_DES_CARTES.find((f) => [question.pour, question.contre].every((r) => hauteurDeLaCarte(r, f) <= HAUTEUR_UTILE)) ?? FORMATS_DES_CARTES.at(-1)!;
  // Un chiffre long réduit aussi celui d'en face : aucun camp n'a un chiffre plus gros que l'autre.
  const chiffresLongs = [question.pour, question.contre].some((r) => chiffreLong(r.chiffre, format));
  return (
    <AbsoluteFill className="rp-plein rp-table">
      <Marque />
      <Avancee rang={rang} total={total} />
      <Titre>{question.question}</Titre>
      <div className="rp-face-a-face">
        {(["pour", "contre"] as const).map((camp) => {
          const instant = instants[ordre.indexOf(camp)];
          const p = progres(image, instant.debut - 4, 12);
          // La réponse qu'on lit est en avant ; l'autre recule un peu, puis les deux se retrouvent à égalité.
          const enCours = image >= instant.debut - 4 && image < instant.fin;
          const recul = image >= fin ? 0 : enCours ? 0 : 1;
          const reponse = question[camp];
          return (
            <div key={camp} className={`rp-cote rp-cote-${camp}`}>
              <div className="rp-cote-tete">
                <b>{camps[camp]}</b>
                {camps.objet && <span>{camps.objet}</span>}
              </div>
              <div className={`rp-cote-carte${format.classe}`} style={{ opacity: p * (1 - 0.45 * recul * (p >= 1 ? 1 : 0)), transform: `translateY(${(1 - p) * 40}px)` }}>
                <strong>{insecable(reponse.affirmation)}</strong>
                <b className={chiffresLongs ? "long" : undefined}>{insecable(reponse.chiffre)}</b>
                <p>{insecable(reponse.texte)}</p>
                <small>Source : {reponse.source}</small>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}


/** La fin : les trois leviers reviennent, chacun avec qui il touche, puis « Et toi ? » et où répondre. */
function Fin({ leviers, instants }: { leviers?: DonneesDuReportage["leviers"]; instants: Instant[] }) {
  const image = useCurrentFrame();
  const p = progres(image, instants[1].debut - 6, 14);
  return (
    <AbsoluteFill className="rp-plein rp-couleur rp-fin">
      <Marque />
      {leviers && (
        <div className="rp-fin-leviers" data-n={leviers.choix.length}>
          {leviers.choix.map((levier, k) => {
            const q = progres(image, instants[0].debut - 2 + k * 5, 12);
            return (
              <Fragment key={levier.texte}>
                {k > 0 && (
                  <span className="rp-ou" style={{ opacity: q }}>
                    ou
                  </span>
                )}
                <div className="rp-fin-levier" style={{ opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
                  <b>{levier.texte}</b>
                  {levier.detail && <small>{insecable(levier.detail)}</small>}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
      <h2 style={{ opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}>Et toi ?</h2>
      <p className="rp-appel" style={{ opacity: progres(image, instants[2].debut - 2, 12) }}>
        Choisis ta carte sur <b>aucrible2027.fr</b>
      </p>
      <p className="rp-ia">Animation générée avec IA · contenu vérifié par un humain</p>
    </AbsoluteFill>
  );
}


/** Le dessin d'une séquence, d'après son nom (rythme.ts, `textesDesSequences`). */
function DessinDeSequence({ nom, ...scene }: Scene & { nom: string }) {
  const { question, instants } = scene;
  const r = question.reportage ?? {};
  const camps = r.camps ?? { pour: "Pour", contre: "Contre" };
  const questions = r.questions ?? [];
  const { accroche, mecanisme, ecart, leviers } = r;
  const rang = Number(nom.match(/^question-(\d+)/)?.[1] ?? 0) - 1;
  if (nom === "accroche" && accroche) return <DatesEnImages dates={accroche} instants={instants} />;
  if (nom === "mecanisme" && mecanisme) return <Mecanisme mecanisme={mecanisme} instants={instants} />;
  if (nom === "ecart" && ecart) return <DatesEnImages dates={ecart} titre={ecart.titre} source={ecart.source} instants={instants.slice(1)} />;
  if (nom === "leviers" && leviers) return <LeviersEnImages leviers={leviers} instants={instants} />;
  if (nom.endsWith("-debat"))
    return <FaceAFace question={questions[rang]} camps={camps} ordre={ordreDesCamps(rang)} rang={rang} total={questions.length} instants={instants} />;
  if (nom.startsWith("question-")) return <TitreDeQuestion texte={questions[rang].question} rang={rang} total={questions.length} />;
  if (nom === "fin") return <Fin leviers={leviers} instants={instants} />;
  return <Ouverture {...scene} />;
}

/** Les séquences du reportage d'une fiche, dans l'ordre, avec leurs textes (rythme.ts). */
export const sequencesDu = textesDesSequences;

/** La durée du reportage, en secondes, sur la musique de son thème. */
export const dureeDu = (question: Question, musique?: MusiqueDuReportage) =>
  sequencesDu(question).reduce((total, s) => total + rythmeDe(s, pasDe(musique)).duree, 0);

/** Le volet qui ouvre chaque séquence : une bande sombre qui balaie l'image et la découvre. */
function Volet() {
  const image = useCurrentFrame();
  const p = progres(image, 0, 10);
  if (p >= 1) return null;
  return <div className="rp-volet" style={{ transform: `translateX(${p * 101}%)` }} />;
}

/**
 * Le reportage d'une fiche (16:9), sans voix, sur la musique de son thème : un récit court, une idée par écran.
 * Chaque texte reste le temps d'être lu, et les coupes tombent sur la mesure. Tout vient de la fiche, qui vient de
 * l'étude de la question.
 */
export function Reportage({ question, theme, musique }: ProprietesDuReportage) {
  const { fps, durationInFrames } = useVideoConfig();
  const sequences = sequencesDu(question);
  const rythmes = sequences.map((s) => rythmeDe(s, pasDe(musique)));
  const debuts = rythmes.map((_, i) => rythmes.slice(0, i).reduce((t, r) => t + r.duree, 0));
  return (
    <AbsoluteFill className={`video reportage ${theme.classe}`}>
      {musique && (
        // Le morceau commence sur son premier temps fort, et reprend au début s'il est plus court que le reportage.
        <Audio
          src={staticFile(musique.src)}
          trimBefore={Math.round(musique.premierTemps * fps)}
          loop
          volume={(image) => VOLUME * Math.min(1, (image + 1) / (0.3 * fps), (durationInFrames - image) / (1.5 * fps))}
        />
      )}
      {sequences.map(({ nom }, i) => {
        // Les bornes sont arrondies depuis le début du reportage, pour qu'aucun écart ne s'accumule d'une séquence à l'autre.
        const de = Math.round(debuts[i] * fps);
        const images = Math.round((debuts[i] + rythmes[i].duree) * fps) - de;
        const instants = rythmes[i].instants.map((t) => ({ debut: Math.round(t.debut * fps), fin: Math.round(t.fin * fps) }));
        return (
          <Sequence key={nom} name={nom} from={de} durationInFrames={images}>
            <DessinDeSequence nom={nom} question={question} theme={theme} images={images} instants={instants} />
            {de > 0 && <Volet />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
