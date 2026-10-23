import { joursEntre } from "@/lib/date";
import type { Silence as PeriodeDeSilence } from "@/lib/silence";

/** Le camembert de la carte face cachée, repris tel quel de maquettes/silence.html (décoratif). */
const CAMEMBERT = "<svg class=\"back-pie\" viewBox=\"0 0 200 200\"><path d=\"M100.00 8.00A92 92 0 0 1 149.74 22.60L114.06 78.13A26 26 0 0 0 100.00 74.00Z\" style=\"fill:var(--table-2)\"/><path d=\"M149.74 22.60A92 92 0 0 1 183.69 61.78L123.65 89.20A26 26 0 0 0 114.06 78.13Z\" style=\"fill:var(--table-2)\"/><path d=\"M183.69 61.78A92 92 0 0 1 191.06 113.09L125.74 103.70A26 26 0 0 0 123.65 89.20Z\" style=\"fill:var(--table-2)\"/><path d=\"M191.06 113.09A92 92 0 0 1 169.53 160.25L119.65 117.03A26 26 0 0 0 125.74 103.70Z\" style=\"fill:var(--table-2)\"/><path d=\"M169.53 160.25A92 92 0 0 1 125.92 188.27L107.33 124.95A26 26 0 0 0 119.65 117.03Z\" style=\"fill:var(--table-2)\"/><path d=\"M125.92 188.27A92 92 0 0 1 74.08 188.27L92.67 124.95A26 26 0 0 0 107.33 124.95Z\" style=\"fill:var(--table-2)\"/><path d=\"M74.08 188.27A92 92 0 0 1 30.47 160.25L80.35 117.03A26 26 0 0 0 92.67 124.95Z\" style=\"fill:var(--table-2)\"/><path d=\"M30.47 160.25A92 92 0 0 1 8.94 113.09L74.26 103.70A26 26 0 0 0 80.35 117.03Z\" style=\"fill:var(--table-2)\"/><path d=\"M8.94 113.09A92 92 0 0 1 16.31 61.78L76.35 89.20A26 26 0 0 0 74.26 103.70Z\" style=\"fill:var(--table-2)\"/><path d=\"M16.31 61.78A92 92 0 0 1 50.26 22.60L85.94 78.13A26 26 0 0 0 76.35 89.20Z\" style=\"fill:var(--table-2)\"/><path d=\"M50.26 22.60A92 92 0 0 1 100.00 8.00L100.00 74.00A26 26 0 0 0 85.94 78.13Z\" style=\"fill:var(--table-2)\"/><line x1=\"100.00\" y1=\"72.00\" x2=\"100.00\" y2=\"6.00\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"115.14\" y1=\"76.44\" x2=\"150.82\" y2=\"20.92\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"125.47\" y1=\"88.37\" x2=\"185.51\" y2=\"60.95\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"127.72\" y1=\"103.98\" x2=\"193.04\" y2=\"113.38\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"121.16\" y1=\"118.34\" x2=\"171.04\" y2=\"161.56\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"107.89\" y1=\"126.87\" x2=\"126.48\" y2=\"190.19\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"92.11\" y1=\"126.87\" x2=\"73.52\" y2=\"190.19\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"78.84\" y1=\"118.34\" x2=\"28.96\" y2=\"161.56\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"72.28\" y1=\"103.98\" x2=\"6.96\" y2=\"113.38\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"74.53\" y1=\"88.37\" x2=\"14.49\" y2=\"60.95\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/><line x1=\"84.86\" y1=\"76.44\" x2=\"49.18\" y2=\"20.92\" style=\"stroke:var(--table-3);stroke-width:5;stroke-linecap:round\"/></svg>";

/** L'icône « pause » de la maquette. */
function Pause() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.5" y="4" width="4.5" height="16" rx="1.6" style={{ fill: "currentColor" }} />
      <rect x="14" y="4" width="4.5" height="16" rx="1.6" style={{ fill: "currentColor" }} />
    </svg>
  );
}

const dateDuTour = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${date}T12:00:00Z`),
  );

/** Le dé à quatre points de la note sur la série, repris de maquettes/silence.html. */
function DeQuatre() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="9" style={{ fill: "currentColor" }} />
      <circle cx="12" cy="12" r="3.6" style={{ fill: "var(--table)" }} />
      <circle cx="28" cy="28" r="3.6" style={{ fill: "var(--table)" }} />
      <circle cx="12" cy="28" r="3.6" style={{ fill: "var(--table)" }} />
      <circle cx="28" cy="12" r="3.6" style={{ fill: "var(--table)" }} />
    </svg>
  );
}

/** L'accueil pendant le silence électoral : la carte du jour reste face cachée, la série attend. */
export function Silence({ jour, silence, serie }: { jour: string; silence: PeriodeDeSilence; serie: number }) {
  const jours = joursEntre(jour, silence.fin);
  return (
    <main className="calm">
      <div className="calm-card">
        <div className="deck">
          <div className="qcard back" aria-hidden="true">
            <span dangerouslySetInnerHTML={{ __html: CAMEMBERT }} />
            <span className="corner tl">
              <Pause />
            </span>
            <span className="corner br">
              <Pause />
            </span>
            {/* Le jour du vote lui-même n'est pas dessiné par la maquette. */}
            <p className="back-j">{jours > 0 ? <>J<span>-</span>{jours}</> : "Jour J"}</p>
            <p className="back-k">avant le {silence.tour}</p>
            <p className="back-d">{dateDuTour(silence.fin)}</p>
          </div>
        </div>
      </div>

      <section className="calm-text" aria-labelledby="titre-silence">
        <p className="kicker">
          <Pause />
          Aujourd&apos;hui, la carte reste face cachée
        </p>
        <h1 id="titre-silence">
          Silence électoral<span>.</span>
        </h1>
        <p className="lead">La loi interdit toute nouvelle publication la veille et le jour du vote.</p>

        {serie > 0 && (
          <ul className="notes">
            <li>
              <DeQuatre />
              <span>{`Ta série de ${serie} ${serie > 1 ? "jours" : "jour"} est en pause, elle n'est pas perdue.`}</span>
            </li>
          </ul>
        )}
      </section>
    </main>
  );
}
