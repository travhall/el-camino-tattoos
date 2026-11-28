import { expect, test, type Page } from "@playwright/test";
import { hydrated } from "./routes";

// content/shop/*.yaml is committed with placeholder shop details (the sister
// skate shop's address, the walk-in and consultation notes, a $100 deposit),
// so these tests read real, stable content rather than fixtures.

async function open(page: Page, route: string) {
  await page.goto(route);
  await page.locator(hydrated).waitFor({ state: "attached" });
  // Jump the load entrances (header, hero) to their end, so measurements and
  // contrast checks see the settled page. Scroll entrances still play.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.timeline !== document.timeline) continue;
      try {
        animation.finish();
      } catch {
        // Infinite animations (loading pulses) can't finish; leave them.
      }
    }
  });
}

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

// Wednesday 3pm in Eau Claire (Central), inside the placeholder hours in
// content/shop/hours.yaml, so the open status is predictable.
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
    // Monday is closed in content/shop/hours.yaml; Tuesday opens at noon.
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
      hero.getByRole("link", { name: "Book a free consult" }),
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

  test("the home artists section shows its copy from the Home entry", async ({
    page,
  }) => {
    await open(page, "/");
    const section = page.locator(".artists-teaser");
    await expect(
      section.getByText("Our people make the difference"),
    ).toBeVisible();
    await expect(
      section.getByRole("heading", {
        level: 2,
        name: "The Artists of El Camino",
      }),
    ).toBeVisible();
    await expect(
      section.getByRole("link", { name: "Meet the team" }),
    ).toHaveAttribute("href", "/artists");
  });

  test("the homepage ends with the numbered What to expect steps", async ({
    page,
  }) => {
    await open(page, "/");
    const section = page.getByRole("region", { name: "What to expect" });
    const steps = section.getByRole("listitem");
    await expect(steps).toHaveCount(5);
    await expect(steps.first().getByRole("heading", { level: 3 })).toHaveText(
      "Send your idea or stop by.",
    );
    // Five in a row on wide screens.
    await page.setViewportSize({ width: 1512, height: 900 });
    const tops = await steps.evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);
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
    // Call, text or directions: above the form on phones, beside it here.
    await expect(
      page
        .getByRole("complementary", { name: "Visiting the shop" })
        .getByRole("link", { name: "Call", exact: true }),
    ).toBeVisible();
  });

  test("the header's action is Book now, and it goes to the form", async ({
    page,
  }) => {
    await open(page, "/");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Book now" }),
    ).toHaveAttribute("href", "/contact");
  });
});

test.describe("artist pages", () => {
  test("a profile shows the artist's status, facts, links and request button", async ({
    page,
  }) => {
    await open(page, "/artists/zz-fixture-one");
    // Scoped to the profile: the Other artists cards show statuses too.
    const status = page.locator(".artist-profile .booking-status");
    await expect(status).toContainText("Waitlist");
    await expect(status).toContainText("Fixture dates open soon.");
    const facts = page.locator(".artist-facts");
    await expect(facts.getByText("Tattooing since")).toBeVisible();
    await expect(facts.getByText("Koi, Peonies")).toBeVisible();
    await expect(facts.getByText("Fixture Fridays")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Book with Fixture One" }),
    ).toHaveAttribute("href", "/contact?artist=zz-fixture-one");
    await expect(
      page.getByRole("link", { name: "Fixture One on Instagram" }),
    ).toHaveAttribute("href", "https://www.instagram.com/fixture_one/");
    await expect(
      page.getByRole("link", { name: "Fixture One on Website" }),
    ).toHaveAttribute("href", "https://example.com/");
  });

  test("featured work is numbered and captioned, and links to the piece", async ({
    page,
  }) => {
    await open(page, "/artists/zz-fixture-one");
    const featured = page.getByRole("region", { name: "Featured work" });
    const first = featured.getByRole("listitem").first();
    await expect(first.getByText("Fixture Koi")).toBeVisible();
    await expect(first.getByText("Japanese · Forearm")).toBeVisible();
    await expect(first.getByRole("link")).toHaveAttribute(
      "href",
      "/portfolio/zz-fixture-koi",
    );
  });

  test("an artist without a booking status shows none", async ({ page }) => {
    await open(page, "/artists/zz-fixture-two");
    const profile = page.locator(".artist-profile");
    await expect(profile.locator(".booking-status")).toHaveCount(0);
    await expect(profile.locator(".artist-facts")).toHaveCount(0);
  });

  test("the artists page ends with the help and guest-artist panels", async ({
    page,
  }) => {
    await open(page, "/artists");
    const help = page.getByRole("region", {
      name: "Not sure who’s right for you?",
    });
    await expect(
      help.getByRole("link", { name: "Book an appointment" }),
    ).toHaveAttribute("href", "/contact");
    const guests = page.getByRole("region", { name: "Traveling tattooer?" });
    await expect(
      guests.getByRole("link", { name: "Send your portfolio" }),
    ).toBeVisible();
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

test.describe("FAQ page", () => {
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

  test("the FAQ and Aftercare are in the footer, not the desktop header", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, "/");
    const footer = page.getByRole("navigation", { name: "Footer" });
    await expect(footer.getByRole("link", { name: "FAQ" })).toHaveAttribute(
      "href",
      "/faq",
    );
    await expect(
      footer.getByRole("link", { name: "Aftercare" }),
    ).toHaveAttribute("href", "/aftercare");
    const header = page.getByRole("navigation", { name: "Primary" });
    await expect(header.getByRole("link", { name: "FAQ" })).toBeHidden();
    await expect(header.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
