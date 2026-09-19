// Flags oversized uploads in public/images so phone photos don't bloat the repo.
// Default: exit 1 (CI). With --warn: print and exit 0 (Netlify build, so an
// editor's publish never breaks the deploy).
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = "public/images";
const MAX_BYTES = 1.5 * 1024 * 1024;
const warnOnly = process.argv.includes("--warn");

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const oversized = [];
for await (const file of walk(ROOT)) {
  const { size } = await stat(file);
  if (size > MAX_BYTES) oversized.push({ file, size });
}

if (oversized.length === 0) {
  console.log(`check-images: all files in ${ROOT} are under 1.5MB.`);
} else {
  const label = warnOnly ? "warning" : "error";
  console.error(`check-images ${label}: files over 1.5MB in ${ROOT}:`);
  for (const { file, size } of oversized) {
    console.error(`  ${(size / 1024 / 1024).toFixed(1)}MB  ${file}`);
  }
  console.error(
    "Resize to about 2400px on the long edge and re-export as JPEG or WebP.",
  );
  if (!warnOnly) process.exit(1);
}
