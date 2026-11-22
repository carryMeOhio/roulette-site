"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Full-page navigation so the browser sends the freshly-set session
        // cookie through the auth proxy; a soft router.push can race the
        // cookie (and router.refresh) and leave the user stuck on the login
        // page until a full navigation occurs.
        window.location.assign("/admin");
        return;
      } else {
        const data = await res.json();
        setError(data.error || "Невірний пароль");
      }
    } catch {
      setError("Помилка з'єднання");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm bg-background rounded-xl border shadow-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Адмін-панель</h1>
          <p className="text-sm text-muted-foreground">Галас Музична Рулетка</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль"
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Вхід…" : "Увійти"}
          </Button>
        </form>

        <div className="text-center">
          <a href="/" className="text-xs text-muted-foreground hover:underline">
            ← Повернутися на сайт
          </a>
        </div>
      </div>
    </div>
  );
}
