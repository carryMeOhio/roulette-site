import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Галас | Музична Рулетка",
  description: "Музична рулетка — рейтинги альбомів, рецензії та статистика",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
