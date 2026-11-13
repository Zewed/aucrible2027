import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pion } from "@/components/Pion";
import { analyserLesCandidats, analyserLesSessions, partDesJeNeSaisPas, quand, sessionCourte, sessionsParJour } from "@/lib/analyse";
import { estLAuteur } from "@/lib/auteur";
import { dateCourte } from "@/lib/date";
import { lireAujourdhui, lireCandidatsEnLice, lireQuestionsDuCalcul, lireQuestionsPubliees } from "@/lib/publication";
import { JE_NE_SAIS_PAS } from "@/lib/reponses";
import { lireLesTotaux, lireToutesLesReponses } from "@/lib/reponses-partagees";
import { lireLesSignalements, TYPES } from "@/lib/signalement";
import { lireLesVisites } from "@/lib/visites";
import { seDeconnecter } from "./actions";
import { AppareilDeLAuteur } from "./AppareilDeLAuteur";
import { Connexion } from "./Connexion";
import { ChoixDesSessions } from "./SupprimerDesSessions";
import "./admin.css";

// L'espace de l'auteur : privé, aucune page publique n'y mène, et les moteurs de recherche n'ont pas à le trouver.
export const metadata: Metadata = { title: "Espace de l'auteur — Décrypte 2027", robots: { index: false, follow: false } };

const LE_JOUR_ET_L_HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });

/** Les seuils du filtre des sessions : toutes, ou seulement celles qui ont au moins 3 ou 10 réponses comptées. */
const SEUILS = [0, 3, 10] as const;

/** Un nombre et son mot, accordé : « 1 session », « 12 sessions ». */
const compte = (n: number, mot: string) => `${n.toLocaleString("fr-FR")} ${mot}${n > 1 ? "s" : ""}`;
/** Un nombre à la française, avec au plus `decimales` chiffres après la virgule. */
const nombre = (n: number, decimales = 0) => n.toLocaleString("fr-FR", { maximumFractionDigits: decimales });

/** La source jointe : un lien cliquable seulement s'il est en http(s), sinon le texte tel quel, jamais exécuté. */
function Source({ source }: { source: string }) {
  const lien = /^https?:\/\//i.test(source);
  return (
    <p className="sg-source">
      Source :{" "}
      {lien ? (
        <a href={source} target="_blank" rel="noopener noreferrer nofollow">
          {source}
        </a>
      ) : (
        source
      )}
    </p>
  );
}

/**
 * La boîte privée : chaque signalement reçu, avec sa question, son type, son texte, sa source, l'e-mail pour répondre
 * (effacé après trois mois) et son heure d'arrivée.
 */
async function Boite() {
  const signalements = await lireLesSignalements();
  return (
    <section className="sec an-bloc" aria-labelledby="h-sg">
      <div className="sec-h">
        <h2 id="h-sg">Signalements</h2>
        <p>{signalements.length > 1 ? `${signalements.length} reçus` : signalements.length === 1 ? "1 reçu" : "aucun"}</p>
      </div>
      {signalements.length === 0 && <p className="sg-vide">Aucun signalement pour l&apos;instant.</p>}
      <ul className="sg-list">
        {signalements.map((s) => (
          <li key={s.id}>
            <article className="sg" aria-label={`Signalement sur la question n° ${s.question}`}>
              <p className="sg-meta">
                <span className="sg-q">Question n° {s.question}</span>
                <span className="sg-type">{TYPES.find((t) => t.valeur === s.type)?.nom ?? s.type}</span>
                <time dateTime={s.recuLe.toISOString()}>{LE_JOUR_ET_L_HEURE.format(s.recuLe)}</time>
              </p>
              <p className="sg-texte">{s.texte}</p>
              {s.source && <Source source={s.source} />}
              {s.email && (
                <p className="sg-email">
                  Répondre à : <a href={`mailto:${s.email}`}>{s.email}</a>
                </p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Le tableau de bord : les chiffres clés, les candidats sur toutes les sessions retenues, les visites jour par jour, chaque
 * session (cliquable, vers ses réponses), puis la répartition des options, question par question.
 */
async function TableauDeBord({ seuil }: { seuil: number }) {
  const [visites, reponses, totaux, publiees, duCalcul, candidats, aujourdhui] = await Promise.all([
    lireLesVisites(),
    lireToutesLesReponses(),
    lireLesTotaux(),
    lireQuestionsPubliees(),
    lireQuestionsDuCalcul(),
    lireCandidatsEnLice(),
    lireAujourdhui(),
  ]);
  const toutes = analyserLesSessions(reponses, duCalcul, candidats);
  const retenues = toutes.filter((s) => s.comptees >= Math.max(seuil, 1));
  const parCandidat = analyserLesCandidats(retenues, candidats);
  const plusEnTete = Math.max(1, ...parCandidat.map((c) => c.enTete));
  const parJour = sessionsParJour(toutes);
  const duJour = visites.find((v) => v.jour === aujourdhui);
  const plusDeVisites = Math.max(1, ...visites.map((v) => v.nombre));

  return (
    <>
      <section className="an-kpis" aria-label="Chiffres clés">
        <p>
          <b>{nombre(duJour?.nombre ?? 0)}</b>
          <span>visites aujourd&apos;hui</span>
        </p>
        <p>
          <b>{nombre(parJour.get(aujourdhui)?.sessions ?? 0)}</b>
          <span>sessions aujourd&apos;hui</span>
        </p>
        <p>
          <b>{nombre(totaux.sessions)}</b>
          <span>sessions en tout</span>
        </p>
        <p>
          <b>{nombre(totaux.reponses)}</b>
          <span>réponses en tout</span>
        </p>
        <p>
          <b>{nombre(totaux.sessions ? totaux.reponses / totaux.sessions : 0, 1)}</b>
          <span>réponses par session</span>
        </p>
        <p>
          <b>{nombre(partDesJeNeSaisPas(toutes))} %</b>
          <span>« Je ne sais pas »</span>
        </p>
      </section>

      <div className="an-grille">
        <section className="sec an-bloc" aria-labelledby="h-ca">
          <div className="sec-h">
            <h2 id="h-ca">Candidats</h2>
            <p>sur {compte(retenues.length, "session")}</p>
          </div>
          <nav className="an-filtre" aria-label="Sessions retenues">
            {SEUILS.map((s) => (
              <Link key={s} href={s ? `/admin?min=${s}` : "/admin"} aria-current={s === seuil ? "true" : undefined} scroll={false}>
                {s ? `${s} réponses et +` : "Toutes"}
              </Link>
            ))}
          </nav>
          {retenues.length === 0 ? (
            <p className="sg-vide">Aucune session pour l&apos;instant.</p>
          ) : (
            <table className="an-table an-cands">
              <thead>
                <tr>
                  <th scope="col">Candidat</th>
                  <th scope="col" colSpan={2}>
                    Proximité moyenne
                  </th>
                  <th scope="col" colSpan={2}>
                    En tête
                  </th>
                </tr>
              </thead>
              <tbody>
                {parCandidat.map(({ candidat, moyenne, enTete }) => (
                  <tr key={candidat.id}>
                    <th scope="row">
                      <span className="an-qui">
                        <Pion candidat={candidat} clair />
                        <span>
                          <b>{candidat.nom}</b>
                          <small>{candidat.parti}</small>
                        </span>
                      </span>
                    </th>
                    <td className="an-barre">
                      <i style={{ width: `${moyenne ?? 0}%` }}></i>
                    </td>
                    <td className="an-pc">{moyenne == null ? "—" : `${nombre(moyenne)} %`}</td>
                    <td className="an-barre an-barre--tete">
                      <i style={{ width: `${(100 * enTete) / plusEnTete}%` }}></i>
                    </td>
                    <td className="an-tete">{nombre(enTete)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="sec an-bloc" aria-labelledby="h-vi">
          <div className="sec-h">
            <h2 id="h-vi">Visites</h2>
            <p>appareils par jour</p>
          </div>
          {visites.length === 0 ? (
            <p className="sg-vide">Aucune visite pour l&apos;instant.</p>
          ) : (
            <table className="an-table an-visites">
              <thead>
                <tr>
                  <th scope="col">Jour</th>
                  <th scope="col">Appareils</th>
                  <th scope="col" aria-label="Part du jour le plus fort"></th>
                  <th scope="col">Tél.</th>
                  <th scope="col">Ordi</th>
                  <th scope="col">Tablette</th>
                  <th scope="col">Sessions</th>
                  <th scope="col">Robots</th>
                </tr>
              </thead>
              <tbody>
                {visites.map((v) => (
                  <tr key={v.jour}>
                    <th scope="row">{dateCourte(v.jour)}</th>
                    <td className="an-pc">{v.nombre}</td>
                    <td className="an-barre">
                      <i style={{ width: `${(100 * v.nombre) / plusDeVisites}%` }}></i>
                    </td>
                    <td>{v.telephone}</td>
                    <td>{v.ordinateur}</td>
                    <td>{v.tablette}</td>
                    <td>{parJour.get(v.jour)?.sessions ?? 0}</td>
                    <td className="an-robot">{v.robot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="sec an-bloc" aria-labelledby="h-se">
        <div className="sec-h">
          <h2 id="h-se">Sessions</h2>
          <p>{compte(retenues.length, "session")}</p>
        </div>
        {retenues.length === 0 ? (
          <p className="sg-vide">Aucune session pour l&apos;instant.</p>
        ) : (
          <ChoixDesSessions>
            <table className="an-table an-sessions">
              <thead>
                <tr>
                  <th scope="col">
                    <input className="an-case" type="checkbox" name="toutes" aria-label="Choisir toutes les sessions" />
                    Session
                  </th>
                  <th scope="col">Début</th>
                  <th scope="col">Réponses</th>
                  <th scope="col">En tête</th>
                  <th scope="col">Deuxième</th>
                  <th scope="col">Troisième</th>
                </tr>
              </thead>
              <tbody>
                {retenues.slice(0, 300).map((s) => (
                  <tr key={s.session}>
                    <th scope="row">
                      <input className="an-case" type="checkbox" name="session" value={s.session} aria-label={`Choisir la session ${sessionCourte(s.session)}`} />
                      <Link href={`/admin/session/${s.session}`} prefetch={false}>
                        {sessionCourte(s.session)}
                      </Link>
                    </th>
                    <td>{quand(s)}</td>
                    <td>{s.reponses.length}</td>
                    {s.classement.slice(0, 3).map(({ candidat, pourcentage }) => (
                      <td key={candidat.id}>
                        {pourcentage == null ? (
                          "—"
                        ) : (
                          <span className="an-qui an-qui--petit">
                            <Pion candidat={candidat} clair />
                            <span>
                              {candidat.nom} <b>{pourcentage} %</b>
                            </span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ChoixDesSessions>
        )}
      </section>

      <section className="sec an-bloc" aria-labelledby="h-rp">
        <div className="sec-h">
          <h2 id="h-rp">Réponses</h2>
          <p>
            {compte(totaux.reponses, "réponse")} · {compte(totaux.sessions, "session")}
          </p>
        </div>
        {totaux.reponses === 0 ? (
          <p className="sg-vide">Aucune réponse pour l&apos;instant.</p>
        ) : (
          <ul className="rp-list">
            {totaux.parQuestion.map(({ question: numero, options }) => {
              const question = publiees.find((q) => q.numero === numero);
              const total = options.reduce((somme, o) => somme + o.nombre, 0);
              const libelle = (option: string) =>
                option === JE_NE_SAIS_PAS ? "Je ne sais pas" : `${option}. ${question?.options.find((o) => o.id === option)?.libelle ?? ""}`;
              return (
                <li key={numero} className="sg" aria-label={`Question n° ${numero}`}>
                  <p className="sg-meta">
                    <span className="sg-q">Question n° {numero}</span>
                    <span>{question?.titreCourt ?? question?.question}</span>
                    <span>{compte(total, "réponse")}</span>
                  </p>
                  <table className="rp-table">
                    <tbody>
                      {options.map(({ option, nombre: n }) => (
                        <tr key={option}>
                          <th scope="row">{libelle(option)}</th>
                          <td className="rp-barre">
                            <i style={{ width: `${(100 * n) / total}%` }}></i>
                          </td>
                          <td>{Math.round((100 * n) / total)} %</td>
                          <td className="rp-n">{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

/** Qui est là : l'auteur voit son tableau de bord et sa boîte ; sans le mot de passe, seulement la connexion. */
async function Espace({ recherche }: { recherche: Promise<{ min?: string | string[] }> }) {
  if (!(await estLAuteur())) return <Connexion />;
  const min = Number((await recherche).min);
  const seuil = SEUILS.includes(min as (typeof SEUILS)[number]) ? min : 0;
  return (
    <>
      <AppareilDeLAuteur />
      <div className="adm-qui">
        {/* Un fichier à télécharger, pas une page : un lien ordinaire, sans préchargement. */}
        <a className="rp-csv" href="/admin/reponses" download>
          Télécharger le CSV
        </a>
        <form action={seDeconnecter}>
          <button type="submit">Se déconnecter</button>
        </form>
      </div>
      <TableauDeBord seuil={seuil} />
      <Boite />
    </>
  );
}

/**
 * L'espace de l'auteur (SPEC.md, « Décisions de l'auteur du 25/10/2026 », amendé le 12/11/2026) : on y entre avec le
 * mot de passe de l'auteur. Le tableau de bord des réponses et des visites, puis la boîte privée des signalements.
 */
export default function PageAdmin({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="adm">
      <section className="adm-head">
        <h1>
          Espace de l&apos;auteur<span>.</span>
        </h1>
      </section>
      <Suspense>
        <Espace recherche={searchParams} />
      </Suspense>
    </main>
  );
}
