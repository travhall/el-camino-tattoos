// `pnpm check:contrast`: measures every role pairing in src/styles/roles.css
// against its WCAG target. Reports only; edit roles.css freely and run this
// when you want to know how it landed. CI runs it too.
import { checkContrast, loadInputs, passes } from "./contrast.mjs";

const { rolesCss, ramps } = await loadInputs();
const rows = checkContrast(rolesCss, ramps);

let failures = 0;
for (const row of rows) {
  if (passes(row)) continue;
  failures++;
  const got = row.ratio === null ? "a role is missing" : `${row.ratio}:1`;
  console.error(
    `FAIL: ${row.fg} on ${row.bg} (${row.note}) is ${got}, needs ${row.min}:1`,
  );
}

if (failures > 0) {
  console.error(`\ncheck-contrast: ${failures} failure(s) in roles.css.`);
  process.exit(1);
}
console.log(`check-contrast: ${rows.length} pairings, all pass.`);
