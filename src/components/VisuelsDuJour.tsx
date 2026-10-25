import Link from "next/link";

/** « Carrousel et story / Vidéo » : les deux pages des visuels du jour (maquettes/carrousel.html et video.html). */
export function VisuelsDuJour({ page }: { page: "carrousel" | "video" }) {
  return (
    <nav className="switch" aria-label="Visuels du jour">
      <Link href="/carrousel" aria-current={page === "carrousel" ? "page" : undefined}>
        Carrousel et story
      </Link>
      <Link href="/video" aria-current={page === "video" ? "page" : undefined}>
        Vidéo
      </Link>
    </nav>
  );
}
