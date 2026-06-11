import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getAdminStats() {
  const [seasons, albums, participants, scores, reviews] = await Promise.all([
    prisma.season.count(),
    prisma.album.count(),
    prisma.participant.count(),
    prisma.score.count(),
    prisma.review.count(),
  ]);
  return { seasons, albums, participants, scores, reviews };
}

const sections = [
  {
    href: "/admin/seasons",
    title: "Сезони",
    description: "Додавати та редагувати сезони",
  },
  {
    href: "/admin/albums",
    title: "Альбоми",
    description: "Керувати альбомами, вказувати переможця та хто загадав",
  },
  {
    href: "/admin/scores",
    title: "Оцінки",
    description: "Вводити оцінки учасників для кожного альбому",
  },
  {
    href: "/admin/reviews",
    title: "Рецензії",
    description: "Додавати та редагувати рецензії учасників",
  },
  {
    href: "/admin/participants",
    title: "Учасники",
    description: "Керувати списком учасників",
  },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Галас Музична Рулетка — адмін-панель
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Сезонів", value: stats.seasons },
          { label: "Альбомів", value: stats.albums },
          { label: "Учасників", value: stats.participants },
          { label: "Оцінок", value: stats.scores },
          { label: "Рецензій", value: stats.reviews },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Розділи
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border p-4 hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <div className="font-semibold text-sm">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
