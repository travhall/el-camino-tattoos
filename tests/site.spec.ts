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

// Wednesday 3pm in Eau Claire (Central), inside the placeholder hours in
// content/site.yaml, so the open status is predictable.
const openTime = new Date("2026-11-25T21:00:00Z");

test.describe("shop info", () => {
  test("the topbar says the shop is open, and offers the phone", async ({
    page,
  }) => {
    await page.clock.setFixedTime(openTime);
    await open(page, "/");
    const topbar = page.locator(".site-topbar");
    await expect(topbar.getByText("Open today")).toBeVisible();
    await expect(topbar.getByText("Walk-ins available")).toBeVisible();
    await expect(
      topbar.getByRole("link", { name: "(715) 912-1169" }),
    ).toHaveAttribute("href", "tel:7159121169");
  });

  test("page heroes put the photo beside the text on desktop and above it on phones", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    // The styleguide's "Page, photo right" demo (no page ships a photo).
    await open(page, "/styleguide");
    const hero = page.locator(".hero--image-right");
    const content = await hero.locator(".hero__content").boundingBox();
    const media = await hero.locator(".hero__media").boundingBox();
    // 420 x 560 in the design, to the right of the text.
    expect(Math.round(media!.width)).toBe(420);
    expect(Math.round(media!.height)).toBe(560);
    expect(media!.x).toBeGreaterThan(content!.x + content!.width - 1);
    await expect(hero.getByRole("img")).toHaveAttribute("alt", /tattoo artist/);

    await page.setViewportSize({ width: 375, height: 812 });
    const contentPhone = await hero.locator(".hero__content").boundingBox();
    const mediaPhone = await hero.locator(".hero__media").boundingBox();
    // On phones the photo comes first, so the text scrolls up under it.
    expect(contentPhone!.y).toBeGreaterThanOrEqual(
      mediaPhone!.y + mediaPhone!.height,
    );
  });

  test("the page container is 1440px wide at a 1512px viewport", async ({
    page,
  }) => {
    // The design's frame: 1440px of content, 36px gutters, the same inset
    // as the header and footer.
    await page.setViewportSize({ width: 1512, height: 900 });
    await open(page, "/");
    const box = await page.locator("main").boundingBox();
    expect(box?.width).toBe(1440);
    expect(box?.x).toBe(36);
  });

  test("the open status follows the shop's hours in its own time zone", async ({
    page,
  }) => {
    // Monday is closed in content/site.yaml; Tuesday opens at noon.
    await page.clock.setFixedTime(new Date("2026-11-23T20:00:00Z"));
    await open(page, "/");
    const topbar = page.locator(".site-topbar");
    await expect(topbar.getByText("Closed now")).toBeVisible();
    await expect(topbar.getByText("Opens tomorrow at 12pm")).toBeVisible();
  });

  test("the homepage hero shows the editable eyebrow, headline, intro, buttons and promises", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, "/");
    const hero = page.locator(".hero");
    await expect(hero).toHaveClass(/hero--home/);
    await expect(hero.locator(".hero__media")).toHaveCount(0);
    await expect(
      hero.getByText("Tradition at heart. All are welcome."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Classic Tattoos, Fair Prices",
    );
    await expect(hero.getByText("Three artists in downtown")).toBeVisible();
    await expect(
      hero.getByRole("link", { name: "Free consultation" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      hero.getByRole("link", { name: "See our work" }),
    ).toHaveAttribute("href", "/portfolio");
    const promises = page
      .getByRole("list", { name: "What to expect" })
      .getByRole("listitem");
    await expect(promises).toHaveCount(3);
    // The heading fits the page at every width (no sideways scroll).
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow).toBe(false);
    }
  });

  test("a photo that fails to load is replaced by a placeholder", async ({
    page,
  }) => {
    await page.route("**/_next/image**", (route) => route.abort());
    await open(page, "/styleguide");
    const frame = page.locator(".hero--image-right .hero__media");
    await expect(frame.locator(".photo-placeholder")).toBeVisible();
    await expect(frame.locator("img")).toHaveCount(0);
  });

  test("the footer shows the address", async ({ page }) => {
    await open(page, "/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText("310 Water Street")).toBeVisible();
    await expect(footer.getByText("Eau Claire, WI 54703")).toBeVisible();
  });

  test("the footer has contact, walk-ins, nav and the copyright", async ({
    page,
  }) => {
    await page.clock.setFixedTime(openTime);
    await open(page, "/");
    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByRole("link", { name: "(715) 912-1169" }),
    ).toHaveAttribute("href", "tel:7159121169");
    await expect(footer.getByText("Walk-ins available")).toBeVisible();
    const nav = footer.getByRole("navigation", { name: "Footer" });
    await expect(nav.getByRole("link", { name: "Artists" })).toHaveAttribute(
      "href",
      "/artists",
    );
    await expect(
      footer.getByText(`© ${new Date().getFullYear()} El Camino Tattoos`),
    ).toBeVisible();
    // The oversized wordmark repeats the name, so it stays out of the
    // accessibility tree.
    await expect(footer.locator(".site-footer__wordmark")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("the contact page says what a deposit is, and offers the phone", async ({
    page,
  }) => {
    await open(page, "/contact");
    await expect(
      page.getByText("A $100 deposit holds your appointment."),
    ).toBeVisible();
    await expect(page.getByText("Prefer to talk?")).toBeVisible();
  });

  test("the header's action is Request an appointment, and it goes to the form", async ({
    page,
  }) => {
    await open(page, "/");
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Request an appointment" }),
    ).toHaveAttribute("href", "/contact");
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

    // Scoped to main: the footer now has its own h2 column headings on
    // every page, so an unscoped query would pick those up too.
    const questions = page.getByRole("main").getByRole("heading", { level: 2 });
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

  test("Aftercare renders structured steps and a warning, under one h1", async ({
    page,
  }) => {
    // The fixture only exists when there was no real Aftercare file to keep.
    const file = path.join(process.cwd(), "content/aftercare.mdoc");
    const seeded =
      existsSync(file) &&
      readFileSync(file, "utf8").includes("Fixture aftercare intro line");
    test.skip(!seeded, "real Aftercare content is present");

    await open(page, "/aftercare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aftercare",
    );
    await expect(page.getByText("Fixture aftercare intro line")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Keep it clean" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Apply a thin layer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "When to get help" }),
    ).toBeVisible();
    await expect(page.getByText("increasing redness")).toBeVisible();
  });
});
