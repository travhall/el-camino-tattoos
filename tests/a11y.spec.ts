import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { hydrated, routes } from "./routes";

const tags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

const viewports = {
  phone: { width: 375, height: 812 },
  desktop: { width: 1280, height: 900 },
} as const;

// Every route, in light and dark, on a phone and a desktop: no axe violations.
for (const colorScheme of ["light", "dark"] as const) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test.describe(`${colorScheme} / ${device}`, () => {
      test.use({ colorScheme, viewport });

      for (const route of routes) {
        test(route, async ({ page }) => {
          await page.goto(route);
          await page.locator(hydrated).waitFor({ state: "attached" });

          const { violations } = await new AxeBuilder({ page })
            .withTags(tags)
            .analyze();

          expect(
            violations.map(
              (v) =>
                `${v.id} (${v.impact}): ${v.nodes
                  .slice(0, 3)
                  .map((n) => n.target.join(" "))
                  .join(" | ")}`,
            ),
          ).toEqual([]);
        });
      }
    });
  }
}
