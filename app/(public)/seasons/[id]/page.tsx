import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeasonById, fmtScore } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";

export default async function SeasonPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const season = await getSeasonById(Number(id));
  if (!season) notFound();

  const { albums, participants } = season;

  function formatDate(d: Date | null) {
    if (!d) return "?";
    return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/seasons" className="hover:underline">Сезони</Link>
          <span>/</span>
          <span>Сезон {season.number}</span>
        </div>
        <h1 className="text-2xl font-bold">
          Сезон {season.number}: {season.theme}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(season.startDate)} — {formatDate(season.endDate)} ·{" "}
          {albums.length} альбомів · {participants.length} учасників
        </p>
      </div>

      {/* Winner callout */}
      {albums.find((a) => a.isWinner) && (() => {
        const w = albums.find((a) => a.isWinner)!;
        return (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-amber-700">🏆 Переможець сезону</div>
              <Link href={`/albums/${w.id}`} className="font-semibold hover:underline text-sm">
                {w.artist} — {w.title}
              </Link>
              {w.submittedBy && (
                <div className="text-xs text-amber-700">загадав: {w.submittedBy.name}</div>
              )}
            </div>
            <ScoreBadge score={w.avg} size="lg" className="shrink-0" />
          </div>
        );
      })()}

      {/* Albums ranked list */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Рейтинг альбомів</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-3 w-8 text-muted-foreground font-medium">#</th>
                <th className="text-left py-2 px-3 font-medium">Альбом</th>
                <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Загадав</th>
                <th className="text-right py-2 px-3 font-medium w-20">Оцінок</th>
                <th className="text-right py-2 px-3 font-medium w-24">Середня</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album, i) => (
                <tr
                  key={album.id}
                  className={`border-t hover:bg-muted/30 transition-colors ${
                    album.isWinner ? "bg-amber-50/50" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">
                    {i + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <Link href={`/albums/${album.id}`} className="hover:underline font-medium">
                      {album.artist}
                    </Link>
                    <span className="text-muted-foreground"> — </span>
                    <Link href={`/albums/${album.id}`} className="hover:underline">
                      {album.title}
                    </Link>
                    {album.isWinner && (
                      <span className="ml-2 text-amber-500 text-xs">🏆</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs hidden md:table-cell">
                    {album.submittedBy?.name ?? "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground text-xs">
                    {album.scores.length}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <ScoreBadge score={album.avg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Score matrix */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Таблиця оцінок</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Прокрути вправо щоб побачити всі оцінки
        </p>
        <div className="rounded-lg border overflow-x-auto">
          <table className="text-xs whitespace-nowrap">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-3 font-medium sticky left-0 bg-muted/80 min-w-48">
                  Альбом
                </th>
                {participants.map((p) => (
                  <th
                    key={p.id}
                    className="py-2 px-2 font-medium text-center min-w-16 max-w-20 truncate"
                    title={p.name}
                  >
                    {p.name}
                  </th>
                ))}
                <th className="py-2 px-3 font-medium text-right min-w-20 bg-muted/50">Сер.</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => {
                const scoreByParticipant = new Map(
                  album.scores.map((s) => [s.participant.id, s.value])
                );
                return (
                  <tr key={album.id} className="border-t hover:bg-muted/20">
                    <td className="py-2 px-3 sticky left-0 bg-white font-medium truncate max-w-48 border-r">
                      <Link href={`/albums/${album.id}`} className="hover:underline">
                        {album.artist} — {album.title}
                      </Link>
                    </td>
                    {participants.map((p) => {
                      const v = scoreByParticipant.get(p.id);
                      return (
                        <td key={p.id} className="py-2 px-2 text-center">
                          {v !== undefined ? (
                            <span
                              className={`font-mono ${
                                v >= 8
                                  ? "text-emerald-700 font-semibold"
                                  : v >= 7
                                  ? "text-lime-700"
                                  : v >= 6
                                  ? "text-yellow-700"
                                  : v >= 5
                                  ? "text-orange-600"
                                  : "text-red-600"
                              }`}
                            >
                              {fmtScore(v)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-medium border-l bg-muted/20">
                      <ScoreBadge score={album.avg} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
