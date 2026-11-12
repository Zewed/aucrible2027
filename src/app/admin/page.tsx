import type { Metadata } from "next";
import { Suspense } from "react";
import { lAuteur } from "@/lib/auteur";
import { dateCourte } from "@/lib/date";
import { lireQuestionsPubliees } from "@/lib/publication";
import { JE_NE_SAIS_PAS } from "@/lib/reponses";
import { lireLesTotaux } from "@/lib/reponses-partagees";
import { lireLesSignalements, TYPES } from "@/lib/signalement";
import { lireLesVisites } from "@/lib/visites";
import { seDeconnecter } from "./actions";
import "./admin.css";

// L'espace de l'auteur : privé, aucune page publique n'y mène, et les moteurs de recherche n'ont pas à le trouver.
export const metadata: Metadata = { title: "Espace de l'auteur — Décrypte 2027", robots: { index: false, follow: false } };

const LE_JOUR_ET_L_HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });

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

/** « Se connecter avec GitHub » ; après un compte GitHub qui n'est pas celui de l'auteur, le refus au-dessus. */
function Connexion({ refuse }: { refuse: boolean }) {
  return (
    <div className="adm-login">
      {refuse && <p className="adm-refus theme-sante">Ce compte GitHub n&apos;a pas accès.</p>}
      {/* Une route qui part vers GitHub, pas une page : un lien ordinaire, sans préchargement. */}
      <a className="go" href="/admin/connexion">
        Se connecter avec GitHub
      </a>
    </div>
  );
}

/**
 * La boîte privée : chaque signalement reçu, avec sa question, son type, son texte, sa source, l'e-mail pour répondre
 * (effacé après trois mois) et son heure d'arrivée.
 */
async function Boite() {
  const signalements = await lireLesSignalements();
  return (
    <section className="sec" aria-labelledby="h-sg">
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

/** Les visites par jour (SPEC.md, « Données » : anonymes), les plus récentes d'abord : un appareil compte une fois par jour. */
async function Visites() {
  const visites = await lireLesVisites();
  return (
    <section className="sec" aria-labelledby="h-vi">
      <div className="sec-h">
        <h2 id="h-vi">Visites</h2>
        <p>appareils par jour</p>
      </div>
      {visites.length === 0 ? (
        <p className="sg-vide">Aucune visite pour l&apos;instant.</p>
      ) : (
        <table className="vi-table">
          <tbody>
            {visites.map(({ jour, nombre }) => (
              <tr key={jour}>
                <th scope="row">{dateCourte(jour)}</th>
                <td>{nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** Un nombre et son mot, accordé : « 1 session », « 12 sessions ». */
const compte = (n: number, mot: string) => `${n.toLocaleString("fr-FR")} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Les réponses partagées (lib/reponses-partagees.ts) : combien de réponses et de sessions, puis, question par question,
 * la part de chaque option. L'export CSV donne chaque réponse avec sa session, pour les croiser ailleurs.
 */
async function Reponses() {
  const [totaux, questions] = await Promise.all([lireLesTotaux(), lireQuestionsPubliees()]);
  return (
    <section className="sec" aria-labelledby="h-rp">
      <div className="sec-h">
        <h2 id="h-rp">Réponses</h2>
        <p>
          {compte(totaux.reponses, "réponse")} · {compte(totaux.sessions, "session")}
        </p>
      </div>
      {totaux.reponses === 0 ? (
        <p className="sg-vide">Aucune réponse pour l&apos;instant.</p>
      ) : (
        <>
          {/* Un fichier à télécharger, pas une page : un lien ordinaire, sans préchargement. */}
          <a className="rp-csv" href="/admin/reponses" download>
            Télécharger le CSV
          </a>
          <ul className="rp-list">
            {totaux.parQuestion.map(({ question: numero, options }) => {
              const question = questions.find((q) => q.numero === numero);
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
                      {options.map(({ option, nombre }) => (
                        <tr key={option}>
                          <th scope="row">{libelle(option)}</th>
                          <td className="rp-barre">
                            <i style={{ width: `${(100 * nombre) / total}%` }}></i>
                          </td>
                          <td>{Math.round((100 * nombre) / total)} %</td>
                          <td className="rp-n">{nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Qui est là : l'auteur voit sa boîte, ses visites et les réponses partagées ; tout autre compte, ou personne, voit seulement la connexion. */
async function Espace() {
  const auteur = await lAuteur();
  if (!auteur || auteur === "refuse") return <Connexion refuse={auteur === "refuse"} />;
  return (
    <>
      <form className="adm-qui" action={seDeconnecter}>
        <span>Connecté : {auteur.login}</span>
        <button type="submit">Se déconnecter</button>
      </form>
      <Boite />
      <Visites />
      <Reponses />
    </>
  );
}

/**
 * L'espace de l'auteur (SPEC.md, « Décisions de l'auteur du 25/10/2026 ») : on y entre avec son compte GitHub, et seul
 * celui de l'auteur passe. Pour l'instant, la boîte privée des signalements ; les outils de l'auteur viendront ici.
 */
export default function PageAdmin() {
  return (
    <main className="adm">
      <section className="adm-head">
        <h1>
          Espace de l&apos;auteur<span>.</span>
        </h1>
      </section>
      <Suspense>
        <Espace />
      </Suspense>
    </main>
  );
}
