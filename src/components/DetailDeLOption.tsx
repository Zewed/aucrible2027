import type { Argument, Option, Source } from "@/lib/contenu";

export const nomDeLaSource = (source: Source) => `${source.organisme}, ${source.document ? `${source.document} ` : ""}${source.annee}`;

/** Les espaces insécables du français : « : », « % »… restent collés au mot d'avant, et les tranches d'un nombre (« 1 800 ») ensemble. */
export const insecable = (texte: string) =>
  texte
    .replace(/ ([?!:;»%€])/g, " $1")
    .replace(/« /g, "« ")
    .replace(/(\d) (?=\d{3}\b)/g, "$1 ");

function Arguments({ titre, liste }: { titre: string; liste: Argument[] }) {
  return (
    <section>
      <h4 className="mq-argument"><b>{titre}</b></h4>
      <ul>
        {liste.map((argument) => (
          <li key={argument.texte}>
            {insecable(argument.texte)}
            {argument.source && <cite>Chiffre : {nomDeLaSource(argument.source)}</cite>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * La fenêtre ouverte par le bouton « plus » d'une carte : tout ce qu'on sait de l'option, sourcé. Tant que l'option n'a
 * pas de `detail`, elle reprend en grand ce que dit la carte : son argument de chaque camp, sans chiffrage.
 */
export function DetailDeLOption({ option, lettre }: { option: Option; lettre: string }) {
  const id = `detail-${option.id}`;
  const { chiffrage, defenseurs, critiques } = option.detail ?? { chiffrage: undefined, defenseurs: [{ texte: option.defenseurs }], critiques: [{ texte: option.critiques }] };
  return (
    <div className="mq-detail" id={id} popover="auto" role="dialog" aria-labelledby={`${id}-titre`}>
      <div className="mq-haut">
        <span className="mq-lettre" aria-hidden="true">{lettre}</span>
        <h3 className="mq-titre" id={`${id}-titre`}>{option.libelle}</h3>
        <button type="button" className="mq-fermer" popoverTarget={id} popoverTargetAction="hide" aria-label="Fermer">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="mq-implique">{insecable(option.implique)}</p>
      {chiffrage && (
        <p className="mq-chiffrage">
          {insecable(chiffrage.texte)}
          <cite>Source : {nomDeLaSource(chiffrage.source)}</cite>
        </p>
      )}
      <div className="mq-detail-colonnes">
        <Arguments titre="Ce qu'en disent ses défenseurs" liste={defenseurs} />
        <Arguments titre="Ce que lui reprochent ses critiques" liste={critiques} />
      </div>
    </div>
  );
}
