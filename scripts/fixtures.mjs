// Synthetic content for the end-to-end tests. The site ships with no content,
// so tests seed a couple of artists and pieces (with generated solid-color
// PNGs), build, and remove them afterwards. Everything is namespaced
// `zz-fixture-*`, and cleanup only removes those exact paths.
//
//   node scripts/fixtures.mjs seed
//   node scripts/fixtures.mjs clean
import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const fixtures = {
  artists: [
    {
      slug: "zz-fixture-one",
      name: "Fixture One",
      specialties: ["Fine line", "Blackwork"],
      bio: "A fixture artist used only by the test suite.",
      instagram: "fixture_one",
      order: 1,
      photo: { file: "photo.png", color: [120, 140, 100] },
    },
    {
      slug: "zz-fixture-two",
      name: "Fixture Two",
      specialties: ["Traditional"],
      bio: "Another fixture artist.",
      instagram: "fixture_two",
      order: 2,
    },
  ],
  pieces: [
    {
      slug: "zz-fixture-koi",
      title: "Fixture Koi",
      artist: "zz-fixture-one",
      color: [200, 80, 60],
      style: "Japanese",
      placement: "Forearm",
      date: "2026-08-01",
    },
    {
      slug: "zz-fixture-rose",
      title: "Fixture Rose",
      artist: "zz-fixture-two",
      color: [60, 90, 200],
    },
  ],
};

// FAQ entries are one file each (question and order in frontmatter, the answer
// as the body). Aftercare is a single fixed file, so it is only written when
// it doesn't exist and only removed while it still equals this text: real
// content is never touched.
fixtures.faq = [
  {
    slug: "zz-fixture-deposit",
    question: "How much is a deposit?",
    order: 1,
    answer:
      "A deposit holds your appointment. See the [contact page](/contact) to ask.",
  },
  {
    slug: "zz-fixture-walk-ins",
    question: "Do you take walk-ins?",
    order: 2,
    answer:
      "Sometimes. **Ask first**, because it depends on the day.\n\n- Small pieces are easiest\n- Bring a photo ID",
  },
];

export const aftercareFixture = `## Fixture aftercare

Keep it clean and **do not** pick at it.

### The first days

1. Wash gently
2. Pat dry
3. Apply a thin layer of ointment
`;

function png(width, height, [r, g, b]) {
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array(width).fill([r, g, b]).flat()),
  ]);
  const raw = Buffer.concat(Array(height).fill(row));
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const at = (...parts) => path.join(root, ...parts);

export async function seedFixtures() {
  await mkdir(at("content/artists"), { recursive: true });
  await mkdir(at("content/pieces"), { recursive: true });
  await mkdir(at("content/faq"), { recursive: true });

  for (const faq of fixtures.faq) {
    await writeFile(
      at("content/faq", `${faq.slug}.mdoc`),
      `---\nquestion: ${faq.question}\norder: ${faq.order}\n---\n\n${faq.answer}\n`,
    );
  }
  // "wx" fails if the file exists, which is the point: never overwrite it.
  await writeFile(at("content/aftercare.mdoc"), aftercareFixture, {
    flag: "wx",
  }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });

  for (const artist of fixtures.artists) {
    const lines = [
      `name: ${artist.name}`,
      "specialties:",
      ...artist.specialties.map((s) => `  - ${s}`),
      `bio: ${artist.bio}`,
      `instagram: ${artist.instagram}`,
      `order: ${artist.order}`,
    ];
    if (artist.photo) {
      const dir = at("public/images/artists", artist.slug);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, artist.photo.file),
        png(600, 800, artist.photo.color),
      );
      lines.push(`photo: /images/artists/${artist.slug}/${artist.photo.file}`);
    }
    await writeFile(
      at("content/artists", `${artist.slug}.yaml`),
      `${lines.join("\n")}\n`,
    );
  }

  for (const piece of fixtures.pieces) {
    const dir = at("public/images/pieces", piece.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "image.png"), png(800, 1000, piece.color));
    const lines = [
      `title: ${piece.title}`,
      `artist: ${piece.artist}`,
      `image: /images/pieces/${piece.slug}/image.png`,
      "featured: false",
      `style: ${piece.style ?? '""'}`,
      `placement: ${piece.placement ?? '""'}`,
      `date: ${piece.date ?? "null"}`,
    ];
    await writeFile(
      at("content/pieces", `${piece.slug}.yaml`),
      `${lines.join("\n")}\n`,
    );
  }
}

export async function cleanFixtures() {
  for (const artist of fixtures.artists) {
    await rm(at("content/artists", `${artist.slug}.yaml`), { force: true });
    await rm(at("public/images/artists", artist.slug), {
      recursive: true,
      force: true,
    });
  }
  for (const piece of fixtures.pieces) {
    await rm(at("content/pieces", `${piece.slug}.yaml`), { force: true });
    await rm(at("public/images/pieces", piece.slug), {
      recursive: true,
      force: true,
    });
  }
  for (const faq of fixtures.faq) {
    await rm(at("content/faq", `${faq.slug}.mdoc`), { force: true });
  }
  const aftercare = await readFile(at("content/aftercare.mdoc"), "utf8").catch(
    () => null,
  );
  if (aftercare === aftercareFixture) {
    await rm(at("content/aftercare.mdoc"), { force: true });
  }
  await rmdir(at("content/faq")).catch(() => {});
  // Remove the image folders again only if they're now empty.
  for (const dir of [
    "public/images/artists",
    "public/images/pieces",
    "public/images",
  ]) {
    await rmdir(at(dir)).catch(() => {});
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  if (command === "seed") await seedFixtures();
  else if (command === "clean") await cleanFixtures();
  else {
    console.error("Usage: node scripts/fixtures.mjs seed|clean");
    process.exit(1);
  }
  console.log(`fixtures: ${command} done.`);
}
