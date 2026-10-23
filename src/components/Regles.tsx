/** Le dé à cinq points de l'en-tête des pages de règles (maquettes/methode.html, maquettes/a-propos.html). */
export function DeDesRegles() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="3" width="38" height="36" rx="9" style={{ fill: "var(--muted)" }} />
      <rect x="1" y="1" width="38" height="35" rx="9" style={{ fill: "var(--ink)" }} />
      {[
        [12, 10],
        [28, 10],
        [20, 18.5],
        [12, 27],
        [28, 27],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" style={{ fill: "var(--chalk)" }} />
      ))}
    </svg>
  );
}

const COULEURS = ["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"];

/** Les onze rayures des thèmes, sous le haut des pages de règles (décoratives). */
export function RayuresDesThemes() {
  return (
    <div className="stripes11" aria-hidden="true">
      {COULEURS.map((c) => (
        <i key={c} style={{ background: `var(--${c})` }}></i>
      ))}
    </div>
  );
}
