import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");

  const albums = await prisma.album.findMany({
    where: seasonId ? { seasonId: Number(seasonId) } : undefined,
    orderBy: { createdAt: "asc" },
    include: {
      submittedBy: { select: { id: true, name: true } },
      _count: { select: { scores: true, reviews: true } },
    },
  });
  return Response.json(albums);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seasonId, artist, title, submittedById, isWinner } = await request.json();

  if (!seasonId || !artist || !title) {
    return Response.json({ error: "seasonId, artist and title are required" }, { status: 400 });
  }

  const album = await prisma.album.create({
    data: {
      seasonId: Number(seasonId),
      artist: artist.trim(),
      title: title.trim(),
      submittedById: submittedById ? Number(submittedById) : null,
      isWinner: Boolean(isWinner),
    },
  });

  revalidatePath("/");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${seasonId}`);
  return Response.json(album, { status: 201 });
}
