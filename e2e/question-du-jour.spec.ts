import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";

const CANDIDATS = [
  "Marine Le Pen", "Jean-Luc Mélenchon", "Édouard Philippe", "Raphaël Glucksmann",
  "Bruno Retailleau", "David Lisnard", "Gabriel Attal", "Éric Zemmour",
  "Marine Tondelier", "Fabien Roussel", "Nicolas Dupont-Aignan", "François Ruffin",
  "Nathalie Arthaud",
];

/** Les options de la fiche, de A à la dernière, sans la carte « Je ne sais pas ». */
const optionsDeLaFiche = (page: Page) =>
  page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio", { name: /^[A-E] / });

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
  const options = optionsDeLaFiche(page);
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
  const options = optionsDeLaFiche(page);
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
  const options = optionsDeLaFiche(page);
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
  const options = optionsDeLaFiche(page);
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
    const options = optionsDeLaFiche(page);
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

test("chaque option de la question n° 24 dit ce que lui reprochent ses critiques, lisible sans rien choisir", async ({ page }) => {
  await page.goto("/");
  const options = optionsDeLaFiche(page);
  await expect(options).toHaveCount(5);
  const attendus: Record<number, string> = {
    0: "Un coût élevé, qui pèserait sur les salaires ou sur les entreprises.",
    4: "La valeur du point peut baisser : la pension devient moins prévisible.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const bloc = option.locator("xpath=..").getByText("Ce que lui reprochent ses critiques", { exact: true }).locator("xpath=..");
    await expect(bloc).toBeVisible();
    const critique = (await bloc.innerText()).replace("Ce que lui reprochent ses critiques", "").trim();
    expect(critique.length).toBeGreaterThan(10);
    if (attendus[rang]) expect(critique).toBe(attendus[rang]);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

test("sur aucune fiche, ce que reprochent les critiques ne nomme un candidat ou un parti", async ({ page }) => {
  const textes = await argumentsDesFiches(page, "Ce que lui reprochent ses critiques");
  expect(textes).toHaveLength(5 + 4 + 3);
  for (const texte of textes) expect(nomsOuPartisDans(texte), texte).toEqual([]);
});

test.describe("les arguments des options, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("les titres « Ce qu'en disent ses défenseurs » et « Ce que lui reprochent ses critiques » se lisent en entier", async ({ page }) => {
    await page.goto("/");
    for (const titre of ["Ce qu'en disent ses défenseurs", "Ce que lui reprochent ses critiques"]) {
      const titres = page.getByRole("radiogroup", { name: "Les options" }).getByText(titre, { exact: true });
      await expect(titres).toHaveCount(5);
      for (const t of await titres.all()) {
        await expect(t).toBeVisible();
        expect(await t.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), titre).toBe(true);
      }
    }
  });
});

test("sous « Choisis ta carte », la fiche prévient que les noms s'affichent après la réponse, avant et après le choix", async ({ page }) => {
  await page.goto("/");
  const titre = page.getByRole("heading", { name: "Choisis ta carte" });
  const avis = page.getByText("Les noms des candidats s'affichent après ta réponse.", { exact: true });
  const options = page.getByRole("radiogroup", { name: "Les options" });
  await expect(avis).toBeVisible();
  const [boiteTitre, boiteAvis, boiteOptions] = await Promise.all([titre.boundingBox(), avis.boundingBox(), options.boundingBox()]);
  expect(boiteAvis!.y).toBeGreaterThan(boiteTitre!.y);
  expect(boiteAvis!.y).toBeLessThan(boiteOptions!.y);

  await choisir(page, "64 ans");
  await expect(avis).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test.describe("sur ordinateur, la carte question se pose à côté des cartes réponse", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("à 1280 px, la carte question est à gauche et les cartes réponse à droite, côte à côte", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    const options = page.getByRole("radiogroup", { name: "Les options" });
    const [c, o] = await Promise.all([carte.boundingBox(), options.boundingBox()]);
    expect(c!.x + c!.width).toBeLessThanOrEqual(o!.x);
    expect(c!.y).toBeLessThan(o!.y + o!.height);
    expect(o!.y).toBeLessThan(c!.y + c!.height);
  });

  test("en défilant les cinq options, la carte question reste visible à gauche", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    for (const libelle of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
      await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).scrollIntoViewIfNeeded();
      await expect(carte).toBeInViewport({ ratio: 0.9 });
    }
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  });
});

test.describe("sur un petit téléphone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("à 375 px, la carte question vient d'abord, puis les cartes réponse en dessous", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    const options = page.getByRole("radiogroup", { name: "Les options" });
    const [c, o] = await Promise.all([carte.boundingBox(), options.boundingBox()]);
    expect(c!.y + c!.height).toBeLessThanOrEqual(o!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

/** La carte réponse (le libellé cliquable) d'une option. */
const carteReponse = (page: Page, libelle: string) =>
  page.getByRole("radiogroup", { name: "Les options" }).locator("label").filter({ has: page.getByRole("radio", { name: libelle }) });

test("toucher « 64 ans » colore la carte C, la soulève et la marque « Ta carte » ; les autres restent blanches", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  const choisie = carteReponse(page, "64 ans");
  await expect(choisie.getByText("Ta carte", { exact: true })).toBeVisible();
  const face = choisie.locator(".opt-face");
  await expect.poll(() => fond(face)).toBe(ORANGE);
  expect(await face.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");

  for (const libelle of ["60 ans", "62 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    const autre = carteReponse(page, libelle);
    expect(await fond(autre.locator(".opt-face"))).toBe("rgb(255, 255, 255)");
    await expect(autre.getByText("Ta carte", { exact: true })).toBeHidden();
  }
});

test("avec « réduire les animations », la carte choisie est marquée aussitôt, sans mouvement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await carteReponse(page, "64 ans").getByText("64 ans", { exact: true }).click();
  const choisie = carteReponse(page, "64 ans");
  const etat = await choisie.evaluate((el) => ({
    animations: document.getAnimations().length,
    fond: getComputedStyle(el.querySelector(".opt-face")!).backgroundColor,
    etiquette: getComputedStyle(el.querySelector(".picked")!).opacity,
  }));
  expect(etat).toEqual({ animations: 0, fond: ORANGE, etiquette: "1" });
  await expect(choisie.getByText("Ta carte", { exact: true })).toBeVisible();
});

test("choisir A puis B, sans valider, fait passer « Ta carte » de A à B", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "60 ans");
  await expect(carteReponse(page, "60 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await choisir(page, "62 ans");
  await expect(carteReponse(page, "62 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await expect(carteReponse(page, "60 ans").getByText("Ta carte", { exact: true })).toBeHidden();
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
});

test("après A puis B et validation, la révélation nomme les défenseurs de B, pas ceux de A", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "60 ans");
  await choisir(page, "62 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  const defenseurs = page.getByRole("list", { name: "Ils défendent ton option" });
  for (const nom of ["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]) await expect(defenseurs.getByText(nom)).toBeVisible();
  for (const nom of ["Jean-Luc Mélenchon", "Fabien Roussel", "Nathalie Arthaud"]) await expect(defenseurs.getByText(nom)).toHaveCount(0);
});

const reponsesEnregistrees = (page: Page) =>
  page.evaluate(() => [...Object.keys(sessionStorage), ...Object.keys(localStorage)].filter((cle) => cle.startsWith("aucrible")));

test("sans rien choisir, « Valider ma réponse » est inactif : le toucher n'ouvre pas la révélation et n'enregistre rien", async ({ page }) => {
  await page.goto("/");
  const valider = page.getByRole("button", { name: "Valider ma réponse" });
  await expect(valider).toBeVisible();
  await expect(valider).toBeDisabled();
  await valider.click({ force: true });
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/$/);
  expect(await reponsesEnregistrees(page)).toEqual([]);
});

test("dès qu'une option est choisie, « Valider ma réponse » ouvre la révélation", async ({ page }) => {
  await page.goto("/");
  const valider = page.getByRole("button", { name: "Valider ma réponse" });
  await choisir(page, "65 ans ou plus");
  await expect(valider).toBeEnabled();
  await valider.click();
  await expect(page).toHaveURL(/\/revelation$/);
});

test("choisir « Je ne sais pas » puis valider enregistre la réponse et ouvre la révélation de la question n° 24", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "Je ne sais pas");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toBeVisible();
  expect(await reponsesEnregistrees(page)).not.toEqual([]);
});

test("choisir « Je ne sais pas » après « 64 ans » décoche « 64 ans » : une seule carte est choisie", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  await choisir(page, "Je ne sais pas");
  await expect(page.getByRole("radio", { name: "64 ans" })).not.toBeChecked();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(0);
});

const importance = (page: Page) => page.getByRole("group", { name: "Ce sujet compte pour toi ?" });

/** Choisir une importance comme le fait l'électeur : en touchant sa carte. */
async function peser(page: Page, poids: "×1" | "×2" | "×3") {
  await importance(page).getByText(poids, { exact: true }).click();
  await expect(importance(page).getByRole("radio", { name: new RegExp(`^${poids} `) })).toBeChecked();
}

test("sous « Ce sujet compte pour toi ? », la fiche n° 24 propose ×1 « Un peu », ×2 « Beaucoup », ×3 « Essentiel »", async ({ page }) => {
  await page.goto("/");
  const choix = importance(page).getByRole("radio");
  await expect(choix).toHaveCount(3);
  for (const [rang, nom] of ["×1 Un peu", "×2 Beaucoup", "×3 Essentiel"].entries()) {
    await expect(choix.nth(rang)).toHaveAccessibleName(nom);
    await expect(importance(page).getByText(nom.split(" ")[0], { exact: true })).toBeVisible();
  }
  const [options, groupe] = await Promise.all([page.getByRole("radiogroup", { name: "Les options" }).boundingBox(), importance(page).boundingBox()]);
  expect(groupe!.y).toBeGreaterThan(options!.y + options!.height - 1);
});

test("toucher ×3 marque ×3 et décoche le choix précédent ; un seul est marqué à la fois", async ({ page }) => {
  await page.goto("/");
  await peser(page, "×1");
  await peser(page, "×3");
  await expect(importance(page).getByRole("radio", { name: /^×1 / })).not.toBeChecked();
  await expect(importance(page).getByRole("radio", { checked: true })).toHaveCount(1);
});

test("changer d'importance ne change pas l'option choisie : « Ta carte » reste sur la même carte", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  await peser(page, "×2");
  await peser(page, "×3");
  await expect(page.getByRole("radio", { name: "64 ans" })).toBeChecked();
  await expect(carteReponse(page, "64 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(1);
});

/** Répondre à la question du jour et arriver sur sa révélation. */
async function repondre(page: Page, libelle: string) {
  await page.goto("/");
  await choisir(page, libelle);
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
}

const quiDefendQuoi = (page: Page) => page.getByRole("region", { name: "Qui défend quoi" });
/** Les blocs des options A à E, sans celui des positions inconnues. */
const blocsDOption = (page: Page) => quiDefendQuoi(page).getByRole("article", { name: /^Option / });

/** Les noms posés sous un bloc d'option de la révélation, triés (l'ordre affiché est l'affaire du ticket 025). */
async function nomsSous(page: Page, option: string) {
  const bloc = quiDefendQuoi(page).getByRole("article", { name: option });
  await expect(bloc).toBeVisible();
  return (await bloc.getByRole("listitem").locator(".def-name").allInnerTexts()).map((t) => t.trim()).sort();
}

test("la révélation de la question n° 24 nomme, sous chaque option, les candidats qui la défendent", async ({ page }) => {
  await repondre(page, "62 ans");
  expect(await nomsSous(page, "Option A : 60 ans")).toEqual(["Fabien Roussel", "Jean-Luc Mélenchon", "Nathalie Arthaud"]);
  expect(await nomsSous(page, "Option B : 62 ans")).toEqual(["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]);
  expect(await nomsSous(page, "Option C : 64 ans")).toEqual(["Gabriel Attal", "Éric Zemmour"]);
  expect(await nomsSous(page, "Option D : 65 ans ou plus")).toEqual(["Bruno Retailleau"]);
  expect(await nomsSous(page, "Option E : À la carte, avec un système à points")).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
});

test("quelle que soit la réponse, les cinq blocs s'affichent, annoncent leur nombre de candidats, et nul n'apparaît deux fois", async ({ page }) => {
  const attendus = { A: "3 candidats", B: "3 candidats", C: "2 candidats", D: "1 candidat", E: "2 candidats" };
  for (const reponse of ["60 ans", "À la carte, avec un système à points", "Je ne sais pas"]) {
    await repondre(page, reponse);
    const blocs = blocsDOption(page);
    await expect(blocs).toHaveCount(5);
    const tous: string[] = [];
    for (const [rang, [lettre, compte]] of Object.entries(attendus).entries()) {
      const bloc = blocs.nth(rang);
      await expect(bloc).toHaveAccessibleName(new RegExp(`^Option ${lettre} : `));
      await expect(bloc.getByText(compte, { exact: true })).toBeVisible();
      const noms = await bloc.getByRole("listitem").locator(".def-name").allInnerTexts();
      expect(`${noms.length} candidat${noms.length > 1 ? "s" : ""}`).toBe(compte);
      tous.push(...noms);
    }
    expect(new Set(tous).size).toBe(tous.length);
  }
});

test.describe("la révélation rappelle l'option choisie", () => {
  for (const [lettre, libelle] of [["E", "À la carte, avec un système à points"], ["B", "62 ans"]]) {
    test(`après ${lettre} (${libelle}), l'encart « Ta réponse » l'affiche et « Ta carte » est sur le bloc ${lettre}, nulle part ailleurs`, async ({ page }) => {
      await repondre(page, libelle);
      const encart = page.getByRole("region", { name: `Ta réponse : ${lettre} · ${libelle}` });
      await expect(encart).toBeVisible();
      await expect(encart.getByText(lettre, { exact: true })).toBeVisible();
      await expect(encart.getByText(libelle, { exact: true })).toBeVisible();
      const bloc = quiDefendQuoi(page).getByRole("article", { name: `Option ${lettre} : ${libelle}` });
      await expect(bloc.getByText("Ta carte", { exact: true })).toBeVisible();
      await expect(quiDefendQuoi(page).getByText("Ta carte", { exact: true })).toHaveCount(1);
    });
  }
});

test.describe("la révélation rappelle l'importance donnée", () => {
  for (const [poids, pleines] of [["×1", 1], ["×2", 2], ["×3", 3]] as const) {
    test(`après validation avec ${poids}, l'encart affiche « Importance ${poids} » avec ${pleines} pastille(s) pleine(s) sur 3`, async ({ page }) => {
      await page.goto("/");
      await choisir(page, "62 ans");
      await peser(page, poids);
      await page.getByRole("button", { name: "Valider ma réponse" }).click();
      const encart = page.getByRole("region", { name: `Ta réponse : B · 62 ans. Importance ${poids}` });
      await expect(encart.getByText(`Importance ${poids}`, { exact: true })).toBeVisible();
      const pastilles = encart.locator(".chips i");
      await expect(pastilles).toHaveCount(3);
      await expect(encart.locator(".chips i.off")).toHaveCount(3 - pleines);
    });
  }
});

/** La ligne de source posée sous le nom d'un candidat révélé. */
const sourceDe = (page: Page, nom: string) =>
  quiDefendQuoi(page).getByRole("listitem").filter({ has: page.getByText(nom, { exact: true }) }).locator(".def-doc");

test("sur la révélation n° 24, chaque nom est suivi de la source datée de sa position", async ({ page }) => {
  await repondre(page, "62 ans");
  const attendues = {
    "Fabien Roussel": "Interview franceinfo, 21/09/2026",
    "Nathalie Arthaud": "Programme 2022, p. 6",
    "Marine Le Pen": "Vote du groupe à l'Assemblée, 2023",
    "Bruno Retailleau": "Discours de rentrée, 12/09/2026",
  };
  for (const [nom, source] of Object.entries(attendues)) {
    await expect(sourceDe(page, nom)).toHaveText(source);
    const [n, s] = await Promise.all([quiDefendQuoi(page).getByText(nom, { exact: true }).boundingBox(), sourceDe(page, nom).boundingBox()]);
    expect(s!.y).toBeGreaterThan(n!.y);
  }
});

test("les 11 candidats rangés sous une option ont tous une source, lisible en entier", async ({ page }) => {
  await repondre(page, "62 ans");
  const lignes = blocsDOption(page).getByRole("listitem");
  await expect(lignes).toHaveCount(11);
  for (const ligne of await lignes.all()) {
    const source = ligne.locator(".def-doc");
    await expect(source).toBeVisible();
    expect((await source.innerText()).trim().length).toBeGreaterThan(3);
    expect(await source.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});

/** La ligne d'un candidat révélé, sous son option. */
const ligneDe = (page: Page, nom: string) =>
  quiDefendQuoi(page).getByRole("listitem").filter({ has: page.getByText(nom, { exact: true }) });

test("sur la révélation n° 24, Roussel porte « position officielle », Arthaud et Le Pen « position déduite »", async ({ page }) => {
  await repondre(page, "62 ans");
  await expect(ligneDe(page, "Fabien Roussel").getByText("position officielle", { exact: true })).toBeVisible();
  for (const nom of ["Nathalie Arthaud", "Marine Le Pen"]) {
    await expect(ligneDe(page, nom).getByText("position déduite", { exact: true })).toBeVisible();
  }
});

test("les 11 candidats sourcés portent l'un ou l'autre badge, jamais les deux : 5 officielles, 6 déduites", async ({ page }) => {
  await repondre(page, "62 ans");
  const lignes = blocsDOption(page).getByRole("listitem");
  await expect(lignes).toHaveCount(11);
  let officielles = 0;
  let deduites = 0;
  for (const ligne of await lignes.all()) {
    const o = await ligne.getByText("position officielle", { exact: true }).filter({ visible: true }).count();
    const d = await ligne.getByText("position déduite", { exact: true }).filter({ visible: true }).count();
    expect(o + d).toBe(1);
    officielles += o;
    deduites += d;
  }
  expect({ officielles, deduites }).toEqual({ officielles: 5, deduites: 6 });
});

test("sur la révélation n° 24, Ruffin et Lisnard sont rangés sous « Position inconnue », sans source, avec leur badge", async ({ page }) => {
  await repondre(page, "62 ans");
  const bloc = quiDefendQuoi(page).getByRole("article", { name: "Position inconnue" });
  await expect(bloc.getByText("2 candidats · exclus du calcul sur ce sujet", { exact: true })).toBeVisible();
  expect(await nomsSous(page, "Position inconnue")).toEqual(["David Lisnard", "François Ruffin"]);
  for (const ligne of await bloc.getByRole("listitem").all()) {
    await expect(ligne.getByText("Pas de source à ce jour", { exact: true })).toBeVisible();
    await expect(ligne.getByText("position inconnue", { exact: true })).toBeVisible();
  }
});

test("les candidats sans source n'apparaissent sous aucune option : 11 sous les options, 2 inconnus, 13 en tout", async ({ page }) => {
  await repondre(page, "62 ans");
  const sousOptions = await blocsDOption(page).getByRole("listitem").locator(".def-name").allInnerTexts();
  const inconnus = await nomsSous(page, "Position inconnue");
  expect(sousOptions).toHaveLength(11);
  expect(inconnus).toHaveLength(2);
  expect(new Set([...sousOptions, ...inconnus]).size).toBe(13);
  for (const nom of inconnus) expect(sousOptions).not.toContain(nom);
});

test("la mention « ordre mélangé » se lit à côté de « Qui défend quoi »", async ({ page }) => {
  await repondre(page, "62 ans");
  const titre = quiDefendQuoi(page).getByRole("heading", { name: "Qui défend quoi" });
  const mention = quiDefendQuoi(page).getByText("ordre mélangé", { exact: true });
  await expect(mention).toBeVisible();
  const [t, m] = await Promise.all([titre.boundingBox(), mention.boundingBox()]);
  expect(m!.x).toBeGreaterThan(t!.x + t!.width - 1);
  expect(Math.abs(m!.y + m!.height / 2 - (t!.y + t!.height / 2))).toBeLessThan(t!.height);
});

test("d'un appareil à l'autre, l'ordre des défenseurs de A change, sans suivre l'alphabet ni les partis", async ({ browser }) => {
  const ordres = new Set<string>();
  for (let appareil = 0; appareil < 16; appareil++) {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const page = await contexte.newPage();
    await page.clock.setFixedTime(new Date("2026-10-23T09:00:00+02:00"));
    await repondre(page, "62 ans");
    const bloc = quiDefendQuoi(page).getByRole("article", { name: "Option A : 60 ans" });
    await expect(bloc.getByRole("listitem")).toHaveCount(3);
    ordres.add((await bloc.locator(".def-name").allInnerTexts()).join(" / "));
    await contexte.close();
  }
  // Six ordres possibles : au moins trois différents, donc au moins un qui n'est ni alphabétique ni celui des partis.
  expect(ordres.size).toBeGreaterThanOrEqual(3);
});
