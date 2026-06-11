import Link from "next/link";
import { getGlobalStats, getTopAlbums, getAllSeasons, fmtScore } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const [stats, topAlbums, seasons] = await Promise.all([
    getGlobalStats(),
    getTopAlbums(10),
    getAllSeasons(),
  ]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Галас Музична Рулетка</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Друзі загадують альбоми анонімно, всі слухають, ставлять оцінки та пишуть рецензії.
          Хто загадав найкращий альбом — переможець сезону.
        </p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Сезонів", value: stats.seasons },
          { label: "Альбомів", value: stats.albums },
          { label: "Учасників", value: stats.participants },
          { label: "Оцінок", value: stats.scores },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 text-center">
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Top-10 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">🏆 Топ-10 альбомів за всі сезони</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 w-8 text-muted-foreground font-medium">#</th>
                <th className="text-left py-2 px-4 font-medium">Альбом</th>
                <th className="text-left py-2 px-4 font-medium hidden sm:table-cell">Сезон</th>
                <th className="text-left py-2 px-4 font-medium hidden sm:table-cell">Загадав</th>
                <th className="text-right py-2 px-4 font-medium">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {topAlbums.map((album, i) => (
                <tr key={album.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground font-mono">{i + 1}</td>
                  <td className="py-3 px-4">
                    <Link href={`/albums/${album.id}`} className="hover:underline font-medium">
                      {album.artist}
                    </Link>
                    <span className="text-muted-foreground"> — </span>
                    <Link href={`/albums/${album.id}`} className="hover:underline">
                      {album.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Link href={`/seasons/${album.season.id}`}>
                      <Badge variant="secondary" className="text-xs">
                        С{album.season.number} · {album.season.theme}
                      </Badge>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                    {album.submittedBy?.name ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ScoreBadge score={album.avg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seasons grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Сезони</h2>
          <Link href="/seasons" className="text-sm text-muted-foreground hover:underline">
            Всі сезони →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {seasons.map((s) => (
            <Link key={s.id} href={`/seasons/${s.id}`} className="group">
              <div className="rounded-lg border p-4 h-full hover:border-foreground/40 hover:shadow-sm transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">
                    Сезон {s.number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s._count.albums} альб.
                  </span>
                </div>
                <div className="font-semibold text-sm leading-tight">{s.theme}</div>
                {s.winner && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    <div className="text-xs text-muted-foreground">🏆 Переможець</div>
                    <div className="text-xs font-medium leading-tight">
                      {s.winner.artist} — {s.winner.title}
                    </div>
                    {s.winner.avg && (
                      <ScoreBadge score={s.winner.avg} size="sm" />
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
