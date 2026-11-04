import type { Argument, Option, Source } from "@/lib/contenu";

const nomDeLaSource = (source: Source) => `${source.organisme}, ${source.document ? `${source.document} ` : ""}${source.annee}`;

function Arguments({ titre, liste }: { titre: string; liste: Argument[] }) {
  return (
    <section>
      <h4 className="mq-argument"><b>{titre}</b></h4>
      <ul>
        {liste.map((argument) => (
          <li key={argument.texte}>
            {argument.texte}
            {argument.source && <cite>Chiffre : {nomDeLaSource(argument.source)}</cite>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** La fenêtre ouverte par le bouton « plus » d'une carte : tout ce qu'on sait de l'option, sourcé. */
export function DetailDeLOption({ option, lettre }: { option: Option; lettre: string }) {
  if (!option.detail) return null;
  const id = `detail-${option.id}`;
  const { chiffrage, defenseurs, critiques } = option.detail;
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
      <p className="mq-implique">{option.implique}</p>
      <p className="mq-chiffrage">
        {chiffrage.texte}
        <cite>Source : {nomDeLaSource(chiffrage.source)}</cite>
      </p>
      <div className="mq-detail-colonnes">
        <Arguments titre="Ce qu'en disent ses défenseurs" liste={defenseurs} />
        <Arguments titre="Ce que lui reprochent ses critiques" liste={critiques} />
      </div>
    </div>
  );
}
