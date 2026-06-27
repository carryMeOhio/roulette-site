import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  // Scores and Review have required FKs to Participant (onDelete: Restrict),
  // so remove them first; detach any albums this person submitted; then delete
  // the participant — all atomically.
  await prisma.$transaction([
    prisma.score.deleteMany({ where: { participantId: id } }),
    prisma.review.deleteMany({ where: { participantId: id } }),
    prisma.album.updateMany({ where: { submittedById: id }, data: { submittedById: null } }),
    prisma.participant.delete({ where: { id } }),
  ]);

  // Deleting scores changes album/season averages shown on the static pages.
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/seasons");
  return Response.json({ ok: true });
}
