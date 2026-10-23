import Link from "next/link";
import { CompteARebours } from "@/components/CompteARebours";

/** Le bandeau des pages secondaires : le retour (à la question du jour par défaut), et le compte à rebours. */
export function BandeauRetour({ jour, vers = "/", libelle = "Question du jour" }: { jour: string; vers?: string; libelle?: string }) {
  return (
    <div className="strip">
      <Link className="back" href={vers}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19 12H6M11 6l-6 6 6 6"
            style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
          />
        </svg>
        {libelle}
      </Link>
      <CompteARebours jour={jour} />
    </div>
  );
}
