import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const { artist, title, submittedById, isWinner, coverUrl } = await request.json();

  const album = await prisma.album.update({
    where: { id: Number(id) },
    data: {
      artist: artist?.trim(),
      title: title?.trim(),
      submittedById: submittedById ? Number(submittedById) : null,
      isWinner: Boolean(isWinner),
      coverUrl: coverUrl || null,
    },
    include: { season: { select: { id: true } } },
  });

  revalidatePath("/");
  revalidatePath(`/albums/${id}`);
  revalidatePath(`/seasons/${album.season.id}`);
  return Response.json(album);
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  await prisma.album.delete({ where: { id: Number(id) } });

  revalidatePath("/");
  revalidatePath("/seasons");
  return Response.json({ ok: true });
}
