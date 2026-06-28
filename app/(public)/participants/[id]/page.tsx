import { notFound } from "next/navigation";
import Link from "next/link";
import { getParticipantById } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";

// Ukrainian plural for "рецензія": 1 → рецензія, 2-4 → рецензії, else → рецензій
function reviewsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "рецензія";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "рецензії";
  return "рецензій";
}

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

  // Group the reviews by season too (rendered as accordions below).
  type Review = (typeof reviews)[number];
  const reviewGroupsMap = new Map<
    number,
    { season: Review["album"]["season"]; reviews: Review[] }
  >();
  for (const r of reviews) {
    const s = r.album.season;
    const g = reviewGroupsMap.get(s.id);
    if (g) g.reviews.push(r);
    else reviewGroupsMap.set(s.id, { season: s, reviews: [r] });
  }
  const reviewGroups = Array.from(reviewGroupsMap.values()).sort(
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

      {/* Reviews, grouped by season as click-to-open accordions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Рецензії</h2>
        {reviewGroups.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
            Рецензій поки немає
          </div>
        ) : (
          <div className="space-y-2">
            {reviewGroups.map((g) => (
              <details
                key={g.season.id}
                className="group rounded-lg border overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none list-none bg-muted/30 hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Badge variant="secondary" className="text-xs">
                      Сезон {g.season.number}
                    </Badge>
                    {g.season.theme}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    {g.reviews.length} {reviewsWord(g.reviews.length)}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t p-3 space-y-3">
                  {g.reviews.map((r) => (
                    <div key={r.id} className="rounded-lg border p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/albums/${r.album.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {r.album.artist} — {r.album.title}
                        </Link>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.createdAt.toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {r.text}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
