import Link from "next/link";
import { getParticipantStats, getSeasonWinners, getTopAlbums, fmtScore } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { scoreColorClass } from "@/lib/score";

export const metadata = { title: "Статистика | Галас Рулетка" };

export default async function StatsPage() {
  const [participants, winners, topAlbums] = await Promise.all([
    getParticipantStats(),
    getSeasonWinners(),
    getTopAlbums(20),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Переможці сезонів, рейтинг учасників, топ альбомів
        </p>
      </div>

      {/* Season winners */}
      <section>
        <h2 className="text-lg font-semibold mb-3">🏆 Переможці сезонів</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 font-medium">Сезон</th>
                <th className="text-left py-2 px-4 font-medium">Тема</th>
                <th className="text-left py-2 px-4 font-medium">Альбом</th>
                <th className="text-left py-2 px-4 font-medium hidden md:table-cell">Загадав</th>
                <th className="text-right py-2 px-4 font-medium">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((row) => (
                <tr key={row.seasonId} className="border-t hover:bg-muted/20">
                  <td className="py-2.5 px-4 font-mono text-muted-foreground text-xs">
                    <Link href={`/seasons/${row.seasonId}`} className="hover:underline">
                      С{row.seasonNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{row.theme}</td>
                  <td className="py-2.5 px-4">
                    {row.winner ? (
                      <Link href={`/albums/${row.winner.id}`} className="hover:underline font-medium">
                        {row.winner.artist} — {row.winner.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs hidden md:table-cell">
                    {row.winner?.submittedBy?.name ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {row.winner && <ScoreBadge score={row.winner.avg} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Participant leaderboard */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Учасники</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Відсортовано за середньою оцінкою яку людина <em>ставила</em> іншим альбомам
        </p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 font-medium w-8">#</th>
                <th className="text-left py-2 px-4 font-medium">Учасник</th>
                <th className="text-right py-2 px-4 font-medium">Сезонів</th>
                <th className="text-right py-2 px-4 font-medium">Оцінок</th>
                <th className="text-right py-2 px-4 font-medium">Середня</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id} className="border-t hover:bg-muted/20">
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{i + 1}</td>
                  <td className="py-2.5 px-4 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">{p.seasons}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">{p.total}</td>
                  <td className="py-2.5 px-4 text-right">
                    {p.avg !== null && (
                      <span className={`font-mono font-semibold ${scoreColorClass(p.avg)}`}>
                        {fmtScore(p.avg)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top-20 albums */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Топ-20 альбомів</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 w-8 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2 px-4 font-medium">Альбом</th>
                <th className="text-left py-2 px-4 font-medium hidden md:table-cell">Сезон</th>
                <th className="text-right py-2 px-4 font-medium">Оцінок</th>
                <th className="text-right py-2 px-4 font-medium">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {topAlbums.map((album, i) => (
                <tr key={album.id} className="border-t hover:bg-muted/20">
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{i + 1}</td>
                  <td className="py-2.5 px-4">
                    <Link href={`/albums/${album.id}`} className="hover:underline font-medium">
                      {album.artist} — {album.title}
                    </Link>
                    {album.isWinner && <span className="ml-1.5 text-amber-500 text-xs">🏆</span>}
                  </td>
                  <td className="py-2.5 px-4 hidden md:table-cell">
                    <Link href={`/seasons/${album.season.id}`}>
                      <Badge variant="secondary" className="text-xs">
                        С{album.season.number}
                      </Badge>
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground text-xs">
                    {album.scores.length}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <ScoreBadge score={album.avg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
