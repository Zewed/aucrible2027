import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";

const CANDIDATS = [
  "Marine Le Pen", "Jean-Luc Mélenchon", "Édouard Philippe", "Raphaël Glucksmann",
  "Bruno Retailleau", "David Lisnard", "Gabriel Attal", "Éric Zemmour",
  "Marine Tondelier", "Fabien Roussel", "Nicolas Dupont-Aignan", "François Ruffin",
  "Nathalie Arthaud",
];

/** Choisir une option comme le fait l'électeur : en touchant sa carte. */
async function choisir(page: Page, libelle: string) {
  await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).click();
  await expect(page.getByRole("radio", { name: libelle })).toBeChecked();
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-23T09:00:00+02:00"));
});

test("le 23 octobre 2026, l'accueil affiche la question du jour, ses cinq options et aucun nom de candidat", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
  for (const option of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    await expect(page.getByRole("radio", { name: option })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
  for (const nom of CANDIDATS) {
    await expect(page.getByText(nom)).toHaveCount(0);
  }
});

test("valider « À la carte, avec un système à points » révèle Nicolas Dupont-Aignan et Édouard Philippe", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "À la carte, avec un système à points");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  await expect(page).toHaveURL(/\/revelation$/);
  const defenseurs = page.getByRole("list", { name: "Ils défendent ton option" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(2);
  await expect(defenseurs.getByText("Nicolas Dupont-Aignan")).toBeVisible();
  await expect(defenseurs.getByText("Édouard Philippe")).toBeVisible();
});

test("valider « 62 ans » révèle Marine Le Pen, Marine Tondelier et Raphaël Glucksmann", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "62 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  const defenseurs = page.getByRole("list", { name: "Ils défendent ton option" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(3);
  for (const nom of ["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]) {
    await expect(defenseurs.getByText(nom)).toBeVisible();
  }
  await expect(defenseurs.getByText("Édouard Philippe")).toHaveCount(0);
});

test("la carte de la question n° 24 affiche la puce « Travail & retraites » au-dessus de la question", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const puce = carte.getByText("Travail & retraites", { exact: true });
  await expect(puce).toBeVisible();
  const question = carte.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const [hautPuce, hautQuestion] = await Promise.all([puce.boundingBox(), question.boundingBox()]);
  expect(hautPuce!.y).toBeLessThan(hautQuestion!.y);
});

test("une question d'un autre thème affiche son propre thème dans la puce", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
  await page.goto("/");
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  await expect(carte.getByText("Écologie & énergie", { exact: true })).toBeVisible();
  await expect(carte.getByText("Travail & retraites", { exact: true })).toHaveCount(0);
});

const ORANGE = "rgb(255, 122, 26)";
const VERT = "rgb(34, 184, 90)";
const fond = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);

test("la question n° 24 (Travail & retraites) s'affiche en orange", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(ORANGE);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(ORANGE);
});

test("une question d'Écologie & énergie s'affiche en vert, et les 11 thèmes ont 11 couleurs", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
  await page.goto("/");
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(VERT);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(VERT);

  const couleurs = await page.evaluate(() =>
    ["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"].map((t) => {
      const el = document.createElement("div");
      el.className = `theme-${t}`;
      el.style.background = "var(--theme)";
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    }),
  );
  expect(new Set(couleurs).size).toBe(11);
});

test.describe("numéro et date de la question", () => {
  test("sur téléphone, le bandeau affiche seulement « Question n° 24 »", async ({ page }) => {
    await page.goto("/");
    const numero = page.getByText(/^Question n° 24/);
    await expect(numero).toBeVisible();
    await expect(numero).toHaveText("Question n° 24", { useInnerText: true });
  });

  test("le samedi 24 octobre 2026, la nouvelle question affiche « Question n° 25 »", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
    await page.goto("/");
    await expect(page.getByText(/^Question n° 25/)).toBeVisible();
  });

  test("après validation, la révélation garde « Question n° 24 »", async ({ page }) => {
    await page.goto("/");
    await choisir(page, "62 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24", { useInnerText: true });
  });
});

test.describe("numéro et date de la question, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("le vendredi 23 octobre 2026, le bandeau affiche « Question n° 24 · vendredi 23 octobre »", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24 · vendredi 23 octobre", { useInnerText: true });
  });

  test("la révélation affiche « Question n° 24 · 23 octobre »", async ({ page }) => {
    await page.goto("/");
    await choisir(page, "62 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24 · 23 octobre", { useInnerText: true });
  });
});

test("la fiche n° 24 affiche sous « Le contexte » exactement trois phrases, lisibles en entier", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const contexte = carte.getByRole("region", { name: "Le contexte" });
  const phrases = contexte.getByRole("paragraph");
  await expect(phrases).toHaveCount(3);
  await expect(phrases.first()).toHaveText(
    "La réforme de 2023 a commencé à repousser l'âge légal de 62 à 64 ans, puis sa hausse a été suspendue fin 2025.",
  );
  for (const phrase of await phrases.all()) {
    await expect(phrase).toBeVisible();
    expect(await phrase.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  }
});

test("la fiche n° 24 affiche sous « 3 chiffres clés » 1,7, 14 % et 62 ans, chacun avec sa légende", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const chiffres = carte.getByRole("region", { name: "3 chiffres clés" }).getByRole("listitem");
  await expect(chiffres).toHaveCount(3);
  const attendus = [
    ["1,7", "cotisant pour 1 retraité"],
    ["14 %", "du PIB : environ ce que représentent les retraites"],
    ["62 ans", "et 10 mois : l'âge moyen de départ"],
  ];
  for (const [i, [chiffre, legende]] of attendus.entries()) {
    await expect(chiffres.nth(i).getByText(chiffre, { exact: true })).toBeVisible();
    await expect(chiffres.nth(i).getByText(legende, { exact: true })).toBeVisible();
  }
});

/** Les chiffres clés de la fiche du jour, chacun vérifié visible et entier, sans rien de coupé. */
async function chiffresEntiers(page: Page, question: string) {
  const carte = page.getByRole("article", { name: question });
  const chiffres = carte.getByRole("region", { name: /chiffres clés$/ }).getByRole("listitem");
  const boiteCarte = (await carte.boundingBox())!;
  for (const chiffre of await chiffres.all()) {
    await expect(chiffre).toBeVisible();
    const boite = (await chiffre.boundingBox())!;
    expect(boite.x).toBeGreaterThanOrEqual(boiteCarte.x);
    expect(boite.x + boite.width).toBeLessThanOrEqual(boiteCarte.x + boiteCarte.width);
    // Coupé : un texte qui déborde de sa boîte en largeur, ou qu'une boîte rogne en hauteur.
    const coupe = await chiffre.evaluate((el) =>
      [el, ...el.querySelectorAll("*")].some(
        (e) =>
          e.scrollWidth > e.clientWidth + 1 ||
          (getComputedStyle(e).overflowY !== "visible" && e.scrollHeight > e.clientHeight + 1),
      ),
    );
    expect(coupe).toBe(false);
  }
  return chiffres;
}

test.describe("une fiche affiche autant de chiffres clés qu'elle en a", () => {
  test("le 24 octobre, la fiche à deux chiffres clés en affiche deux", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "2 chiffres clés" })).toBeVisible();
    await expect(await chiffresEntiers(page, "Faut-il sortir du nucléaire ?")).toHaveCount(2);
  });

  test("le 25 octobre, la fiche à quatre chiffres clés en affiche quatre", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-25T09:00:00+01:00"));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "4 chiffres clés" })).toBeVisible();
    await expect(await chiffresEntiers(page, "Faut-il réguler l'installation des médecins ?")).toHaveCount(4);
  });
});

test.describe("une fiche affiche autant de chiffres clés qu'elle en a, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("la fiche à quatre chiffres clés les affiche tous les quatre, entiers", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-25T09:00:00+01:00"));
    await page.goto("/");
    await expect(await chiffresEntiers(page, "Faut-il réguler l'installation des médecins ?")).toHaveCount(4);
  });
});

test("sur la fiche n° 24, chaque chiffre clé est suivi de sa source datée", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const chiffres = carte.getByRole("region", { name: "3 chiffres clés" }).getByRole("listitem");
  const attendus = [
    ["1,7", "Source : COR, rapport 2025"],
    ["14 %", "Source : COR, 2025"],
    ["62 ans", "Source : DREES, 2025"],
  ];
  for (const [i, [chiffre, source]] of attendus.entries()) {
    const nombre = chiffres.nth(i).getByText(chiffre, { exact: true });
    const ligne = chiffres.nth(i).getByText(source, { exact: true });
    await expect(ligne).toBeVisible();
    const [haut, bas] = await Promise.all([nombre.boundingBox(), ligne.boundingBox()]);
    expect(bas!.y).toBeGreaterThan(haut!.y);
  }
});

test("sur aucune fiche un chiffre clé n'apparaît sans son organisme ni son année", async ({ page }) => {
  const fiches = [
    ["2026-10-23T09:00:00+02:00", "À quel âge devrait-on pouvoir partir à la retraite ?"],
    ["2026-10-24T09:00:00+02:00", "Faut-il sortir du nucléaire ?"],
    ["2026-10-25T09:00:00+01:00", "Faut-il réguler l'installation des médecins ?"],
  ];
  for (const [jour, question] of fiches) {
    await page.clock.setFixedTime(new Date(jour));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    // Entiers : une source rognée par les points de suspension perdrait son année.
    for (const chiffre of await (await chiffresEntiers(page, question)).all()) {
      await expect(chiffre.getByText(/^Source : \S.*, (.+ )?(19|20)\d{2}$/)).toBeVisible();
    }
  }
});

/** Les lettres des cartes réponse, dans l'ordre où l'électeur les voit. */
async function lettresDesOptions(page: Page) {
  const options = page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio");
  await expect(options.first()).toBeAttached();
  const lettres = [];
  for (const option of await options.all()) {
    const lettre = option.locator("xpath=..").locator(".opt-letter");
    await expect(lettre).toBeVisible();
    lettres.push(await lettre.innerText());
  }
  return lettres;
}

test("les cinq cartes réponse de la question n° 24 portent, dans l'ordre, les lettres A à E", async ({ page }) => {
  await page.goto("/");
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D", "E"]);
  const options = page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio");
  await expect(options.nth(0)).toHaveAccessibleName("A 60 ans");
  await expect(options.nth(4)).toHaveAccessibleName("E À la carte, avec un système à points");
});

test("une fiche à trois options affiche A, B, C seulement ; une fiche à quatre, A à D", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T09:00:00+01:00"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faut-il réguler l'installation des médecins ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C"]);

  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faut-il sortir du nucléaire ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D"]);
});

test("chaque option de la question n° 24 dit, sous son titre et sans la toucher, ce qu'elle implique", async ({ page }) => {
  await page.goto("/");
  const options = page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio");
  await expect(options).toHaveCount(5);
  const attendues: Record<number, string> = {
    0: "Retour à l'âge légal d'avant 2010, financé par de nouvelles cotisations.",
    4: "Chacun part quand il veut ; la pension dépend des points acquis.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const carte = option.locator("xpath=..");
    const titre = carte.locator(".opt-title");
    const implication = carte.locator(".opt-impl");
    await expect(implication).toBeVisible();
    await expect(implication).not.toBeEmpty();
    if (attendues[rang]) await expect(implication).toHaveText(attendues[rang]);
    const [haut, bas] = await Promise.all([titre.boundingBox(), implication.boundingBox()]);
    expect(bas!.y).toBeGreaterThan(haut!.y);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

/** Les noms des candidats, leurs noms de famille et leurs partis, lus dans le contenu, plus les sigles courants. */
const NOMS_ET_PARTIS: string[] = (parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string; parti: string }[])
  .flatMap((c) => [c.nom, c.nom.split(" ").slice(1).join(" "), c.parti]);
const SIGLES = /\b(RN|LFI|LR|PS|PCF|EELV|LO|NPA|DLF|UDI|MoDem)\b/;
const nomsOuPartisDans = (texte: string) => [
  ...NOMS_ET_PARTIS.filter((n) => texte.includes(n)),
  ...(texte.match(SIGLES) ?? []).slice(0, 1),
];

test("chaque option de la question n° 24 dit ce qu'en disent ses défenseurs, lisible sans rien choisir, sans nom ni parti", async ({ page }) => {
  await page.goto("/");
  const options = page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio");
  await expect(options).toHaveCount(5);
  const attendus: Record<number, string> = {
    0: "Deux ans de retraite en bonne santé en plus, d'abord pour ceux qui ont commencé tôt.",
    3: "On vit plus longtemps : travailler un peu plus protège le niveau des pensions.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const bloc = option.locator("xpath=..").getByText("Ce qu'en disent ses défenseurs", { exact: true }).locator("xpath=..");
    await expect(bloc).toBeVisible();
    const argument = (await bloc.innerText()).replace("Ce qu'en disent ses défenseurs", "").trim();
    expect(argument.length).toBeGreaterThan(10);
    if (attendus[rang]) expect(argument).toBe(attendus[rang]);
    expect(nomsOuPartisDans(argument)).toEqual([]);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

/** Le texte de chaque bloc d'arguments portant ce titre, sur la fiche de chaque jour de démonstration. */
async function argumentsDesFiches(page: Page, titre: string) {
  const textes: string[] = [];
  for (const jour of ["2026-10-23T09:00:00+02:00", "2026-10-24T09:00:00+02:00", "2026-10-25T09:00:00+01:00"]) {
    await page.clock.setFixedTime(new Date(jour));
    await page.goto("/");
    const options = page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio");
    await expect(options.first()).toBeAttached();
    for (const option of await options.all()) {
      const bloc = option.locator("xpath=..").getByText(titre, { exact: true }).locator("xpath=..");
      await expect(bloc).toBeVisible();
      textes.push((await bloc.innerText()).replace(titre, "").trim());
    }
  }
  return textes;
}

test("sur aucune fiche, ce qu'en disent les défenseurs ne nomme un candidat ou un parti", async ({ page }) => {
  const textes = await argumentsDesFiches(page, "Ce qu'en disent ses défenseurs");
  expect(textes).toHaveLength(5 + 4 + 3);
  for (const texte of textes) expect(nomsOuPartisDans(texte), texte).toEqual([]);
});
