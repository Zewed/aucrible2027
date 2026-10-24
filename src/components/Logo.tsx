/** Le logo d'Au crible 2027 : le camembert des onze thèmes (maquettes, en-tête). Décoratif : le nom le suit en texte. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="99" style={{ fill: "#fff" }} />
      <path className="wedge on" d="M100.00 10.00A90 90 0 0 1 148.66 24.29L112.98 79.81A24 24 0 0 0 100.00 76.00Z" style={{ fill: "var(--eco)", animationDelay: "0.25s" }} />
      <path className="wedge on" d="M148.66 24.29A90 90 0 0 1 181.87 62.61L121.83 90.03A24 24 0 0 0 112.98 79.81Z" style={{ fill: "var(--trav)", animationDelay: "0.34s" }} />
      <path className="wedge on" d="M181.87 62.61A90 90 0 0 1 189.08 112.81L123.76 103.42A24 24 0 0 0 121.83 90.03Z" style={{ fill: "var(--ecol)", animationDelay: "0.43s" }} />
      <path className="wedge on" d="M189.08 112.81A90 90 0 0 1 168.02 158.94L118.14 115.72A24 24 0 0 0 123.76 103.42Z" style={{ fill: "var(--immi)", animationDelay: "0.52s" }} />
      <path className="wedge on" d="M168.02 158.94A90 90 0 0 1 125.36 186.35L106.76 123.03A24 24 0 0 0 118.14 115.72Z" style={{ fill: "var(--secu)", animationDelay: "0.61s" }} />
      <path className="wedge on" d="M125.36 186.35A90 90 0 0 1 74.64 186.35L93.24 123.03A24 24 0 0 0 106.76 123.03Z" style={{ fill: "var(--sante)", animationDelay: "0.70s" }} />
      <path className="wedge on" d="M74.64 186.35A90 90 0 0 1 31.98 158.94L81.86 115.72A24 24 0 0 0 93.24 123.03Z" style={{ fill: "var(--educ)", animationDelay: "0.79s" }} />
      <path className="wedge on" d="M31.98 158.94A90 90 0 0 1 10.92 112.81L76.24 103.42A24 24 0 0 0 81.86 115.72Z" style={{ fill: "var(--loge)", animationDelay: "0.88s" }} />
      <path className="wedge on" d="M10.92 112.81A90 90 0 0 1 18.13 62.61L78.17 90.03A24 24 0 0 0 76.24 103.42Z" style={{ fill: "var(--euro)", animationDelay: "0.97s" }} />
      <path className="wedge on" d="M18.13 62.61A90 90 0 0 1 51.34 24.29L87.02 79.81A24 24 0 0 0 78.17 90.03Z" style={{ fill: "var(--inst)", animationDelay: "1.06s" }} />
      <path className="wedge on" d="M51.34 24.29A90 90 0 0 1 100.00 10.00L100.00 76.00A24 24 0 0 0 87.02 79.81Z" style={{ fill: "var(--soc)", animationDelay: "1.15s" }} />
      <line x1="100.00" y1="78.00" x2="100.00" y2="8.00" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="111.89" y1="81.49" x2="149.74" y2="22.60" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="120.01" y1="90.86" x2="183.69" y2="61.78" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="121.78" y1="103.13" x2="191.06" y2="113.09" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="116.63" y1="114.41" x2="169.53" y2="160.25" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="106.20" y1="121.11" x2="125.92" y2="188.27" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="93.80" y1="121.11" x2="74.08" y2="188.27" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="83.37" y1="114.41" x2="30.47" y2="160.25" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="78.22" y1="103.13" x2="8.94" y2="113.09" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="79.99" y1="90.86" x2="16.31" y2="61.78" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1="88.11" y1="81.49" x2="50.26" y2="22.60" style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />
      <circle cx="100" cy="100" r="24" style={{ fill: "#fff" }} />
    </svg>
  );
}
