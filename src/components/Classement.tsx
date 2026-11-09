"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Pion } from "@/components/Pion";
import { PartDuTheme } from "@/components/PuceTheme";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, REPONSES_PAR_PART, reponsesComptees, reponsesParTheme, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Les largeurs des noms estompés de l'aperçu, celles de maquettes/resultats-vide.html. */
const APERCU = [62, 48, 55];

/** Le nom court d'un thème, en tête de sa colonne : ce qui précède « & », « Économie » pour « Économie & impôts ». */
const nomCourt = (theme: Theme) => theme.nom.split(" & ")[0];

/** La colonne qui range les lignes : un thème, par son identifiant, ou null pour la proximité sur tout. */
type Tri = string | null;

/**
 * La tête de la grille : une colonne par thème, sa part du camembert et son nom court. Un thème sous 3 réponses a sa part
 * en pointillés et ses pastilles, comme sur le camembert : ses cases restent vides. Avec `trier`, chaque tête range les
 * lignes par sa colonne, sauf celle d'un thème sans assez de réponses ; la colonne qui range porte une flèche.
 */
function TeteDeLaGrille({ themes, nombres, tri = null, trier }: { themes: Theme[]; nombres: number[]; tri?: Tri; trier?: (tri: Tri) => void }) {
  const Tete = trier ? "button" : "span";
  return (
    <div className="g-tete">
      <span></span>
      {themes.map((theme, i) => {
        const compte = nombres[i] >= REPONSES_PAR_PART;
        return (
          <Tete
            key={theme.id}
            className={`g-th ${theme.classe}${compte ? "" : " vide"}`}
            {...(trier && { type: "button" as const, "aria-label": theme.nom, "aria-pressed": tri === theme.id, disabled: !compte, onClick: () => trier(theme.id) })}
          >
            <PartDuTheme vide={!compte} />
            <b>{nomCourt(theme)}</b>
            {!compte && (
              <span className="pips" aria-label={`${nombres[i]} ${nombres[i] > 1 ? "réponses" : "réponse"}`}>
                {Array.from({ length: REPONSES_PAR_PART }, (_, k) => (
                  <i key={k} className={k < nombres[i] ? "on" : undefined}></i>
                ))}
              </span>
            )}
          </Tete>
        );
      })}
      <Tete className="g-tot" {...(trier && { type: "button" as const, "aria-pressed": tri === null, onClick: () => trier(null) })}>
        Tout
      </Tete>
    </div>
  );
}

/**
 * Change la colonne qui range les lignes ; les lignes glissent à leur nouvelle place quand le navigateur sait le faire, et
 * que l'appareil ne demande pas de réduire les animations.
 */
function changerDeTri(changer: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return changer();
  document.startViewTransition(() => flushSync(changer));
}

/** Avant 10 réponses : ce qu'il manque, une jauge, « Répondre » vers la prochaine question, et un aperçu estompé, sans nom ni pourcentage. */
function ClassementAVenir({ comptees, themes, nombres }: { comptees: number; themes: Theme[]; nombres: number[] }) {
  const manque = SEUIL_DES_RESULTATS - comptees;
  return (
    <section className="sec" aria-labelledby="h-rank">
      <div className="sec-h">
        <h2 id="h-rank">Ton classement</h2>
        <p>à partir de {SEUIL_DES_RESULTATS} réponses</p>
      </div>
      <div className="empty">
        <div className="empty-body">
          <h3 className="empty-t">
            Encore {manque} {manque > 1 ? "réponses" : "réponse"} pour voir ton classement
          </h3>
          <div className="gauge-row">
            <p className="gauge-n">
              <b>
                {comptees}/{SEUIL_DES_RESULTATS}
              </b>
              <span>réponses</span>
            </p>
            <div className="gauge" role="img" aria-label={`${comptees} ${comptees > 1 ? "réponses" : "réponse"} sur ${SEUIL_DES_RESULTATS}`}>
              {Array.from({ length: SEUIL_DES_RESULTATS }, (_, i) => (
                <i key={i} className={i < comptees ? "on" : undefined}></i>
              ))}
            </div>
          </div>
          {/* La maquette met une jauge dans ce bouton : l'auteur n'en veut pas (25 octobre 2026), le compteur du menu suffit. */}
          <Link className="btn-link" href="/questionnaire">
            Répondre
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
            </svg>
          </Link>
        </div>
        <p className="ghost-k" aria-hidden="true">
          Il ressemblera à ça
        </p>
        <div className="grille ghosts" aria-hidden="true" style={{ "--n": themes.length } as React.CSSProperties}>
          <TeteDeLaGrille themes={themes} nombres={nombres} />
          <ol>
            {APERCU.map((largeur, rang) => (
              <li key={rang} className="g-ligne">
                <span className="g-qui">
                  <span className="cand-n">{rang + 1}</span>
                  <span className="pawn pawn--paper">?</span>
                  <span className="cand-name">
                    <i className="skel" style={{ "--w": `${largeur}%` } as React.CSSProperties}></i>
                  </span>
                </span>
                {themes.map((theme) => (
                  <span key={theme.id} className={`g-case ${theme.classe}`}>
                    <i className="g-part" style={{ "--p": 0 } as React.CSSProperties}></i>
                  </span>
                ))}
                <span className="cand-pc">
                  –<small> %</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/**
 * « Ton classement », en grille : les candidats, du plus proche au plus éloigné des réponses de l'appareil, à partir de
 * 10 réponses comptées, et une colonne par thème. Chaque case est une part de camembert remplie de la proximité avec le
 * candidat sur les seules questions de ce thème, calculée comme le classement, dès que le thème a 3 réponses ; au bout
 * de la ligne, la proximité sur toutes les questions. Une case vide : pas de position connue sur ce thème. Toucher la tête
 * d'une colonne range les lignes par elle, du plus proche au plus éloigné, à égalité dans l'ordre alphabétique, comme le
 * classement ; les candidats sans position sur ce thème passent à la fin. « Tout » revient au classement.
 */
export function Classement({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const [tri, setTri] = useState<Tri>(null);
  const parTheme = reponsesParTheme(questions, reponses);
  const nombres = themes.map((theme) => parTheme[theme.id] ?? 0);
  const comptees = reponsesComptees(questions, reponses);
  if (comptees < SEUIL_DES_RESULTATS) return <ClassementAVenir comptees={comptees} themes={themes} nombres={nombres} />;

  const global = classement(questions, reponses, candidats);
  // Le classement de chaque thème qui a ses 3 réponses, sur ses seules questions ; null pour les autres.
  const classementsDesThemes = themes.map((theme, i) =>
    nombres[i] >= REPONSES_PAR_PART
      ? classement(
          questions.filter((q) => q.theme === theme.id),
          reponses,
          candidats,
        )
      : null,
  );
  const parThemeEtCandidat = classementsDesThemes.map((lignes) => lignes && new Map(lignes.map((l) => [l.candidat.id, l.pourcentage])));
  // Un thème qui range les lignes mais perd ses 3 réponses (« Recommencer », un import) rend la main au classement.
  const colonne = themes.findIndex((theme) => theme.id === tri);
  const ordre = colonne >= 0 && classementsDesThemes[colonne] ? classementsDesThemes[colonne] : global;
  const parCandidat = new Map(global.map((ligne) => [ligne.candidat.id, ligne.pourcentage]));
  const lignes = ordre.map(({ candidat }) => ({ candidat, pourcentage: parCandidat.get(candidat.id) ?? null }));
  return (
    <section className="sec" aria-labelledby="h-rank">
      <div className="sec-h">
        <h2 id="h-rank">Ton classement</h2>
        <p>proximité, en %</p>
      </div>
      <div className="grille" style={{ "--n": themes.length } as React.CSSProperties}>
        <TeteDeLaGrille themes={themes} nombres={nombres} tri={ordre === global ? null : tri} trier={(nouveau) => changerDeTri(() => setTri(nouveau))} />
        <ol>
          {lignes.map(({ candidat, pourcentage }, rang) => (
            <li key={candidat.id} style={{ viewTransitionName: `ligne-${candidat.id}` }}>
              <Link className="g-ligne" href={`/candidat/${candidat.id}`}>
                <span className="g-qui">
                  <span className="cand-n">{rang + 1}</span>
                  <Pion candidat={candidat} clair />
                  <span className="cand-name one">{candidat.nom}</span>
                </span>
                {themes.map((theme, i) => {
                  const p = parThemeEtCandidat[i]?.get(candidat.id) ?? null;
                  return (
                    <span key={theme.id} className={`g-case ${theme.classe}${theme.id === tri && ordre !== global ? " trie" : ""}`}>
                      {p === null ? (
                        <i className="g-rien"></i>
                      ) : (
                        <i className="g-part" role="img" aria-label={`${theme.nom} : ${p} %`} style={{ "--p": p } as React.CSSProperties}></i>
                      )}
                    </span>
                  );
                })}
                <span className="cand-pc">
                  {pourcentage === null ? (
                    "—"
                  ) : (
                    <>
                      {pourcentage}
                      <small> %</small>
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
