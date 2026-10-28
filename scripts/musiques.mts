/**
 * `pnpm musiques` : télécharge la musique de chaque thème (content/musiques.yaml) dans videos/son/<thème>.mp3, puis
 * mesure son tempo et son premier temps fort, à recopier dans content/musiques.yaml pour que le reportage coupe sur
 * le temps. Un fichier déjà là n'est pas retéléchargé.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const racine = path.resolve(import.meta.dirname, "..");
const dossier = path.join(racine, "videos", "son");
const musiques: Record<string, { titre: string; mp3: string }> = parse(readFileSync(path.join(racine, "content", "musiques.yaml"), "utf8"));

const FREQ = 22050;
/** Échantillons par point de l'enveloppe : environ 11,6 ms. */
const PAS = 256;
const POINTS_PAR_SECONDE = FREQ / PAS;

/** Le son en mono à 22 050 Hz, converti par afconvert (macOS), en nombres de −1 à 1. */
function lire(mp3: string) {
  const wav = mp3.replace(/\.mp3$/, ".wav");
  execFileSync("afconvert", ["-f", "WAVE", "-d", `LEI16@${FREQ}`, "-c", "1", mp3, wav]);
  const brut = readFileSync(wav);
  rmSync(wav);
  // Les blocs du fichier WAV, jusqu'à celui des données.
  let i = 12;
  while (brut.toString("ascii", i, i + 4) !== "data") i += 8 + brut.readUInt32LE(i + 4);
  const debut = i + 8;
  const n = Math.floor(Math.min(brut.readUInt32LE(i + 4), brut.length - debut) / 2);
  const son = new Float32Array(n);
  for (let k = 0; k < n; k++) son[k] = brut.readInt16LE(debut + 2 * k) / 32768;
  return son;
}

/** Où le son attaque : la hausse de l'énergie (en log) d'un point au suivant, zéro quand elle baisse. */
function attaques(son: Float32Array) {
  const n = Math.floor(son.length / PAS);
  const e = new Float32Array(n);
  let avant = 0;
  for (let k = 0; k < n; k++) {
    let somme = 0;
    for (let j = k * PAS; j < (k + 1) * PAS; j++) somme += son[j] * son[j];
    const niveau = Math.log(1e-9 + somme / PAS);
    e[k] = k ? Math.max(0, niveau - avant) : 0;
    avant = niveau;
  }
  return e;
}

/** La force d'une grille de temps (période et départ en points) : la somme des attaques qui tombent dessus. */
function force(e: Float32Array, periode: number, depart: number) {
  let somme = 0;
  let compte = 0;
  for (let t = depart; t < e.length; t += periode) {
    somme += e[Math.round(t)];
    compte++;
  }
  return somme / compte;
}

/** La meilleure grille pour un tempo : son départ et sa force. */
function grille(e: Float32Array, bpm: number) {
  const periode = (60 / bpm) * POINTS_PAR_SECONDE;
  let meilleur = { depart: 0, force: -1 };
  for (let depart = 0; depart < periode; depart += 0.25) {
    const f = force(e, periode, depart);
    if (f > meilleur.force) meilleur = { depart, force: f };
  }
  return meilleur;
}

/**
 * Le tempo : celui, entre 70 et 160, dont la grille attrape le plus d'attaques, avec une légère préférence autour de
 * 100 pour ne pas confondre un tempo et son double ; puis affiné au centième.
 */
function tempo(e: Float32Array) {
  const preference = (bpm: number) => Math.exp(-0.5 * (Math.log2(bpm / 100) / 0.8) ** 2);
  let meilleur = { bpm: 0, score: -1 };
  for (let bpm = 70; bpm <= 160; bpm += 0.5) {
    const score = grille(e, bpm).force * preference(bpm);
    if (score > meilleur.score) meilleur = { bpm, score };
  }
  let fin = { bpm: meilleur.bpm, ...grille(e, meilleur.bpm) };
  for (let bpm = meilleur.bpm - 0.5; bpm <= meilleur.bpm + 0.5; bpm += 0.02) {
    const g = grille(e, bpm);
    if (g.force > fin.force) fin = { bpm, ...g };
  }
  // La netteté du temps : la force de la grille rapportée à l'attaque moyenne (1 : pas de temps net).
  const moyenne = e.reduce((s, v) => s + v, 0) / e.length;
  return { bpm: Math.round(fin.bpm * 100) / 100, premierTemps: Math.round((fin.depart / POINTS_PAR_SECONDE) * 1000) / 1000, nettete: fin.force / moyenne };
}

mkdirSync(dossier, { recursive: true });
for (const [theme, musique] of Object.entries(musiques)) {
  const fichier = path.join(dossier, `${theme}.mp3`);
  if (!existsSync(fichier)) {
    const reponse = await fetch(musique.mp3);
    if (!reponse.ok) throw new Error(`${theme} : Pixabay a répondu ${reponse.status}`);
    writeFileSync(fichier, Buffer.from(await reponse.arrayBuffer()));
  }
  const mesure = tempo(attaques(lire(fichier)));
  console.log(`${theme}: tempo ${mesure.bpm}, premierTemps ${mesure.premierTemps}  (netteté ${mesure.nettete.toFixed(1)}, ${musique.titre})`);
}
