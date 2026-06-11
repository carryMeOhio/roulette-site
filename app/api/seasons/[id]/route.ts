import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const { theme, startDate, endDate, isActive } = await request.json();

  const season = await prisma.season.update({
    where: { id: Number(id) },
    data: {
      theme,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: Boolean(isActive),
    },
  });

  revalidatePath("/");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${id}`);
  return Response.json(season);
}
