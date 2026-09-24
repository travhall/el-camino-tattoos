// `pnpm check:contrast`: measures every role pairing in src/styles/roles.css
// against its WCAG target, for light and dark. Reports only; edit roles.css
// freely and run this when you want to know how it landed. CI runs it too.
import { checkContrast, loadInputs, passes } from "./contrast.mjs";

const { rolesCss, ramps } = await loadInputs();
const rows = checkContrast(rolesCss, ramps);

let failures = 0;
for (const row of rows) {
  for (const mode of ["light", "dark"]) {
    if (passes(row, mode)) continue;
    failures++;
    const got = row[mode] === null ? "a role is missing" : `${row[mode]}:1`;
    console.error(
      `FAIL ${mode}: ${row.fg} on ${row.bg} (${row.note}) is ${got}, needs ${row.min}:1`,
    );
  }
}

if (failures > 0) {
  console.error(`\ncheck-contrast: ${failures} failure(s) in roles.css.`);
  process.exit(1);
}
console.log(`check-contrast: ${rows.length} pairings x 2 themes, all pass.`);
