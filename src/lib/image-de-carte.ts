import { getFontEmbedCSS, toBlob } from "html-to-image";

/** La largeur de l'image partagée, en pixels : une story de 1080 × 1920. */
const LARGEUR = 1080;

/** Les polices de la page, intégrées une fois, en ligne : l'image se dessine ensuite sans réseau. */
export async function lirePolices(element: HTMLElement): Promise<string> {
  await document.fonts.ready;
  return getFontEmbedCSS(element).catch(() => "");
}

/** L'image PNG 9:16 d'une carte, dessinée sur l'appareil : rien ne part sur le réseau. */
export async function dessinerLaCarte(carte: HTMLElement, polices: string, nom: string): Promise<File> {
  const largeur = carte.getBoundingClientRect().width;
  const image = await toBlob(carte, { pixelRatio: LARGEUR / largeur, fontEmbedCSS: polices, cacheBust: false });
  if (!image) throw new Error("La carte n'a pas pu être dessinée.");
  return new File([image], nom, { type: "image/png" });
}

/** Enregistre un fichier sur l'appareil, par un lien de téléchargement. */
export function enregistrer(fichier: File) {
  const adresse = URL.createObjectURL(fichier);
  const lien = Object.assign(document.createElement("a"), { href: adresse, download: fichier.name });
  lien.click();
  setTimeout(() => URL.revokeObjectURL(adresse), 1000);
}
