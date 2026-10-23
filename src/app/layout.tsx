import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Au crible 2027",
  description: "Une question par jour pour savoir de quels candidats tu es proche, chiffres et sources à l'appui.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
