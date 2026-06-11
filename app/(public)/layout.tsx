import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
            <span>Галас Рулетка</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/seasons" className="text-foreground/70 hover:text-foreground transition-colors">
              Сезони
            </Link>
            <Link href="/stats" className="text-foreground/70 hover:text-foreground transition-colors">
              Статистика
            </Link>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors text-xs border rounded px-2 py-1"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Галас Музична Рулетка — слухаємо разом
      </footer>
    </div>
  );
}
