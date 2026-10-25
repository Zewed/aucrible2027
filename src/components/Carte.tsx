"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Camembert } from "@/components/Camembert";
import { PisteDuPlateau } from "@/components/PisteDuPlateau";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { dessinerLaCarte, enregistrer, lirePolices } from "@/lib/image-de-carte";
import { classement, REPONSES_PAR_PART, reponsesComptees, reponsesParTheme, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";
import { placeDeLElecteur, surLeChamp } from "@/lib/plateau";

/** La couleur d'un thème : `--eco` pour « theme-eco ». */
const couleurDe = (theme: Theme) => `var(--${theme.classe.replace("theme-", "")})`;

/**
 * Le candidat le plus proche, celui que montre la carte : le premier du classement, à partir de
 * 10 réponses. Avant, la carte n'a rien à montrer (sa version verrouillée est un autre ticket).
 */
function usePremierDuClassement(questions: QuestionDuCalcul[], candidats: Candidat[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (reponsesComptees(questions, reponses) < SEUIL_DES_RESULTATS) return null;
  const premier = classement(questions, reponses, candidats)[0];
  return premier?.pourcentage === null ? null : premier;
}

/**
 * Le pied de la carte : « 23 réponses · 5/11 thèmes ». Toutes les réponses de l'appareil et les parts gagnées ; la
 * série de jours d'affilée n'existe plus (décision de l'auteur, 25 octobre 2026).
 */
/** Les thèmes dont la part est gagnée, dans l'ordre des thèmes. */
function usePartsGagnees(questions: QuestionDuCalcul[], themes: Theme[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const parTheme = reponsesParTheme(questions, reponses);
  return themes.map((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART);
}

function usePiedDeCarte(questions: QuestionDuCalcul[], themes: Theme[], parts = "thèmes") {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const nombre = Object.keys(reponses).length;
  const parTheme = reponsesParTheme(questions, reponses);
  const gagnees = themes.filter((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART).length;
  return [`${nombre} ${nombre > 1 ? "réponses" : "réponse"}`, `${gagnees}/${themes.length} ${parts}`].join(" · ");
}

/** Le cadenas de la carte verrouillée (maquettes/resultats-vide.html). */
function Cadenas() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" style={{ fill: "currentColor" }} />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round" }} />
    </svg>
  );
}

/** Avant 10 réponses : la carte grisée et cadenassée, sans nom ni pourcentage, et ce qu'il reste à répondre. */
function CarteVerrouillee({ comptees, pied }: { comptees: number; pied: string }) {
  const reste = SEUIL_DES_RESULTATS - comptees;
  return (
    <section className="sec" aria-labelledby="h-share">
      <div className="sec-h">
        <h2 id="h-share">Ta carte</h2>
        <p>format story</p>
      </div>
      <div className="share" style={{ marginTop: 18 }}>
        <div className="story locked" aria-label="Aperçu verrouillé de la carte à partager">
          <div className="stripes">
            {Array.from({ length: 11 }, (_, i) => (
              <i key={i}></i>
            ))}
          </div>
          <p className="story-k">Au crible 2027 · ma partie</p>
          <p className="story-lock">
            <Cadenas />
          </p>
          <p className="story-t">Je suis à … % proche de …</p>
          <div className="story-q">
            <b>Et toi&nbsp;?</b>
          </div>
          <p className="story-f">{pied}</p>
        </div>
        <div className="actions">
          <button className="act primary is-off" type="button" disabled aria-describedby="why">
            <Cadenas />
            Partager ma carte
          </button>
          <p className="act-note why" id="why">
            <b>Ta carte se débloque à {SEUIL_DES_RESULTATS} réponses.</b> Il t&apos;en reste {reste}.
          </p>
        </div>
      </div>
    </section>
  );
}

/** « Ta carte » sur « Mes résultats » : l'aperçu de la carte à partager, et ce qui l'ouvre. */
export function ApercuDeLaCarte({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const premier = usePremierDuClassement(questions, candidats);
  const pied = usePiedDeCarte(questions, themes);
  // La carte verrouillée dit « parts », comme resultats-vide.html, là où la carte débloquée dit « thèmes ».
  const piedVerrouille = usePiedDeCarte(questions, themes, "parts");
  const gagnees = usePartsGagnees(questions, themes);
  const comptees = reponsesComptees(questions, reponses);
  if (comptees < SEUIL_DES_RESULTATS) return <CarteVerrouillee comptees={comptees} pied={piedVerrouille} />;
  if (!premier) return null;
  return (
    <section className="sec" aria-labelledby="h-share">
      <div className="sec-h">
        <h2 id="h-share">Ta carte</h2>
        <p>format story</p>
      </div>
      <div className="share" style={{ marginTop: 18 }}>
        <div className="story" aria-label="Aperçu de la carte à partager">
          <div className="stripes">
            {themes.map((theme) => (
              <i key={theme.id} style={{ background: couleurDe(theme) }}></i>
            ))}
          </div>
          <p className="story-k">Au crible 2027 · ma partie</p>
          <p className="story-big">
            {premier.pourcentage}
            <small>&nbsp;%</small>
          </p>
          <p className="story-t">
            Je suis à {premier.pourcentage}&nbsp;% proche de {premier.candidat.nom}.
          </p>
          <div className="story-q">
            <b>Et toi&nbsp;?</b>
            <Camembert couleurs={themes.map((theme, i) => (gagnees[i] ? couleurDe(theme) : null))} />
          </div>
          <p className="story-f">{pied}</p>
        </div>
        <div className="actions">
          <Link className="act primary" href="/carte">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 15V4M7 9l5-5 5 5M5 14v5h14v-5"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            Partager ma carte
          </Link>
        </div>
      </div>
    </section>
  );
}

/** La coche du badge « Choisie » (maquettes/carte-story.html). */
function Coche() {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Les deux cartes à partager de la page « Ta carte » : « avec mon candidat » et « seulement mon pion »,
 * et le choix entre elles. Comme dans la maquette, la carte choisie se marque sans script : c'est la
 * feuille de la page qui lit le bouton radio coché.
 */
export function CartesAPartager({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const premier = usePremierDuClassement(questions, candidats);
  const pied = usePiedDeCarte(questions, themes);
  const gagnees = usePartsGagnees(questions, themes);
  const carteDuCandidat = useRef<HTMLElement>(null);
  const carteDuPion = useRef<HTMLElement>(null);
  const choix = useRef<HTMLFormElement>(null);
  // Les deux images sont dessinées d'avance, à l'arrivée : toucher « Partager » ouvre alors le partage
  // sans attendre, ce que certains téléphones exigent.
  const images = useRef<Partial<Record<"candidat" | "pion", Promise<File>>>>({});
  const affichee = premier ? `${premier.candidat.id}-${premier.pourcentage}-${pied}` : null;
  useEffect(() => {
    if (!affichee || !carteDuCandidat.current || !carteDuPion.current) return;
    const [candidat, pion] = [carteDuCandidat.current, carteDuPion.current];
    const polices = lirePolices(candidat);
    images.current = {
      candidat: polices.then((p) => dessinerLaCarte(candidat, p, "au-crible-2027-ma-carte.png")),
      pion: polices.then((p) => dessinerLaCarte(pion, p, "au-crible-2027-mon-pion.png")),
    };
  }, [affichee]);
  if (!premier) return null;

  /** L'image de la version choisie, dessinée d'avance. */
  function imageChoisie() {
    const version = choix.current ? new FormData(choix.current).get("montre") : null;
    return images.current[version === "pion" ? "pion" : "candidat"];
  }

  async function partager() {
    const fichier = await imageChoisie();
    if (!fichier) return;
    // Sans partage du système (sur un ordinateur, souvent), l'image est enregistrée : à confirmer.
    if (navigator.canShare?.({ files: [fichier] })) await navigator.share({ files: [fichier] }).catch(() => {});
    else enregistrer(fichier);
  }

  async function telecharger() {
    const fichier = await imageChoisie();
    if (fichier) enregistrer(fichier);
  }
  const nombre = gagnees.filter(Boolean).length;
  const camembert = themes.map((theme, i) => (gagnees[i] ? couleurDe(theme) : null));
  const { x, y } = surLeChamp(placeDeLElecteur(questions, reponses));
  const frise = (
    <div className="sc-tiles" aria-hidden="true">
      {themes.map((theme) => (
        <i key={theme.id} style={{ background: couleurDe(theme) }}></i>
      ))}
    </div>
  );

  return (
    <>
      <div className="sp-cards">
        <div className="sp-slot sp-slot--a">
          <p className="sp-cap">
            <span className="one">Version 1 · avec mon candidat</span>
            <span className="sp-on">
              <Coche />
              Choisie
            </span>
          </p>
          <div className="sc-deck sc-deck--a">
            <article ref={carteDuCandidat} className="sc sc--a" aria-label={`Carte à partager : ${premier.pourcentage} % proche de ${premier.candidat.nom}`}>
              {frise}
              <p className="sc-k">Au crible 2027 · ma partie</p>
              <p className="sc-big">
                {premier.pourcentage}
                <small>&nbsp;%</small>
              </p>
              <p className="sc-t">
                Je suis à {premier.pourcentage}&nbsp;% proche de <mark>{premier.candidat.nom}</mark>.
              </p>
              <div className="sc-token">
                <Camembert interieur={34} couleurs={camembert} description={`Camembert : ${nombre} ${nombre > 1 ? "thèmes" : "thème"} sur ${themes.length}`} />
              </div>
              <p className="sc-f">{pied}</p>
              <p className="sc-ask">
                <b>Et toi&nbsp;?</b>
                <span className="sc-url">aucrible2027.fr</span>
              </p>
            </article>
          </div>
        </div>
        <div className="sp-slot sp-slot--b">
          <p className="sp-cap">
            <span className="one">Version 2 · seulement mon pion</span>
            <span className="sp-on">
              <Coche />
              Choisie
            </span>
          </p>
          <div className="sc-deck sc-deck--b">
            <article ref={carteDuPion} className="sc sc--b" aria-label="Carte à partager : mon pion sur le plateau, sans nom de candidat">
              {frise}
              <p className="sc-k">Au crible 2027 · ma partie</p>
              <h2 className="sc-h">Mon pion sur le plateau</h2>
              <div className="sc-board">
                <div className="board" role="img" aria-label="Plateau à deux axes, avec mon pion seulement">
                  <PisteDuPlateau />
                  <div className="field">
                    <span className="you" style={{ "--x": `${x}%`, "--y": `${y}%` } as React.CSSProperties}>
                      <Camembert couleurs={camembert} />
                      <span>TOI</span>
                    </span>
                  </div>
                  <span className="edge top">↑ progressiste</span>
                  <span className="edge bottom">↓ conservateur</span>
                  <span className="edge left">← plus de redistribution</span>
                  <span className="edge right">plus de marché →</span>
                </div>
              </div>
              <p className="sc-ask sc-ask--col">
                <b>Et toi, tu te places où&nbsp;?</b>
                <span className="sc-url">aucrible2027.fr</span>
              </p>
            </article>
          </div>
        </div>
      </div>
      <form ref={choix} className="sp-controls" onSubmit={(evenement) => evenement.preventDefault()}>
        <fieldset className="sp-choice theme-eco">
          <legend>Ce que ma carte montre</legend>
          <div className="opts">
            <label className="opt">
              <input type="radio" name="montre" id="v-cand" value="candidat" defaultChecked />
              <span className="opt-face">
                <span className="opt-letter" aria-hidden="true">
                  %
                </span>
                <span className="opt-title">Mon candidat le plus proche</span>
                <span className="opt-impl">Son nom et ton pourcentage</span>
              </span>
            </label>
            <label className="opt">
              <input type="radio" name="montre" id="v-pion" value="pion" />
              <span className="opt-face">
                <span className="opt-letter" aria-hidden="true">
                  <svg className="ic" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="3.5" />
                    <path d="M12 3v18M3 12h18" />
                    <circle cx="7.6" cy="7.6" r="1.9" style={{ fill: "currentColor" }} />
                  </svg>
                </span>
                <span className="opt-title">Seulement mon pion</span>
                <span className="opt-impl">Aucun nom de candidat</span>
              </span>
            </label>
          </div>
        </fieldset>
        <div className="actions sp-actions">
          <button className="act primary" type="button" onClick={partager}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 15V4M7 9l5-5 5 5M5 14v5h14v-5"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            Partager
          </button>
          <button className="act second" type="button" onClick={telecharger}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 4v11M7 10l5 5 5-5M5 19h14"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            Télécharger l&apos;image
          </button>
        </div>
        <p className="act-note">L&apos;image est dessinée sur ton téléphone : rien n&apos;est envoyé.</p>
      </form>
    </>
  );
}
