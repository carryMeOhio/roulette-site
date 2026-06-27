import { notFound } from "next/navigation";
import Link from "next/link";
import { getParticipantById } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";

export default async function ParticipantPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const participant = await getParticipantById(Number(id));
  if (!participant) notFound();

  const { name, seasonsParticipated, albums, reviews } = participant;

  // Group the submitted albums by season for display.
  type Album = (typeof albums)[number];
  const groups = new Map<number, { season: Album["season"]; albums: Album[] }>();
  for (const a of albums) {
    const g = groups.get(a.season.id);
    if (g) g.albums.push(a);
    else groups.set(a.season.id, { season: a.season, albums: [a] });
  }
  const seasonGroups = Array.from(groups.values()).sort(
    (x, y) => x.season.number - y.season.number
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/stats" className="hover:underline">
          Статистика
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{name}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground font-mono">
              {seasonsParticipated}
            </strong>{" "}
            {seasonsParticipated === 1 ? "сезон" : "сезонів"}
          </span>
          <span>
            <strong className="text-foreground font-mono">{albums.length}</strong>{" "}
            запропонованих альбомів
          </span>
          <span>
            <strong className="text-foreground font-mono">{reviews.length}</strong>{" "}
            рецензій
          </span>
        </div>
      </div>

      {/* Provided albums, grouped by season */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Запропоновані альбоми</h2>
        {seasonGroups.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
            Немає запропонованих альбомів
          </div>
        ) : (
          <div className="space-y-5">
            {seasonGroups.map((g) => (
              <div key={g.season.id} className="space-y-2">
                <Link
                  href={`/seasons/${g.season.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <Badge variant="secondary" className="text-xs">
                    Сезон {g.season.number}
                  </Badge>
                  {g.season.theme}
                </Link>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {g.albums.map((a) => (
                        <tr
                          key={a.id}
                          className="border-t first:border-t-0 hover:bg-muted/20"
                        >
                          <td className="py-2.5 px-4">
                            <Link
                              href={`/albums/${a.id}`}
                              className="hover:underline font-medium"
                            >
                              {a.artist} — {a.title}
                            </Link>
                            {a.isWinner && (
                              <span className="ml-2 text-amber-500 text-xs">🏆</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right w-24">
                            <ScoreBadge score={a.avg} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Рецензії</h2>
        {reviews.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
            Рецензій поки немає
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/albums/${r.album.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {r.album.artist} — {r.album.title}
                  </Link>
                  <Link href={`/seasons/${r.album.season.id}`} className="shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      С{r.album.season.number}
                    </Badge>
                  </Link>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {r.text}
                </p>
                <div className="text-xs text-muted-foreground">
                  {r.createdAt.toLocaleDateString("uk-UA")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
