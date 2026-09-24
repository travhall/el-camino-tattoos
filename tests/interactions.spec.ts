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

  test("closes on a backdrop click but not on a click inside the dialog", async ({
    page,
  }) => {
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    await expect(dialog).toBeVisible();

    // Just inside the dialog's top-left corner: the former padding area.
    await dialog.click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("heading", { level: 1 }).click();
    await expect(dialog).toBeVisible();

    // Outside the dialog box is the backdrop.
    await page.mouse.click(2, 2);
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
  async function fillRequired(page: Page) {
    await page.getByLabel("Name", { exact: true }).fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Tell us about your idea").fill("A small koi.");
    await page.getByLabel("Placement").fill("Inner left forearm");
    await page.getByLabel("Approximate size").fill("4 inches");
  }

  test("posts multipart to /__forms.html and lands on the thanks page", async ({
    page,
  }) => {
    let contentType = "";
    let posted = "";
    await page.route("**/__forms.html", async (route) => {
      if (route.request().method() === "POST") {
        contentType = route.request().headers()["content-type"] ?? "";
        posted = route.request().postDataBuffer()?.toString("latin1") ?? "";
        await route.fulfill({ status: 200, body: "" });
      } else {
        await route.continue();
      }
    });

    await open(page, "/contact");
    await fillRequired(page);
    await page.getByLabel("Phone (optional)").fill("555-0100");
    await page.getByLabel("Budget (optional)").fill("$300 to $500");
    await page.getByLabel("Artist (optional)").selectOption("Fixture One");
    await page.getByLabel("Color", { exact: true }).check();
    await page.getByLabel(/covers up or reworks/).check();
    await page.getByLabel("Reference image 1").setInputFiles({
      name: "koi.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-bytes"),
    });
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page).toHaveURL(/\/contact\/thanks$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thanks for reaching out",
    );

    // Files force multipart; the browser must set the boundary itself.
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    const field = (name: string) =>
      new RegExp(
        `name="${name}"(?:; filename="[^"]*")?\\r\\n(?:Content-Type:[^\\r]*\\r\\n)?\\r\\n([^\\r]*)`,
      ).exec(posted)?.[1];
    expect(field("form-name")).toBe("contact");
    expect(field("name")).toBe("Test Person");
    expect(field("email")).toBe("test@example.com");
    expect(field("phone")).toBe("555-0100");
    expect(field("artist")).toBe("Fixture One");
    expect(field("message")).toBe("A small koi.");
    expect(field("placement")).toBe("Inner left forearm");
    expect(field("size")).toBe("4 inches");
    expect(field("budget")).toBe("$300 to $500");
    expect(field("color")).toBe("Color");
    expect(field("cover-up")).toBe("yes");
    expect(field("bot-field")).toBe("");
    expect(posted).toContain('name="reference-1"; filename="koi.png"');
    expect(field("reference-1")).toBe("fake-image-bytes");
  });

  test("refuses images over the size limit without posting", async ({
    page,
  }) => {
    let posts = 0;
    await page.route("**/__forms.html", (route) => {
      if (route.request().method() === "POST") posts += 1;
      return route.continue();
    });

    await open(page, "/contact");
    await fillRequired(page);
    await page.getByLabel("Reference image 1").setInputFiles({
      name: "huge.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(8 * 1024 * 1024),
    });
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "images add up to" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    expect(posts).toBe(0);
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
    await fillRequired(page);
    await page.getByRole("button", { name: "Send message" }).click();

    // Next's route announcer is also role="alert", so match on the message.
    await expect(
      page.getByRole("alert").filter({ hasText: "send your message" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    const button = page.getByRole("button", { name: "Send message" });
    await expect(button).toBeEnabled();
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
  });

  test("keeps focus and announces while sending", async ({ page }) => {
    let posts = 0;
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/__forms.html", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posts += 1;
      await held;
      return route.fulfill({ status: 200, body: "" });
    });

    await open(page, "/contact");
    await fillRequired(page);
    const button = page.getByRole("button", { name: /Send message|Sending/ });
    await button.focus();
    await page.keyboard.press("Enter");

    // aria-disabled, not native disabled, so focus stays on the button.
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeFocused();
    await expect(
      page.getByRole("status").filter({ hasText: "Sending your message" }),
    ).toHaveText("Sending your message…");

    // A second activation while pending must not post again.
    await page.keyboard.press("Enter");
    // A "did not happen" check cannot be event-driven, so it needs a short wait.
    await page.waitForTimeout(250);
    expect(posts).toBe(1);
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeFocused();

    release();
    await expect(page).toHaveURL(/\/contact\/thanks$/);
  });
});

test("disabled buttons ignore hover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/styleguide");

  const background = (name: string) =>
    page
      .getByRole("button", { name, exact: true })
      .evaluate((el) => getComputedStyle(el).backgroundColor);

  const enabled = page.getByRole("button", { name: "Secondary", exact: true });
  const before = await background("Secondary");
  await enabled.hover();
  await expect.poll(() => background("Secondary")).not.toBe(before);

  for (const name of ["Secondary disabled", "Pending"]) {
    const control = page.getByRole("button", { name, exact: true });
    const idle = await background(name);
    await control.hover({ force: true });
    expect(await background(name)).toBe(idle);
  }
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
          "a[href], button, select, textarea, input:not([type=hidden]):not([type=checkbox]):not([type=radio])",
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

      // Checkboxes and radios are exempt themselves; their label is the target.
      const smallChecks = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            "label.check:has(input:is([type=checkbox], [type=radio]))",
          ),
        ]
          .filter((el) => el.getBoundingClientRect().height < 43.5)
          .map((el) => (el.textContent ?? "").trim()),
      );
      expect(smallChecks).toEqual([]);
    });
  }
});
