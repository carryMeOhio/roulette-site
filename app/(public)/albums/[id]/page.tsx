import { notFound } from "next/navigation";
import Link from "next/link";
import { getAlbumById, calcAvg, fmtScore } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { scoreColorClass } from "@/lib/score";

export default async function AlbumPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const album = await getAlbumById(Number(id));
  if (!album) notFound();

  const avg = calcAvg(album.scores);
  const highScore = album.scores[0]?.value ?? null;
  const lowScore = album.scores.length > 0 ? album.scores[album.scores.length - 1].value : null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/seasons" className="hover:underline">Сезони</Link>
        <span>/</span>
        <Link href={`/seasons/${album.season.id}`} className="hover:underline">
          Сезон {album.season.number}: {album.season.theme}
        </Link>
        <span>/</span>
        <span className="text-foreground">{album.title}</span>
      </div>

      {/* Album header */}
      <div className="flex gap-6 items-start">
        {/* Cover art */}
        <div className="shrink-0">
          {album.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.coverUrl}
              alt={`${album.artist} — ${album.title}`}
              width={140}
              height={140}
              className="rounded-lg shadow-md object-cover w-[140px] h-[140px]"
            />
          ) : (
            <div className="w-[140px] h-[140px] rounded-lg bg-muted flex items-center justify-center shadow-sm border">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Сезон {album.season.number} · {album.season.theme}
            </Badge>
            {album.isWinner && (
              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">
                🏆 Переможець
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            {album.artist} — {album.title}
          </h1>
          {album.submittedBy && (
            <p className="text-sm text-muted-foreground">
              Загадав: <span className="font-medium text-foreground">{album.submittedBy.name}</span>
            </p>
          )}

          {/* Score summary */}
          {avg !== null && (
            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <div className={`text-3xl font-bold font-mono ${scoreColorClass(avg)}`}>
                  {fmtScore(avg)}
                </div>
                <div className="text-xs text-muted-foreground">Середня оцінка</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-semibold">{album.scores.length}</div>
                <div className="text-xs text-muted-foreground">Оцінок</div>
              </div>
              {highScore !== null && (
                <div className="text-center">
                  <div className="text-xl font-mono font-semibold text-emerald-600">
                    {fmtScore(highScore)}
                  </div>
                  <div className="text-xs text-muted-foreground">Найвища</div>
                </div>
              )}
              {lowScore !== null && (
                <div className="text-center">
                  <div className="text-xl font-mono font-semibold text-red-500">
                    {fmtScore(lowScore)}
                  </div>
                  <div className="text-xs text-muted-foreground">Найнижча</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Оцінки</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 font-medium">Учасник</th>
                <th className="text-right py-2 px-4 font-medium w-32">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {album.scores.map((score) => (
                <tr key={score.participant.name} className="border-t hover:bg-muted/20">
                  <td className="py-2.5 px-4">{score.participant.name}</td>
                  <td className="py-2.5 px-4 text-right">
                    <ScoreBadge score={score.value} />
                  </td>
                </tr>
              ))}
              {avg !== null && (
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="py-2.5 px-4">Середня</td>
                  <td className="py-2.5 px-4 text-right">
                    <ScoreBadge score={avg} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Рецензії</h2>
        {album.reviews.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
            Рецензій поки немає
          </div>
        ) : (
          <div className="space-y-3">
            {album.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{review.participant.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {review.createdAt.toLocaleDateString("uk-UA")}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
