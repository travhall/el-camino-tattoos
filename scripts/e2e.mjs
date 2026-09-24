// `pnpm test`: seed fixture content, build, run the Playwright suite against
// the built site, and always remove the fixtures afterwards (even on failure
// or Ctrl-C). Extra arguments go to Playwright, e.g. `pnpm test --grep skip`.
import { spawn } from "node:child_process";
import { cleanFixtures, seedFixtures } from "./fixtures.mjs";

const run = (args) =>
  new Promise((resolve) => {
    const child = spawn("pnpm", args, { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
  });

process.on("SIGINT", async () => {
  await cleanFixtures();
  process.exit(130);
});

let exitCode = 1;
try {
  exitCode = await run(["check:contrast"]);
  if (exitCode === 0) {
    await seedFixtures();
    exitCode = await run(["build"]);
  }
  if (exitCode === 0) {
    exitCode = await run([
      "exec",
      "playwright",
      "test",
      ...process.argv.slice(2),
    ]);
  }
} finally {
  await cleanFixtures();
}
process.exit(exitCode);
