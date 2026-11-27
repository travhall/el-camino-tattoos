import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hydrated } from "./routes";

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
    .getByRole("link", { name: "Portfolios" });

  await open(page, "/portfolio");
  await expect(portfolio).toHaveAttribute("aria-current", "page");

  await open(page, "/portfolio/zz-fixture-koi");
  await expect(portfolio).toHaveAttribute("aria-current", "true");
});

test("faq page emits valid FAQPage structured data", async ({ page }) => {
  await open(page, "/faq");
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = JSON.parse(raw ?? "");
  expect(data["@type"]).toBe("FAQPage");
  expect(data.mainEntity.length).toBeGreaterThan(0);

  const deposit = data.mainEntity.find(
    (q: { name: string }) => q.name === "How much is a deposit?",
  );
  expect(deposit.acceptedAnswer.text).toBe(
    "A deposit holds your appointment. See the contact page to ask.",
  );
  // markdown syntax must not leak into the plain-text answer
  expect(deposit.acceptedAnswer.text).not.toMatch(/[[\]()*_]/);
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

  test("closes on a click around the photo but not on the photo or caption", async ({
    page,
  }) => {
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("img").click();
    await expect(dialog).toBeVisible();
    await page.locator(".viewer__sheet").click();
    await expect(dialog).toBeVisible();

    // The stage's own space: left of the close button, above the photo.
    await page.mouse.click(4, 4);
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/portfolio$/);
  });

  test("is full screen with the caption in a sheet under the photo", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    // Measure the settled layout, not the reveal.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    await expect(dialog).toBeVisible();

    const box = (await dialog.boundingBox())!;
    expect(box).toMatchObject({ x: 0, y: 0, width: 393, height: 852 });
    const sheet = (await page.locator(".viewer__sheet").boundingBox())!;
    const media = (await page.locator(".viewer__media").boundingBox())!;
    expect(media.y + media.height).toBeLessThanOrEqual(sheet.y);
    expect(sheet.y + sheet.height).toBeCloseTo(852, 0);
    // Page behind is locked while open, and unlocked after.
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });

  test("zooms with the button, pans with arrows, and Escape zooms out before closing", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    const zoom = dialog.getByRole("button", { name: "Zoom" });
    await expect(zoom).toHaveAttribute("aria-pressed", "false");

    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".viewer__zoom-layer")).toHaveCSS("scale", "2.5");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".viewer__media")).toHaveAttribute(
      "style",
      /--zoom-x: 60%/,
    );

    await page.keyboard.press("Escape");
    await expect(zoom).toHaveAttribute("aria-pressed", "false");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("names the dialog with the title but shows only the caption", async ({
    page,
  }) => {
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog", { name: "Fixture Koi" });
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole("heading", { level: 1 });
    await expect(title).toHaveText("Fixture Koi");
    expect((await title.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(page.locator(".viewer__details")).toHaveCSS(
      "font-family",
      /Hanken/i,
    );
  });

  test("steps to the next and previous piece in place", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Fixture Koi");
    const first = page.url();

    const next = dialog.getByRole("button", { name: "Next piece" });
    const previous = dialog.getByRole("button", { name: "Previous piece" });
    const step = (await next.getAttribute("aria-disabled")) ? previous : next;
    await step.click();
    await expect(page).not.toHaveURL(first);
    await expect(dialog).not.toHaveAccessibleName("Fixture Koi");
    await expect(page).toHaveURL(/\/portfolio\/[^/]+$/);

    // The arrow key steps back to where we started.
    await page.keyboard.press(step === next ? "ArrowLeft" : "ArrowRight");
    await expect(page).toHaveURL(first);
    await expect(dialog).toHaveAccessibleName("Fixture Koi");

    // Close returns to the gallery, not to a piece we stepped through.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/portfolio$/);
  });

  test("a swipe steps, and a pinch zooms the photo only", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Fixture Koi");
    const media = page.locator(".viewer__media");
    await expect(media).toHaveCSS("touch-action", "none");

    // Pinch: two touch pointers moving apart.
    await media.evaluate((el) => {
      const fire = (type: string, id: number, x: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: "touch",
            clientX: x,
            clientY: 300,
            bubbles: true,
          }),
        );
      fire("pointerdown", 1, 150);
      fire("pointerdown", 2, 220);
      fire("pointermove", 1, 80);
      fire("pointermove", 2, 300);
      fire("pointerup", 1, 80);
      fire("pointerup", 2, 300);
    });
    const zoom = dialog.getByRole("button", { name: "Zoom" });
    await expect(zoom).toHaveAttribute("aria-pressed", "true");
    const scale = await media.evaluate((el) =>
      Number.parseFloat(el.style.getPropertyValue("--zoom-scale")),
    );
    expect(scale).toBeGreaterThan(2);
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "false");

    // Swipe: one touch pointer dragged sideways steps to a neighbour.
    const first = page.url();
    const direction = (await dialog
      .getByRole("button", { name: "Next piece" })
      .getAttribute("aria-disabled"))
      ? 1
      : -1;
    await media.evaluate((el, dir) => {
      const fire = (type: string, x: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 3,
            pointerType: "touch",
            clientX: x,
            clientY: 300,
            bubbles: true,
          }),
        );
      fire("pointerdown", 190);
      fire("pointermove", 190 + dir * 120);
      fire("pointerup", 190 + dir * 120);
    }, direction);
    await expect(page).not.toHaveURL(first);
    await expect(zoom).toHaveAttribute("aria-pressed", "false");
  });

  test("shows a loading state until the photo arrives", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/_next/image**", async (route) => {
      await held;
      await route.continue();
    });
    await open(page, "/portfolio");
    await page.getByRole("link", { name: /Fixture Koi/ }).click();
    const media = page.locator(".viewer__media");
    await expect(media).toHaveAttribute("data-loading");
    await expect(media).toHaveAttribute("aria-busy", "true");
    release();
    await expect(media).not.toHaveAttribute("data-loading");
    await expect(media).not.toHaveAttribute("aria-busy");
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
    await page.getByLabel("Describe the tattoo").fill("A small koi.");
    await page.getByLabel("Name", { exact: true }).fill("Test Person");
    await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");
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
    // A file the browser can't decode is sent as it is (no shrinking).
    await page.getByLabel("Add photos").setInputFiles({
      name: "koi.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-bytes"),
    });
    await expect(page.getByRole("img", { name: /koi\.png/ })).toBeVisible();
    await page.getByText("Add details (optional)").click();
    await page.getByLabel("Placement").fill("Inner left forearm");
    await page.getByText("Medium", { exact: true }).click();
    // The chip, not the "Color" legend above it.
    await page.locator(".choice-chip", { hasText: /^Color$/ }).click();
    await page.getByLabel(/covers up or reworks/).check();
    await page.getByLabel("Artist").selectOption("Fixture One");
    await page.getByLabel("Budget").fill("$300 to $500");
    await page.getByText("Text me", { exact: true }).click();
    await page.getByLabel("Phone number").fill("555-0100");
    await page.getByRole("button", { name: "Send request" }).click();

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
    expect(field("topic")).toBe("A new tattoo");
    expect(field("contact-method")).toBe("Text me");
    expect(field("name")).toBe("Test Person");
    expect(field("email")).toBe("test@example.com");
    expect(field("phone")).toBe("555-0100");
    expect(field("artist")).toBe("Fixture One");
    expect(field("message")).toBe("A small koi.");
    expect(field("placement")).toBe("Inner left forearm");
    expect(field("size")).toBe("Medium");
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
    await page.getByLabel("Add photos").setInputFiles({
      name: "huge.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(8 * 1024 * 1024),
    });
    await expect(page.getByRole("img", { name: /huge\.jpg/ })).toBeVisible();
    await page.getByRole("button", { name: "Send request" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "photos add up to" }),
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
    await page.getByRole("button", { name: "Send request" }).click();

    // Next's route announcer is also role="alert", so match on the message.
    await expect(
      page.getByRole("alert").filter({ hasText: "send your request" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    // What was typed is still there to send again.
    await expect(page.getByLabel("Describe the tattoo")).toHaveValue(
      "A small koi.",
    );
    const button = page.getByRole("button", { name: "Send request" });
    await expect(button).toBeEnabled();
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
  });

  test("marks invalid fields inline and clears each as it is fixed", async ({
    page,
  }) => {
    let posts = 0;
    await page.route("**/__forms.html", (route) => {
      if (route.request().method() === "POST") posts += 1;
      return route.continue();
    });

    await open(page, "/contact");
    await page.getByRole("button", { name: "Send request" }).click();

    // Three required fields are empty. Nothing is posted, the first invalid
    // field takes focus, and the count is announced once (and shown by Send).
    expect(posts).toBe(0);
    const message = page.getByLabel("Describe the tattoo");
    const name = page.getByLabel("Name", { exact: true });
    const email = page.getByRole("textbox", { name: "Email" });
    await expect(message).toBeFocused();
    await expect(message).toHaveAccessibleDescription(
      /Tell us what you have in mind\./,
    );
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Enter your name.");
    await expect(email).toHaveAccessibleDescription(
      "Enter your email address.",
    );
    await expect(
      page.getByRole("status").filter({ hasText: "need attention" }),
    ).toHaveText("3 fields need attention.");
    await expect(
      page.getByText("3 fields need attention. They’re marked above."),
    ).toBeVisible();

    // Not color alone: the message is text, and the border is thicker.
    const ring = (control: typeof name) =>
      control.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(await ring(name)).not.toBe("none");
    expect(await ring(page.getByLabel("Photo 1"))).toBe("none");

    // The error state has to pass axe (contrast of the red text and border).
    // Reduced motion: buttons transition-colors, and axe must not catch a
    // momentary mid-transition frame.
    await page.emulateMedia({ reducedMotion: "reduce" });
    {
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    }

    // Typing fixes the name and its error goes away; the others stay.
    await name.fill("Test Person");
    await expect(name).not.toHaveAttribute("aria-invalid");
    await expect(page.getByText("Enter your name.")).toHaveCount(0);
    await expect(email).toHaveAttribute("aria-invalid", "true");

    // A malformed email swaps the message rather than clearing it.
    await email.fill("nope");
    await expect(email).toHaveAccessibleDescription(
      "Enter an email address like name@example.com.",
    );
    await email.fill("test@example.com");
    await expect(email).not.toHaveAttribute("aria-invalid");
  });

  test("checked boxes are drawn in the foreground role, not browser blue", async ({
    page,
  }) => {
    await open(page, "/contact");
    {
      const { accent, foreground } = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--foreground)";
        document.body.append(probe);
        const foreground = getComputedStyle(probe).color;
        probe.remove();
        return {
          accent: getComputedStyle(document.documentElement).accentColor,
          foreground,
        };
      });
      expect(accent).toBe(foreground);
    }
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
    const button = page.getByRole("button", { name: /Send request|Sending/ });
    await button.focus();
    await page.keyboard.press("Enter");

    // aria-disabled, not native disabled, so focus stays on the button.
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeFocused();
    await expect(
      page.getByRole("status").filter({ hasText: "Sending your request" }),
    ).toHaveText("Sending your request…");

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
          // A visually hidden input inside its label (the photo picker's
          // "Add photos" button): the label is the target, checked as a link
          // or button would be.
          if (el.classList.contains("visually-hidden") && el.closest("label")) {
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

      // Choice chips look 36px but their ::after makes the target 44px.
      const smallChips = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".choice-chip")]
          .filter(
            (el) =>
              el.getBoundingClientRect().height > 0 &&
              parseFloat(getComputedStyle(el, "::after").height) < 43.5,
          )
          .map((el) => (el.textContent ?? "").trim()),
      );
      expect(smallChips).toEqual([]);
    });
  }
});

test("the topbar shows the walk-in status", async ({ page }) => {
  // Wednesday 3pm Central: open, so the status mentions walk-ins.
  await page.clock.setFixedTime(new Date("2026-11-25T21:00:00Z"));
  // The footer's scroll reveal leaves its links part-clipped mid-scroll,
  // which axe reads as obscured targets; reduced motion shows it settled
  // (as in a11y.spec.ts).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/");

  const topbar = page.locator(".site-topbar");
  await expect(topbar).toBeVisible();
  await expect(topbar.getByRole("link", { name: /walk-in/i })).toHaveAttribute(
    "href",
    "/contact",
  );

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("header: compact topbar and a sticky nav row on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  const topbar = await page.locator(".site-topbar").boundingBox();
  // 44px: the topbar's links are standalone 44px targets.
  expect(topbar?.height).toBe(44);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const row = await page.locator(".site-header__inner").boundingBox();
  expect(row?.y).toBe(0);
});

test.describe("artists page", () => {
  test("splits residents from guests and shows the guest's visiting dates", async ({
    page,
  }) => {
    await open(page, "/artists");
    await expect(
      page.getByRole("heading", { name: "Visiting artists" }),
    ).toBeVisible();
    await expect(page.getByText("Guest · Nov 14–16")).toBeVisible();
  });

  test("offers a match-me CTA and a traveling-tattooer contact", async ({
    page,
  }) => {
    await open(page, "/artists");
    await expect(
      page.getByRole("heading", { name: "Not sure who’s right for you?" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Request an appointment" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("heading", { name: "Traveling tattooer?" }),
    ).toBeVisible();
  });
});

test("phone header: the Menu button opens the nav and Escape closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, "/");
  const toggle = page.getByRole("button", { name: "Menu" });
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(nav).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Artists" })).toBeVisible();
  // Full-screen overlay: the page behind is locked and inert.
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("main")).toHaveAttribute("inert", "");

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(nav).toBeHidden();
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});

test.describe("filmstrip", () => {
  test("is two columns on phones, the odd last frame spanning both", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, "/");
    const items = page.locator(".filmstrip__item");
    const count = await items.count();
    const [a, b, c] = await Promise.all(
      [0, 1, 2].map((i) => items.nth(i).boundingBox()),
    );
    expect(a!.y).toBe(b!.y);
    expect(c!.y).toBeGreaterThan(a!.y);
    expect(c!.x).toBe(a!.x);
    if (count % 2 === 1) {
      const last = (await items.nth(count - 1).boundingBox())!;
      expect(last.width).toBeGreaterThan(a!.width * 2);
    }
  });

  test("is three columns from sm to lg", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await open(page, "/");
    const items = page.locator(".filmstrip__item");
    const [a, b, c, d] = await Promise.all(
      [0, 1, 2, 3].map((i) => items.nth(i).boundingBox()),
    );
    expect(a!.y).toBe(c!.y);
    expect(d!.y).toBeGreaterThan(a!.y);
    expect(d!.x).toBe(a!.x);
  });

  test("widens the hovered or focused frame on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/");
    const items = page.locator(".filmstrip__item");
    const width = async (i: number) =>
      (await items.nth(i).boundingBox())!.width;

    const resting = await width(0);
    expect(await width(1)).toBeCloseTo(resting, 0);

    await items.nth(2).hover();
    await expect.poll(() => width(2)).toBeGreaterThan(resting * 2);
    expect(await width(0)).toBeLessThan(resting);

    await page.mouse.move(0, 0);
    await expect.poll(() => width(2)).toBeCloseTo(resting, 0);

    await items.nth(4).getByRole("link").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect.poll(() => width(4)).toBeGreaterThan(resting * 2);
  });
});

test("opening and closing a piece from the filmstrip keeps the scroll position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  const frame = page.locator(".filmstrip__frame").nth(1);
  await frame.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);

  const href = await frame.getAttribute("href");
  await frame.click();
  await expect(page).toHaveURL(href!);
  await expect(page.locator("dialog[open]")).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test.describe("scroll conceal", () => {
  // The artist photo (like a page hero's) stays put on screen while its
  // frame scrolls away; with reduced motion it scrolls like anything else.
  async function measure(page: Page, y: number) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    return page.evaluate(() => {
      const frame = document.querySelector(".artist-profile__photo")!;
      const layer = frame.querySelector(".scroll-conceal__content")!;
      return {
        frame: frame.getBoundingClientRect().top,
        layer: layer.getBoundingClientRect().top,
        height: document.documentElement.scrollHeight,
      };
    });
  }

  test("the photo stays put while its frame scrolls away", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    await page.goto("/artists/ty-morse");
    const start = await measure(page, 0);
    const later = await measure(page, 300);
    expect(Math.round(later.frame)).toBe(Math.round(start.frame - 300));
    expect(Math.round(later.layer)).toBe(Math.round(start.layer));
    // Moving the photo down doesn't make the page any longer.
    expect(later.height).toBe(start.height);
  });

  test("with reduced motion the photo scrolls with its frame", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1512, height: 900 });
    await page.goto("/artists/ty-morse");
    const start = await measure(page, 0);
    const later = await measure(page, 300);
    expect(Math.round(later.layer)).toBe(Math.round(start.layer - 300));
  });
});

test("the artist filter stays on the portfolio page and keeps the scroll position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/portfolio");
  const tiles = page.locator(".piece-grid > li");
  const all = await tiles.count();
  await page.evaluate(() => window.scrollTo(0, 300));
  await page
    .getByRole("navigation", { name: "Filter portfolio by artist" })
    .getByRole("link", { name: "Fixture One" })
    .click();
  await expect(page).toHaveURL(/\/portfolio\?artist=zz-fixture-one$/);
  await expect(
    page.getByRole("link", { name: "Fixture One", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect.poll(() => tiles.count()).toBeLessThan(all);
  // Not sent back to the top. The browser may nudge it a few pixels to keep
  // the same content in view as the grid shrinks (scroll anchoring), and a
  // short grid can pull the bottom of the page up past 300.
  const { y, max } = await page.evaluate(() => ({
    y: window.scrollY,
    max: document.documentElement.scrollHeight - window.innerHeight,
  }));
  expect(y).toBeGreaterThan(Math.min(300, max) - 20);
});

test("an artist's old portfolio address redirects to the filtered portfolio", async ({
  page,
}) => {
  await page.goto("/artists/zz-fixture-one/portfolio");
  await expect(page).toHaveURL(/\/portfolio\?artist=zz-fixture-one$/);
});

test.describe("contact page", () => {
  test("a question hides the tattoo fields and changes the wording", async ({
    page,
  }) => {
    await open(page, "/contact");
    const details = page.getByText("Add details (optional)");
    await expect(details).toBeVisible();
    await page.getByText("A question", { exact: true }).click();
    await expect(details).toBeHidden();
    await expect(page.getByText("Photos (optional)")).toBeHidden();
    await expect(page.getByLabel("What would you like to know?")).toBeVisible();
  });

  test("choosing a text reply makes the phone number required", async ({
    page,
  }) => {
    await open(page, "/contact");
    await page.getByLabel("Describe the tattoo").fill("A swallow");
    await page.getByLabel("Name", { exact: true }).fill("Test");
    await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");
    const phone = page.getByLabel("Phone number");
    await expect(phone).toBeHidden();
    await page.getByText("Text me", { exact: true }).click();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(phone).toBeFocused();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await phone.fill("715 555 0100");
    await expect(phone).not.toHaveAttribute("aria-invalid", "true");
  });

  test("optional details start folded and open on request", async ({
    page,
  }) => {
    await open(page, "/contact");
    const size = page.getByRole("group", { name: "Size" });
    await expect(size).toBeHidden();
    await page.getByText("Add details (optional)").click();
    await expect(size).toBeVisible();
  });

  test("?artist= preselects that artist", async ({ page }) => {
    await open(page, "/contact?artist=zz-fixture-one");
    // Kept outside the folded details, so it's seen.
    const artist = page.getByLabel("Artist (optional)");
    await expect(artist).toBeVisible();
    await expect(artist).toHaveValue("Fixture One");
  });
});

test.describe("entrances", () => {
  test("the home artists section holds until scrolled to, then plays once", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, "/");
    const section = page.locator(".artists-teaser");
    await expect(section).toHaveAttribute("data-reveal", "pending");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-reveal", "play");
    await page.evaluate(() => window.scrollTo(0, 0));
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-reveal", "play");
  });

  test("nothing waits on an entrance without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const route of ["/", "/artists", "/portfolio", "/faq", "/aftercare"]) {
      await page.goto(route);
      const hidden = await page
        .locator(
          ".filmstrip__frame, .artists-teaser__photo, .artists-teaser__content > *, .piece-tile__media, .artist-card__media, .artist-card > *, .faq__item, .aftercare-step",
        )
        .evaluateAll(
          (parts) =>
            parts.filter((part) => {
              const style = getComputedStyle(part);
              return style.clipPath !== "none" || style.opacity !== "1";
            }).length,
        );
      expect(hidden, route).toBe(0);
    }
    await context.close();
  });
});

test("page transitions run between pages, not when a piece opens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  await page.evaluate(() => {
    const counted = window as unknown as { transitions: number };
    counted.transitions = 0;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update) => {
      counted.transitions += 1;
      return start(update);
    }) as typeof document.startViewTransition;
  });
  const transitions = () =>
    page.evaluate(
      () => (window as unknown as { transitions: number }).transitions,
    );

  await page.locator(".filmstrip__frame").first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  expect(await transitions()).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Artists" })
    .click();
  await expect(page).toHaveURL(/\/artists$/);
  expect(await transitions()).toBe(1);
});
