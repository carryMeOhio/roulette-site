import { prisma } from "./prisma";

// ─── helpers ────────────────────────────────────────────────────────────────

export function calcAvg(scores: { value: number }[]): number | null {
  if (!scores.length) return null;
  return scores.reduce((s, r) => s + r.value, 0) / scores.length;
}

export function fmtScore(n: number | null): string {
  if (n === null) return "—";
  return Number(n.toFixed(2)).toString();
}

// ─── home ────────────────────────────────────────────────────────────────────

export async function getGlobalStats() {
  const [seasons, albums, scores, participants] = await Promise.all([
    prisma.season.count(),
    prisma.album.count(),
    prisma.score.count(),
    prisma.participant.count({ where: { scores: { some: {} } } }),
  ]);
  return { seasons, albums, scores, participants };
}

export async function getTopAlbums(limit = 10) {
  const albums = await prisma.album.findMany({
    include: {
      scores: { select: { value: true } },
      season: { select: { id: true, number: true, theme: true } },
      submittedBy: { select: { name: true } },
    },
  });

  return albums
    .map((a) => ({ ...a, avg: calcAvg(a.scores) }))
    .filter((a) => a.avg !== null && a.scores.length >= 3)
    .sort((a, b) => b.avg! - a.avg!)
    .slice(0, limit);
}

// ─── seasons list ────────────────────────────────────────────────────────────

export async function getAllSeasons() {
  const seasons = await prisma.season.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { albums: true } },
      albums: {
        where: { isWinner: true },
        include: {
          scores: { select: { value: true } },
          submittedBy: { select: { name: true } },
        },
      },
    },
  });

  return seasons.map((s) => ({
    ...s,
    winner: s.albums[0]
      ? { ...s.albums[0], avg: calcAvg(s.albums[0].scores) }
      : null,
  }));
}

// ─── season detail ────────────────────────────────────────────────────────────

export async function getSeasonById(id: number) {
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      albums: {
        include: {
          scores: {
            include: { participant: { select: { id: true, name: true } } },
            orderBy: { value: "desc" },
          },
          submittedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!season) return null;

  // Build sorted albums with avg
  const albums = season.albums
    .map((a) => ({ ...a, avg: calcAvg(a.scores) }))
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  // Collect unique participants who scored anything in this season
  const participantMap = new Map<number, string>();
  for (const album of albums) {
    for (const score of album.scores) {
      participantMap.set(score.participant.id, score.participant.name);
    }
  }
  const participants = Array.from(participantMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));

  return { ...season, albums, participants };
}

// ─── album detail ─────────────────────────────────────────────────────────────

export async function getAlbumById(id: number) {
  return prisma.album.findUnique({
    where: { id },
    include: {
      season: { select: { id: true, number: true, theme: true } },
      submittedBy: { select: { name: true } },
      scores: {
        include: { participant: { select: { name: true } } },
        orderBy: { value: "desc" },
      },
      reviews: {
        include: { participant: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ─── stats ────────────────────────────────────────────────────────────────────

export async function getParticipantStats() {
  const participants = await prisma.participant.findMany({
    where: { scores: { some: {} } },
    include: {
      scores: {
        select: {
          value: true,
          album: { select: { seasonId: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return participants
    .map((p) => {
      const avg = calcAvg(p.scores);
      const seasons = new Set(p.scores.map((s) => s.album.seasonId)).size;
      return {
        id: p.id,
        name: p.name,
        avg,
        total: p.scores.length,
        seasons,
      };
    })
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
}

export async function getSeasonWinners() {
  const seasons = await prisma.season.findMany({
    orderBy: { number: "asc" },
    include: {
      albums: {
        where: { isWinner: true },
        include: {
          scores: { select: { value: true } },
          submittedBy: { select: { name: true } },
        },
      },
    },
  });

  return seasons.map((s) => ({
    seasonId: s.id,
    seasonNumber: s.number,
    theme: s.theme,
    winner: s.albums[0]
      ? { ...s.albums[0], avg: calcAvg(s.albums[0].scores) }
      : null,
  }));
}
