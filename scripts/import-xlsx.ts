/**
 * One-time import script: reads the historical Excel file and seeds the DB.
 * Run from project root: npm run import
 * Or with custom path:  npm run import -- /path/to/file.xlsx
 */

import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();
const XLSX_PATH =
  process.argv[2] ?? path.join(process.cwd(), "..", "Галас музична рулетка.xlsx");

// ─── Name normalisation ────────────────────────────────────────────────────
// 'Андрій' (used in seasons 1-5) and 'Андрій Н' (seasons 6-8) are the same person.
// 'Андрій О' is a different person and is intentionally left unchanged.
const NAME_ALIASES: Record<string, string> = {
  Андрій: "Андрій Н",
};

function normalizeName(raw: string): string {
  const t = raw.trim();
  return NAME_ALIASES[t] ?? t;
}

// ─── Album name parsing ────────────────────────────────────────────────────
function splitAlbum(raw: string): { artist: string; title: string } {
  const trimmed = raw.trim();
  // Try em-dash " — " first, then regular " - "
  for (const sep of [" — ", " - "]) {
    const idx = trimmed.indexOf(sep);
    if (idx !== -1) {
      return {
        artist: trimmed.slice(0, idx).trim(),
        title: trimmed.slice(idx + sep.length).trim(),
      };
    }
  }
  return { artist: "Unknown", title: trimmed };
}

// ─── Season metadata ───────────────────────────────────────────────────────
const SEASONS = [
  {
    number: 1,
    sheet: "Сезон 1",
    theme: "Загальний",
    startDate: new Date("2022-05-24"),
    endDate: new Date("2022-08-08"),
  },
  {
    number: 2,
    sheet: "Сезон 2 (українські альбоми)",
    theme: "Українські альбоми",
    startDate: new Date("2022-08-16"),
    endDate: new Date("2022-10-28"),
  },
  {
    number: 3,
    sheet: "Сезон 3 (90ті)",
    theme: "90-ті",
    startDate: new Date("2022-11-01"),
    endDate: new Date("2023-01-10"),
  },
  {
    number: 4,
    sheet: "Сезон 4 (готика)",
    theme: "Готика",
    startDate: new Date("2023-01-20"),
    endDate: new Date("2023-03-12"),
  },
  {
    number: 5,
    sheet: "Сезон 5 (жінки в музиці)",
    theme: "Жінки в музиці",
    startDate: new Date("2023-03-28"),
    endDate: new Date("2023-06-13"),
  },
  {
    number: 6,
    sheet: "Сезон 6 (нульові)",
    theme: "Нульові",
    startDate: new Date("2023-07-07"),
    endDate: new Date("2023-09-22"),
  },
  {
    number: 7,
    sheet: "Сезон 7 (non-english)",
    theme: "Non-English",
    startDate: new Date("2023-10-30"),
    endDate: new Date("2024-01-19"),
  },
  {
    number: 8,
    sheet: "Сезон 8 (третій альбом)",
    theme: "Третій альбом",
    startDate: new Date("2024-03-16"),
    endDate: new Date("2024-05-11"),
  },
];

// ─── Known data: season winners ────────────────────────────────────────────
// Used to set Album.isWinner = true
// Values are lowercase "artist:title" for fuzzy matching
const WINNERS: Record<number, string> = {
  1: "magrudergrind:magrudergrind",
  2: "назарій яремчук та віа музики:незрівнянний світ краси",
  3: "only living witness:prone mortal form",
  4: "the cure:disintegration",
  5: "taeko ohnuki:sunshower",
  6: "sum-41:does this look infected?",
  7: "ana frango elétrico:little electric chicken heart",
  8: "at the drive-in:relationship of command",
};

// Known submitters per album (from top-10 sheet + season summary texts)
// Key: "seasonNumber:artist:title" all lowercase, quotes stripped
const SUBMITTED_BY: Record<string, string> = {
  "1:magrudergrind:magrudergrind": "Вова",
  "3:only living witness:prone mortal form": "Микола",
  "4:the cure:disintegration": "Сергій",
  "4:siouxsie and the banshees:juju": "Андрій Н",
  "5:taeko ohnuki:sunshower": "Андрій Н",
  "6:sum-41:does this look infected?": "Андрій Н",
  "6:sleater-kinney:the woods": "Віра",
  "6:deftones:white pony": "Аліна",
  "7:ana frango elétrico:little electric chicken heart": "Андрій Н",
  "8:at the drive-in:relationship of command": "Тарас",
  "8:lounge lizards:voice of chunk": "Кирило",
  "8:electrelane:axes": "Олена",
};

// Strip quotes and lowercase for reliable matching
function normalizeForKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/["""''«»]/g, "")
    .trim();
}

function makeAlbumKey(seasonNum: number, artist: string, title: string): string {
  return `${seasonNum}:${normalizeForKey(artist)}:${normalizeForKey(title)}`;
}

// ─── Column header filter ──────────────────────────────────────────────────
// A valid participant header is a short non-empty string that isn't a summary column.
const SKIP_KEYWORDS = ["середня", "оцінк", "unnamed"];

function isParticipantHeader(h: unknown): h is string {
  if (!h || typeof h !== "string") return false;
  const lower = h.toLowerCase();
  return !SKIP_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nReading: ${XLSX_PATH}\n`);
  const wb = XLSX.readFile(XLSX_PATH);

  // ── Pass 1: collect all participant names across every season ──────────
  const allNames = new Set<string>();
  for (const meta of SEASONS) {
    const ws = wb.Sheets[meta.sheet];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const header = rows[0] as unknown[];
    for (const h of header) {
      if (isParticipantHeader(h)) allNames.add(normalizeName(h));
    }
  }
  // Also ensure submittedBy participants exist
  for (const name of Object.values(SUBMITTED_BY)) allNames.add(name);

  console.log(`Upserting ${allNames.size} participants: ${[...allNames].join(", ")}\n`);
  for (const name of allNames) {
    await prisma.participant.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  // ── Pass 2: process each season ────────────────────────────────────────
  let totalAlbums = 0;
  let totalScores = 0;

  for (const meta of SEASONS) {
    const ws = wb.Sheets[meta.sheet];
    if (!ws) {
      console.warn(`  ⚠ Sheet not found: ${meta.sheet}`);
      continue;
    }

    // Upsert season
    const season = await prisma.season.upsert({
      where: { number: meta.number },
      create: {
        number: meta.number,
        theme: meta.theme,
        startDate: meta.startDate,
        endDate: meta.endDate,
        isActive: false,
      },
      update: {
        theme: meta.theme,
        startDate: meta.startDate,
        endDate: meta.endDate,
      },
    });

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const headerRow = rows[0] as unknown[];

    // Map column index → canonical participant name
    const colMap: Record<number, string> = {};
    for (let i = 1; i < headerRow.length; i++) {
      if (isParticipantHeader(headerRow[i])) {
        colMap[i] = normalizeName(headerRow[i] as string);
      }
    }

    let albumCount = 0;
    let scoreCount = 0;

    for (let ri = 1; ri < rows.length; ri++) {
      const row = rows[ri] as (string | number | null)[];
      const rawName = row[0];

      // Stop at the averages row
      if (!rawName || typeof rawName !== "string") continue;
      const trimmed = rawName.trim();
      if (trimmed === "" ) continue;
      if (trimmed.startsWith("середня")) break;

      // Skip long summary/comment cells (album names are always < 120 chars)
      if (trimmed.length > 120) continue;

      const { artist, title } = splitAlbum(trimmed);
      if (!title) continue;

      const key = makeAlbumKey(meta.number, artist, title);
      const isWinner =
        `${normalizeForKey(artist)}:${normalizeForKey(title)}` === WINNERS[meta.number];

      // Resolve submittedBy
      const submitterName = SUBMITTED_BY[key];
      let submittedById: number | null = null;
      if (submitterName) {
        const p = await prisma.participant.findUnique({ where: { name: submitterName } });
        submittedById = p?.id ?? null;
      }

      // Upsert album
      const album = await prisma.album.upsert({
        where: { seasonId_artist_title: { seasonId: season.id, artist, title } },
        create: { seasonId: season.id, artist, title, isWinner, submittedById },
        update: { isWinner, submittedById },
      });
      albumCount++;

      // Upsert scores
      for (const [colIdxStr, participantName] of Object.entries(colMap)) {
        const val = row[Number(colIdxStr)];
        if (val === null || val === undefined || typeof val !== "number" || isNaN(val)) continue;

        const participant = await prisma.participant.findUnique({
          where: { name: participantName },
        });
        if (!participant) continue;

        await prisma.score.upsert({
          where: { albumId_participantId: { albumId: album.id, participantId: participant.id } },
          create: { albumId: album.id, participantId: participant.id, value: val },
          update: { value: val },
        });
        scoreCount++;
      }
    }

    console.log(
      `  Season ${meta.number} (${meta.theme}): ${albumCount} albums, ${scoreCount} scores`
    );
    totalAlbums += albumCount;
    totalScores += scoreCount;
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const db = {
    seasons: await prisma.season.count(),
    participants: await prisma.participant.count(),
    albums: await prisma.album.count(),
    scores: await prisma.score.count(),
    winners: await prisma.album.count({ where: { isWinner: true } }),
    withSubmitter: await prisma.album.count({ where: { submittedById: { not: null } } }),
  };

  console.log(`
✅ Import complete
   Seasons:      ${db.seasons}
   Participants: ${db.participants}
   Albums:       ${db.albums} (${db.winners} winners marked)
   Scores:       ${db.scores}
   Submitters:   known for ${db.withSubmitter} albums
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
