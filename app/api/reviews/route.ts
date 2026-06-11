import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("albumId");
  if (!albumId) return Response.json([]);

  const reviews = await prisma.review.findMany({
    where: { albumId: Number(albumId) },
    include: { participant: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(reviews);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { albumId, participantId, text } = await request.json();

  if (!albumId || !participantId || !text?.trim()) {
    return Response.json({ error: "albumId, participantId and text required" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { albumId_participantId: { albumId: Number(albumId), participantId: Number(participantId) } },
    create: { albumId: Number(albumId), participantId: Number(participantId), text: text.trim() },
    update: { text: text.trim() },
  });

  revalidatePath(`/albums/${albumId}`);
  return Response.json(review, { status: 201 });
}
