import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hydrated } from "./routes";

async function open(page: Page, route: string) {
  await page.goto(route);
  await page.locator(hydrated).waitFor({ state: "attached" });
}

test("skip link is the first tab stop and moves focus into <main>", async ({
  page,
}) => {
  await open(page, "/portfolio");
  await page.keyboard.press("Tab");

  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("nav marks the current page and its section", async ({ page }) => {
  const portfolio = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Portfolio" });

  await open(page, "/portfolio");
  await expect(portfolio).toHaveAttribute("aria-current", "page");

  await open(page, "/portfolio/zz-fixture-koi");
  await expect(portfolio).toHaveAttribute("aria-current", "true");
});

test.describe("piece viewer", () => {
  test("opens over the gallery, has no violations, closes with Escape", async ({
    page,
  }) => {
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();

    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/portfolio\/zz-fixture-koi$/);
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/portfolio$/);
  });

  test("a piece loaded directly is a full page, not a dialog", async ({
    page,
  }) => {
    await open(page, "/portfolio/zz-fixture-koi");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Fixture Koi" }),
    ).toBeVisible();
  });
});

test("an unmatched URL is a real 404 with a stable title and lang", async ({
  page,
}) => {
  const response = await page.goto("/nope");
  expect(response?.status()).toBe(404);
  await page.locator(hydrated).waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Page not found | El Camino Tattoos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Page not found",
  );
});

test.describe("contact form", () => {
  test("posts urlencoded to /__forms.html and lands on the thanks page", async ({
    page,
  }) => {
    let posted = "";
    await page.route("**/__forms.html", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postData() ?? "";
        await route.fulfill({ status: 200, body: "" });
      } else {
        await route.continue();
      }
    });

    await open(page, "/contact");
    await page.getByLabel("Name", { exact: true }).fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Artist (optional)").selectOption("Fixture One");
    await page.getByLabel("Tell us about your idea").fill("A small koi.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page).toHaveURL(/\/contact\/thanks$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thanks for reaching out",
    );

    const fields = new URLSearchParams(posted);
    expect(fields.get("form-name")).toBe("contact");
    expect(fields.get("name")).toBe("Test Person");
    expect(fields.get("email")).toBe("test@example.com");
    expect(fields.get("artist")).toBe("Fixture One");
    expect(fields.get("message")).toBe("A small koi.");
    expect(fields.get("bot-field")).toBe("");
  });

  test("announces a failed send and lets the visitor retry", async ({
    page,
  }) => {
    await page.route("**/__forms.html", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 500, body: "" })
        : route.continue(),
    );

    await open(page, "/contact");
    await page.getByLabel("Name", { exact: true }).fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Tell us about your idea").fill("A small koi.");
    await page.getByRole("button", { name: "Send message" }).click();

    // Next's route announcer is also role="alert", so match on the message.
    await expect(
      page.getByRole("alert").filter({ hasText: "send your message" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(
      page.getByRole("button", { name: "Send message" }),
    ).toBeEnabled();
  });
});

test("reduced motion collapses transitions", async ({ page }) => {
  const duration = () =>
    page
      .locator(".piece-tile__image")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "/portfolio");
  expect(await duration()).toBeGreaterThan(0.1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await duration()).toBeLessThan(0.001);
});

test.describe("touch targets on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of [
    "/",
    "/artists",
    "/artists/zz-fixture-one",
    "/portfolio",
    "/contact",
  ]) {
    test(`${route}: standalone controls are at least 44px tall`, async ({
      page,
    }) => {
      await open(page, route);

      const tooSmall = await page.evaluate(() => {
        const found: string[] = [];
        const controls = document.querySelectorAll<HTMLElement>(
          "a[href], button, select, textarea, input:not([type=hidden]):not([type=checkbox])",
        );
        for (const el of controls) {
          if (el.closest("[hidden]") || el.classList.contains("skip-link")) {
            continue;
          }
          const inlineTextLink =
            el.tagName === "A" &&
            el.closest("p, dd, dt, td, caption") !== null &&
            getComputedStyle(el).display === "inline";
          if (inlineTextLink) continue;

          const { width, height } = el.getBoundingClientRect();
          if (width === 0 || height === 0) continue;
          if (height < 43.5) {
            const label = (el.textContent ?? "").trim().slice(0, 20);
            found.push(
              `<${el.tagName.toLowerCase()} class="${el.className}"> "${label}" ${Math.round(width)}x${height.toFixed(1)}`,
            );
          }
        }
        return found;
      });

      expect(tooSmall).toEqual([]);
    });
  }
});
