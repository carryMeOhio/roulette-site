import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  const seasons = await prisma.season.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { albums: true } } },
  });
  return Response.json(seasons);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { number, theme, startDate, endDate, isActive } = await request.json();

  if (!number || !theme) {
    return Response.json({ error: "number and theme are required" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: {
      number: Number(number),
      theme,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: Boolean(isActive),
    },
  });

  revalidatePath("/");
  revalidatePath("/seasons");
  return Response.json(season, { status: 201 });
}
