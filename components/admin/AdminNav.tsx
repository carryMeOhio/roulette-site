"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/admin", label: "Дашборд", exact: true },
  { href: "/admin/seasons", label: "Сезони" },
  { href: "/admin/albums", label: "Альбоми" },
  { href: "/admin/scores", label: "Оцінки" },
  { href: "/admin/reviews", label: "Рецензії" },
  { href: "/admin/participants", label: "Учасники" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
