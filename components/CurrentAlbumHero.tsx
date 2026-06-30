import Link from "next/link";
import { getCurrentAlbum } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { ParticipantLink } from "@/components/ParticipantLink";

type CurrentAlbum = NonNullable<Awaited<ReturnType<typeof getCurrentAlbum>>>;

function formatDeadline(d: Date) {
  return d.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CurrentAlbumHero({ album }: { album: CurrentAlbum }) {
  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Зараз слухаємо
        </span>
      </div>

      {/* Album header — big art + name */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <Link href={`/albums/${album.id}`} className="shrink-0">
          {album.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.coverUrl}
              alt={`${album.artist} — ${album.title}`}
              width={220}
              height={220}
              className="rounded-xl shadow-lg object-cover w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]"
            />
          ) : (
            <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-xl bg-muted flex items-center justify-center shadow border">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
          <Link href={`/seasons/${album.season.id}`} className="inline-block">
            <Badge variant="secondary" className="text-xs">
              Сезон {album.season.number} · {album.season.theme}
            </Badge>
          </Link>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            <Link href={`/albums/${album.id}`} className="hover:underline">
              {album.artist} — {album.title}
            </Link>
          </h2>
          {album.submittedBy && (
            <p className="text-sm text-muted-foreground">
              Загадав/ла:{" "}
              <ParticipantLink
                id={album.submittedBy.id}
                name={album.submittedBy.name}
                className="font-medium text-foreground"
              />
            </p>
          )}
          {album.currentUntil && (
            <p className="text-sm">
              <span className="text-muted-foreground">Слухаємо до: </span>
              <span className="font-semibold capitalize">
                {formatDeadline(album.currentUntil)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Live grades */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Поточні оцінки</h3>
          {album.scores.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {album.scores.length} оцінок · середня <ScoreBadge score={album.avg} size="sm" />
            </span>
          )}
        </div>
        {album.scores.length === 0 ? (
          <div className="rounded-lg border bg-background p-5 text-center text-muted-foreground text-sm">
            Оцінок поки немає
          </div>
        ) : (
          <div className="rounded-lg border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">Учасник</th>
                  <th className="text-right py-2 px-4 font-medium w-28">Оцінка</th>
                </tr>
              </thead>
              <tbody>
                {album.scores.map((s) => (
                  <tr key={s.participant.id} className="border-t hover:bg-muted/20">
                    <td className="py-2.5 px-4">
                      <ParticipantLink id={s.participant.id} name={s.participant.name} />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <ScoreBadge score={s.value} />
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="py-2.5 px-4">Середня</td>
                  <td className="py-2.5 px-4 text-right">
                    <ScoreBadge score={album.avg} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
