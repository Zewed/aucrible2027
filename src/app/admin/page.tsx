import type { Metadata } from "next";
import { Suspense } from "react";
import { lAuteur } from "@/lib/auteur";
import { dateCourte } from "@/lib/date";
import { lireLesSignalements, TYPES } from "@/lib/signalement";
import { lireLesVisites } from "@/lib/visites";
import { seDeconnecter } from "./actions";
import "./admin.css";

// L'espace de l'auteur : privé, aucune page publique n'y mène, et les moteurs de recherche n'ont pas à le trouver.
export const metadata: Metadata = { title: "Espace de l'auteur — Au crible 2027", robots: { index: false, follow: false } };

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

/** Qui est là : l'auteur voit sa boîte et ses visites ; tout autre compte, ou personne, voit seulement la connexion. */
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
