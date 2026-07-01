import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Set the current album (and optional deadline). Enforces a single current
// album by clearing the flag on every other album in one transaction.
export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { albumId, until } = await request.json();
  if (!albumId) {
    return Response.json({ error: "albumId is required" }, { status: 400 });
  }

  const currentUntil = until ? new Date(until) : null;
  if (until && Number.isNaN(currentUntil!.getTime())) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.album.updateMany({
      where: { isCurrent: true, NOT: { id: Number(albumId) } },
      data: { isCurrent: false, currentUntil: null },
    }),
    prisma.album.update({
      where: { id: Number(albumId) },
      data: { isCurrent: true, currentUntil },
    }),
  ]);

  revalidatePath("/");
  return Response.json({ ok: true });
}

// Clear the current album entirely.
export async function DELETE() {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.album.updateMany({
    where: { isCurrent: true },
    data: { isCurrent: false, currentUntil: null },
  });

  revalidatePath("/");
  return Response.json({ ok: true });
}
