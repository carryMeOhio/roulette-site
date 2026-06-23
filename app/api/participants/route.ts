import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { scores: true, reviews: true, albums: true } } },
  });
  return Response.json(participants);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const participant = await prisma.participant.create({
    data: { name: name.trim() },
  });
  return Response.json(participant, { status: 201 });
}
