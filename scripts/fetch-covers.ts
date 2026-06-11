/**
 * Batch-fetch cover art for all albums that don't have a coverUrl yet.
 * Respects MusicBrainz rate limit (1 req/sec).
 *
 * Usage: npm run covers
 * To re-fetch all (overwrite existing): npm run covers -- --all
 */

import { PrismaClient } from "@prisma/client";
import { fetchCoverUrl } from "../lib/coverart";

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const overwriteAll = process.argv.includes("--all");

  const albums = await prisma.album.findMany({
    where: overwriteAll ? undefined : { coverUrl: null },
    select: { id: true, artist: true, title: true, coverUrl: true },
    orderBy: [{ season: { number: "asc" } }, { id: "asc" }],
  });

  console.log(
    `Fetching covers for ${albums.length} album(s)${overwriteAll ? " (--all mode)" : " without cover"}…\n`
  );

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    const label = `[${i + 1}/${albums.length}] ${album.artist} — ${album.title}`;
    process.stdout.write(`${label} … `);

    const url = await fetchCoverUrl(album.artist, album.title);

    if (url) {
      await prisma.album.update({ where: { id: album.id }, data: { coverUrl: url } });
      console.log(`✓`);
      found++;
    } else {
      console.log(`✗ not found`);
      notFound++;
    }

    // MusicBrainz rate limit: 1 request/second
    // fetchCoverUrl makes up to 4 requests (1 search + 3 cover checks),
    // so wait at least 1.1s after each album.
    if (i < albums.length - 1) {
      await sleep(1100);
    }
  }

  console.log(`\nDone. Found: ${found}, not found: ${notFound}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
