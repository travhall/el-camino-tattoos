import { expect, test, type Page } from "@playwright/test";
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
