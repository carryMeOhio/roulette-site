import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// GET all scores for an album
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("albumId");
  if (!albumId) return Response.json([]);

  const scores = await prisma.score.findMany({
    where: { albumId: Number(albumId) },
    include: { participant: { select: { id: true, name: true } } },
    orderBy: { participant: { name: "asc" } },
  });
  return Response.json(scores);
}

// POST — batch upsert scores for one album
// body: { albumId, scores: [{ participantId, value }] }
// value === null → delete that score
export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { albumId, scores } = await request.json() as {
    albumId: number;
    scores: { participantId: number; value: number | null }[];
  };

  if (!albumId || !Array.isArray(scores)) {
    return Response.json({ error: "albumId and scores[] required" }, { status: 400 });
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { seasonId: true },
  });

  for (const { participantId, value } of scores) {
    if (value === null || value === undefined) {
      // Delete if it exists
      await prisma.score.deleteMany({
        where: { albumId, participantId },
      });
    } else {
      const clamped = Math.min(10, Math.max(0, value));
      await prisma.score.upsert({
        where: { albumId_participantId: { albumId, participantId } },
        create: { albumId, participantId, value: clamped },
        update: { value: clamped },
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/albums/${albumId}`);
  if (album) revalidatePath(`/seasons/${album.seasonId}`);

  return Response.json({ ok: true });
}
