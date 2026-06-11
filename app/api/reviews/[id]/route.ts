import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const { text } = await request.json();

  const review = await prisma.review.update({
    where: { id: Number(id) },
    data: { text: text.trim() },
    include: { album: { select: { id: true } } },
  });

  revalidatePath(`/albums/${review.album.id}`);
  return Response.json(review);
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const review = await prisma.review.delete({
    where: { id: Number(id) },
    include: { album: { select: { id: true } } },
  });

  revalidatePath(`/albums/${review.album.id}`);
  return Response.json({ ok: true });
}
