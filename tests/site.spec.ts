import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { hydrated } from "./routes";

// content/site.yaml is committed with placeholder shop details (the sister
// skate shop's address, the walk-in and consultation notes, a $100 deposit),
// so these tests read real, stable content rather than fixtures.

async function open(page: Page, route: string) {
  await page.goto(route);
  await page.locator(hydrated).waitFor({ state: "attached" });
}

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

test.describe("shop info", () => {
  test("the homepage leads with the walk-in and consultation notes", async ({
    page,
  }) => {
    await open(page, "/");
    await expect(
      page.getByText("Walk-ins welcome when available. Free consultations."),
    ).toBeVisible();
  });

  test("the footer shows the address", async ({ page }) => {
    await open(page, "/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText("310 Water Street")).toBeVisible();
    await expect(footer.getByText("Eau Claire, WI 54703")).toBeVisible();
  });

  test("the contact page says what a deposit is, and leaves out a missing phone", async ({
    page,
  }) => {
    await open(page, "/contact");
    await expect(
      page.getByText("A $100 deposit holds your appointment."),
    ).toBeVisible();
    await expect(page.getByText("Prefer to talk?")).toHaveCount(0);
  });

  test("the header's action is Request, and it goes to the form", async ({
    page,
  }) => {
    await open(page, "/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Request" })).toHaveAttribute(
      "href",
      "/contact",
    );
    await expect(nav.getByRole("link", { name: "Book" })).toHaveCount(0);
  });
});

test.describe("search and sharing metadata", () => {
  test("the homepage has a real description", async ({ page }) => {
    await open(page, "/");
    expect(await meta(page, 'meta[name="description"]')).toContain(
      "Eau Claire",
    );
  });

  test("pages declare a canonical URL", async ({ page }) => {
    await open(page, "/artists");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/artists$/,
    );
  });

  test("a page's Open Graph tags keep the site name", async ({ page }) => {
    // A page-level openGraph replaces the layout's, so this guards the helper.
    await open(page, "/portfolio");
    expect(await meta(page, 'meta[property="og:site_name"]')).toBe(
      "El Camino Tattoos",
    );
    expect(await meta(page, 'meta[property="og:title"]')).toBe("Portfolio");
  });

  test("a piece shares its own image", async ({ page }) => {
    await open(page, "/portfolio/zz-fixture-koi");
    expect(await meta(page, 'meta[property="og:image"]')).toMatch(
      /\/images\/pieces\//,
    );
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );
    expect(await meta(page, 'meta[name="description"]')).toBe(
      "Fixture Koi by Fixture One. Japanese, Forearm.",
    );
  });

  test("an artist page shares their portrait", async ({ page }) => {
    await open(page, "/artists/zz-fixture-one");
    expect(await meta(page, 'meta[property="og:image"]')).toMatch(
      /\/images\/artists\//,
    );
  });
});

test.describe("editable pages", () => {
  test("the FAQ lists questions in order, each linkable and answered", async ({
    page,
  }) => {
    await open(page, "/faq");

    const questions = page.getByRole("heading", { level: 2 });
    await expect(questions).toHaveText([
      "How much is a deposit?",
      "Do you take walk-ins?",
    ]);

    // The slug is the anchor, and the section is named by its question.
    const deposit = page.locator("#zz-fixture-deposit");
    await expect(deposit).toHaveAttribute(
      "aria-labelledby",
      "zz-fixture-deposit-question",
    );
    await expect(
      deposit.getByRole("link", { name: "contact page" }),
    ).toHaveAttribute("href", "/contact");

    // Formatting the editor offers comes through: bold and a list.
    const walkIns = page.locator("#zz-fixture-walk-ins");
    await expect(walkIns.locator("strong")).toHaveText("Ask first");
    await expect(walkIns.getByRole("listitem")).toHaveText([
      "Small pieces are easiest",
      "Bring a photo ID",
    ]);
  });

  test("the FAQ has a title, description and canonical URL", async ({
    page,
  }) => {
    await open(page, "/faq");
    await expect(page).toHaveTitle("FAQ | El Camino Tattoos");
    expect(await meta(page, 'meta[name="description"]')).toContain(
      "common questions",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/faq$/,
    );
  });

  test("the header links to the FAQ", async ({ page }) => {
    await open(page, "/");
    await expect(
      page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "FAQ" }),
    ).toHaveAttribute("href", "/faq");
  });

  test("Aftercare renders what the editor wrote, under one h1", async ({
    page,
  }) => {
    // The fixture only exists when there was no real Aftercare file to keep.
    const file = path.join(process.cwd(), "content/aftercare.mdoc");
    const seeded =
      existsSync(file) &&
      readFileSync(file, "utf8").includes("Fixture aftercare");
    test.skip(!seeded, "real Aftercare content is present");

    await open(page, "/aftercare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aftercare",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      "Fixture aftercare",
    );
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(
      "The first days",
    );
    await expect(page.locator("main ol > li")).toHaveText([
      "Wash gently",
      "Pat dry",
      "Apply a thin layer of ointment",
    ]);
  });
});
