import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fetchCoverUrl } from "@/lib/coverart";
import { revalidatePath } from "next/cache";

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const albumId = Number(id);

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { artist: true, title: true, season: { select: { id: true } } },
  });

  if (!album) {
    return Response.json({ error: "Album not found" }, { status: 404 });
  }

  const coverUrl = await fetchCoverUrl(album.artist, album.title);

  if (!coverUrl) {
    return Response.json({ error: "Cover not found on MusicBrainz" }, { status: 404 });
  }

  await prisma.album.update({ where: { id: albumId }, data: { coverUrl } });
  revalidatePath(`/albums/${albumId}`);

  return Response.json({ coverUrl });
}
