import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const score = await prisma.score.delete({
    where: { id: Number(id) },
    include: { album: { select: { id: true, seasonId: true } } },
  });

  revalidatePath(`/albums/${score.album.id}`);
  revalidatePath(`/seasons/${score.album.seasonId}`);
  return Response.json({ ok: true });
}
