import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm shrink-0">Адмін</span>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Сайт
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
