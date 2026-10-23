/** Le dé de la maquette : six pastilles, quelle que soit la série. */
export function De() {
  const pastille = { fill: "var(--trav)" };
  return (
    <svg className="die" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="3" width="38" height="36" rx="9" style={{ fill: "#B9B1DE" }} />
      <rect x="1" y="1" width="38" height="35" rx="9" style={{ fill: "#fff" }} />
      {[9.5, 18.5, 27.5].flatMap((cy) => [12, 28].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" style={pastille} />))}
    </svg>
  );
}
