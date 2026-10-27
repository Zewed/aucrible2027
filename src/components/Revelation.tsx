"use client";

import Link from "next/link";
import { Camembert } from "@/components/Camembert";
import { CompteARebours } from "@/components/CompteARebours";
import { NumeroQuestion } from "@/components/NumeroQuestion";
import { Pion } from "@/components/Pion";
import type { Candidat, Position, Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { melanger } from "@/lib/melange";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { REPONSES_PAR_PART, reponsesParTheme } from "@/lib/proximite";
import { lireOrdre, prochaineQuestionDuTheme } from "@/lib/ordre";
import { messageDuPalier } from "@/lib/paliers";
import { JE_NE_SAIS_PAS, lesReponses, lireReponses } from "@/lib/reponses";

/** Une ligne de l'alignement : un titre, puis les candidats concernés ; rien quand il n'y en a aucun. */
function LigneAlignement({
  id,
  titre,
  candidats,
  principale = false,
  loin = false,
}: {
  id: string;
  titre: string;
  candidats: Candidat[];
  principale?: boolean;
  loin?: boolean;
}) {
  if (candidats.length === 0) return null;
  const Titre = principale ? "h2" : "h3";
  return (
    <div className="align-row">
      <Titre id={id} className={principale ? "align-h" : "align-h align-h--s"}>
        {titre}
      </Titre>
      <ul className={loin ? "who far" : "who"} aria-labelledby={id}>
        {candidats.map((c) => (
          <li key={c.id}>
            <Link href={`/candidat/${c.id}`}>
              <Pion candidat={c} clair={loin} />
              {c.nom}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ statut }: { statut: Position["statut"] }) {
  return statut === "officielle" ? (
    <span className="badge badge--off">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8.5l3.2 3.2L13 4.8" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
      </svg>{" "}
      position officielle
    </span>
  ) : (
    <span className="badge badge--ded">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 9c2-4 4-4 6 0s4 4 6 0" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" }} />
      </svg>{" "}
      position déduite
    </span>
  );
}

const nombreDeCandidats = (n: number) => `${n} candidat${n > 1 ? "s" : ""}`;

/**
 * La révélation de la question `numero`, puis la suite : « Question suivante », la prochaine sans réponse dans l'ordre
 * de l'appareil, tant qu'il en reste (SPEC.md, « Boucle principale », 25 octobre 2026). Venue d'un thème choisi dans la
 * jauge (`filtre`), elle reste dans ce thème tant qu'il a des questions sans réponse.
 */
export function Revelation({
  questions,
  candidats,
  themes,
  numero,
  filtre = null,
}: {
  questions: Question[];
  candidats: Candidat[];
  themes: Theme[];
  numero: number;
  filtre?: string | null;
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = lesReponses(useCoteClient(lireReponses));
  const numeros = questions.map((q) => q.numero);
  const ordre = useCoteClient(() => lireOrdre(numeros));
  const question = questions.find((q) => q.numero === numero);
  const reponse = question && reponses[question.numero];
  const theme = question && themes.find((t) => t.id === question.theme);
  if (!reponse || !question || !theme) return null;
  const suite = ordre ? prochaineQuestionDuTheme(ordre, questions, Object.keys(reponses).map(Number), filtre) : undefined;
  const suivante = suite?.numero;
  const palier = reponse.rang ? messageDuPalier(reponse.rang) : null;

  // Un candidat retiré au jour de la réponse ou avant n'est plus révélé. Rouvrir une révélation répondue avant
  // son retrait le montre encore : ce cas reste à trancher.
  const enLice = candidats.filter((c) => !c.retrait || c.retrait.date > reponse.jour);
  const rangChoisi = question.options.findIndex((o) => o.id === reponse.option);
  const choisie = question.options[rangChoisi];
  const importance = reponse.importance;
  // Cette réponse est la 3e de son thème : la part est gagnée. Les autres cas restent à trancher.
  const parTheme = reponsesParTheme(questions, reponses);
  const partGagnee = reponse.option !== JE_NE_SAIS_PAS && parTheme[theme.id] === REPONSES_PAR_PART;
  const gagnes = themes.filter((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART);
  const couleurDe = (t: Theme) => `var(--${t.classe.replace("theme-", "")})`;
  const alignes = melanger(
    enLice.filter((c) => question.positions[c.id]?.option === reponse.option),
    reponse.graine - 1,
  );
  const voisins = choisie ? [rangChoisi - 1, rangChoisi + 1].filter((r) => r >= 0 && r < question.options.length) : [];
  const rangDe = (c: Candidat) => question.options.findIndex((o) => o.id === question.positions[c.id]?.option);
  const proches = melanger(
    enLice.filter((c) => voisins.includes(rangDe(c))),
    reponse.graine - 2,
  );
  // Les cartes les plus éloignées de la réponse ; une carte voisine est « proche », jamais « opposée ».
  const distances = question.options.map((_, r) => Math.abs(r - rangChoisi));
  const distanceMax = Math.max(...distances);
  const eloignees = choisie && distanceMax > 1 ? distances.flatMap((d, r) => (d === distanceMax ? [r] : [])) : [];
  const opposes = melanger(
    enLice.filter((c) => eloignees.includes(rangDe(c))),
    reponse.graine - 3,
  );
  const inconnus = melanger(
    enLice.filter((c) => !question.positions[c.id]),
    reponse.graine + question.options.length,
  );

  return (
    <>
      <div className="strip">
        {jour && <CompteARebours jour={jour} />}
        <NumeroQuestion numero={question.numero} />
      </div>
      <main className={`res rev ${theme.classe}`}>
        <header className="rev-hero">
          <h1>La révélation</h1>
        </header>
        {choisie && (
          <section
            className="mine-card"
            aria-label={`Ta réponse : ${lettreOption(rangChoisi)} · ${choisie.libelle}${importance ? `. Importance ×${importance}` : ""}`}
          >
            <p className="mine-k" aria-hidden="true">Ta réponse</p>
            <div className="mine-main" aria-hidden="true">
              <span className="mine-letter">{lettreOption(rangChoisi)}</span>
              <span className="mine-title">{choisie.libelle}</span>
            </div>
            {importance && (
              <p className="mine-imp" aria-hidden="true">
                <span className="chips">
                  {[1, 2, 3].map((n) => (
                    <i key={n} className={n > importance ? "off" : undefined}></i>
                  ))}
                </span>
                Importance ×{importance}
              </p>
            )}
          </section>
        )}
        {/* Sans personne d'aligné, de proche ni d'opposé (aucune position sourcée), le bloc n'a rien à montrer. */}
        {choisie && alignes.length + proches.length + opposes.length > 0 && (
          <section className="align" aria-label="Alignement sur ce sujet">
            <LigneAlignement id="alignes" titre="Sur ce sujet, tu es aligné·e avec" candidats={alignes} principale />
            <LigneAlignement id="proches" titre="et proche de" candidats={proches} />
            <LigneAlignement id="opposes" titre="opposé·e à" candidats={opposes} loin />
          </section>
        )}
        {(partGagnee || palier) && (
          <section className="reward" aria-label="Ta récompense">
            {palier && reponse.rang && (
              <div className="stake palier" role="region" aria-label="Palier">
                <span className="confetti" aria-hidden="true">
                  {themes.map((t, i) => (
                    <i key={t.id} style={{ left: `${4 + i * 8.7}%`, background: couleurDe(t), animationDelay: `${(i % 4) * 0.12}s` }}></i>
                  ))}
                </span>
                <span className="palier-n">{reponse.rang}</span>
                <span>
                  <span className="stake-k">{reponse.rang} réponses</span>
                  <span className="stake-t" style={{ display: "block" }}>
                    {palier}
                  </span>
                </span>
              </div>
            )}
            {partGagnee && gagnes.length === themes.length && (
              <div className="stake palier" role="region" aria-label="Camembert complet">
                <span className="confetti" aria-hidden="true">
                  {themes.map((t, i) => (
                    <i key={t.id} style={{ left: `${4 + i * 8.7}%`, background: couleurDe(t), animationDelay: `${(i % 4) * 0.12}s` }}></i>
                  ))}
                </span>
                <Camembert couleurs={themes.map((t) => couleurDe(t))} description={`Camembert complet : ${themes.length} parts sur ${themes.length}`} />
                <span>
                  <span className="stake-k">{themes.length} parts sur {themes.length}</span>
                  <span className="stake-t" style={{ display: "block" }}>
                    Camembert complet&nbsp;!
                  </span>
                </span>
              </div>
            )}
            {partGagnee && gagnes.length < themes.length && (
              <div className="stake win" role="region" aria-label="Ton camembert">
                <Camembert
                  couleurs={themes.map((t) => (gagnes.includes(t) ? couleurDe(t) : null))}
                  nouvelle={themes.indexOf(theme)}
                  description={`Camembert : ${gagnes.length} parts sur ${themes.length}, la part ${theme.nom} vient d'être gagnée`}
                />
                <span>
                  <span className="stake-k">Ton camembert</span>
                  <span className="stake-t" style={{ display: "block" }}>
                    +1 réponse en {theme.nom}&nbsp;: {REPONSES_PAR_PART}/{REPONSES_PAR_PART}, la part est gagnée&nbsp;!
                  </span>
                  <span className="seg" aria-hidden="true">
                    {Array.from({ length: REPONSES_PAR_PART }, (_, i) => (
                      <i key={i} className={i === REPONSES_PAR_PART - 1 ? "fresh" : undefined}></i>
                    ))}
                  </span>
                  <span className="stake-s" style={{ display: "block" }}>
                    Ton camembert passe à{" "}
                    <u>
                      {gagnes.length} parts sur {themes.length}
                    </u>
                    .
                  </span>
                </span>
              </div>
            )}
          </section>
        )}
        <section className="rev-list" aria-labelledby="qui-defend-quoi">
          <div className="sec-h">
            <h2 id="qui-defend-quoi">Qui défend quoi</h2>
            <p>ordre mélangé</p>
          </div>
          <div className="ropts">
            {question.options.map((option, rang) => {
              const leurs = melanger(
                enLice.filter((c) => question.positions[c.id]?.option === option.id),
                reponse.graine + rang,
              );
              const sienne = option.id === reponse.option;
              return (
                <article
                  key={option.id}
                  className={sienne ? "ropt mine" : "ropt"}
                  style={{ "--i": rang } as React.CSSProperties}
                  aria-labelledby={`o-${option.id}`}
                >
                  <header className="ropt-head">
                    <span className="ropt-letter" aria-hidden="true">{lettreOption(rang)}</span>
                    <h3 className="ropt-title" id={`o-${option.id}`}>
                      <span className="sr">Option {lettreOption(rang)} : </span>
                      {option.libelle}
                    </h3>
                    <p className="ropt-meta">
                      <span>{nombreDeCandidats(leurs.length)}</span>
                      {sienne && <span className="ropt-tag">Ta carte</span>}
                    </p>
                  </header>
                  <ul className="defs">
                    {leurs.map((c) => (
                      <li key={c.id} className="def">
                        <Pion candidat={c} />
                        <Link className="def-name one" href={`/candidat/${c.id}`}>
                        {c.nom}
                      </Link>
                        <span className="def-src">
                          <span className="def-doc one">{question.positions[c.id].source}</span>
                          <Badge statut={question.positions[c.id].statut} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
            {inconnus.length > 0 && (
              <article
                className="ropt unknown"
                style={{ "--i": question.options.length } as React.CSSProperties}
                aria-labelledby="o-inconnue"
              >
                <header className="ropt-head">
                  <span className="ropt-letter" aria-hidden="true">?</span>
                  <h3 className="ropt-title" id="o-inconnue">Position inconnue</h3>
                  <p className="ropt-meta">
                    <span>{nombreDeCandidats(inconnus.length)}</span>
                  </p>
                </header>
                <ul className="defs">
                  {inconnus.map((c) => (
                    <li key={c.id} className="def">
                      <Pion candidat={c} clair />
                      <Link className="def-name one" href={`/candidat/${c.id}`}>
                        {c.nom}
                      </Link>
                      <span className="def-src">
                        <span className="def-doc one">Pas de source à ce jour</span>
                        <span className="badge badge--none">position inconnue</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        </section>
        <div className="rev-actions">
          {suivante !== undefined ? (
            <>
              <Link className="go" href={suite?.dansLeTheme ? `/?theme=${filtre}` : "/"}>
                Question suivante{" "}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
                </svg>
              </Link>
              <Link className="act second" href="/resultats">
                Voir mes résultats
              </Link>
            </>
          ) : (
            <Link className="go" href="/resultats">
              Voir mes résultats{" "}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
              </svg>
            </Link>
          )}
        </div>
        {question.pourAllerPlusLoin && question.pourAllerPlusLoin.length > 0 && (
          <section className="more" aria-labelledby="pour-aller-plus-loin">
            <h2 className="label" id="pour-aller-plus-loin">
              <i></i>Pour aller plus loin
            </h2>
            <ul>
              {question.pourAllerPlusLoin.map((lien) => (
                <li key={lien.url}>
                  <a href={lien.url} rel="noopener" target="_blank">
                    <span className="one">{lien.titre}</span>
                    <span className="sr"> (nouvel onglet)</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M8 16L17 7M9 7h8v8"
                        style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
                      />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* « Que veut dire « position déduite » ? », l'autre lien de la maquette, n'est porté par aucun ticket. */}
        <footer className="res-foot">
          <nav>
            <Link href={`/signaler?question=${question.numero}`}>Signaler une erreur</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
