import Link from "next/link";
import { getAllSeasons } from "@/lib/queries";
import { ScoreBadge } from "@/components/ScoreBadge";

export const metadata = { title: "Сезони | Галас Рулетка" };

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start || !end) return "";
  const fmt = (d: Date) =>
    d.toLocaleDateString("uk-UA", { month: "short", year: "numeric" });
  return `${fmt(start)} — ${fmt(end)}`;
}

export default async function SeasonsPage() {
  const seasons = await getAllSeasons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Всі сезони</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {seasons.length} сезонів · натисни на сезон щоб побачити всі альбоми та оцінки
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {seasons.map((s) => (
          <Link key={s.id} href={`/seasons/${s.id}`} className="group">
            <div className="rounded-lg border p-5 hover:border-foreground/40 hover:shadow-sm transition-all h-full space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono text-muted-foreground block mb-0.5">
                    Сезон {s.number}
                  </span>
                  <h2 className="font-semibold text-base leading-tight">{s.theme}</h2>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 font-mono bg-muted px-2 py-0.5 rounded">
                  {s._count.albums} альбомів
                </span>
              </div>

              {/* Dates */}
              <p className="text-xs text-muted-foreground">
                {formatDateRange(s.startDate, s.endDate)}
              </p>

              {/* Winner */}
              {s.winner ? (
                <div className="pt-2 border-t flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs text-muted-foreground">🏆 Переможець</div>
                    <div className="text-sm font-medium leading-tight truncate">
                      {s.winner.artist} — {s.winner.title}
                    </div>
                    {s.winner.submittedBy && (
                      <div className="text-xs text-muted-foreground">
                        загадав/ла: {s.winner.submittedBy.name}
                      </div>
                    )}
                  </div>
                  <ScoreBadge score={s.winner.avg} size="md" className="shrink-0" />
                </div>
              ) : (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Переможець невідомий
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
