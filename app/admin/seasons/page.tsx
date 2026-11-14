"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Season {
  id: number;
  number: number;
  theme: string;
  startDate: string | null;
  endDate: string | null;
  _count?: { albums: number };
}

// ISO timestamp → "YYYY-MM-DD" for <input type="date">; "" when absent.
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const fmt = (s: string) => new Date(s).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });
  return `${start ? fmt(start) : "?"} — ${end ? fmt(end) : "?"}`;
}

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTheme, setEditTheme] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New season form
  const [newNumber, setNewNumber] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/seasons");
    const data = await res.json();
    setSeasons(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(s: Season) {
    setEditingId(s.id);
    setEditTheme(s.theme);
    setEditStart(toDateInput(s.startDate));
    setEditEnd(toDateInput(s.endDate));
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTheme("");
    setEditStart("");
    setEditEnd("");
  }

  async function saveEdit(id: number) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/seasons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: editTheme,
        startDate: editStart || null,
        endDate: editEnd || null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      await load();
    } else {
      const data = await res.json();
      setError(data.error || "Помилка збереження");
    }
    setSaving(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newNumber || !newTheme.trim()) return;
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: Number(newNumber),
        theme: newTheme.trim(),
        startDate: newStart || null,
        endDate: newEnd || null,
      }),
    });
    if (res.ok) {
      setNewNumber("");
      setNewTheme("");
      setNewStart("");
      setNewEnd("");
      await load();
    } else {
      const data = await res.json();
      setAddError(data.error || "Помилка");
    }
    setAdding(false);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Сезони</h1>
        <p className="text-sm text-muted-foreground mt-1">{seasons.length} сезонів</p>
      </div>

      {/* Add season */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-sm">Додати сезон</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="w-20">
              <Label htmlFor="num" className="text-xs text-muted-foreground">Номер</Label>
              <Input
                id="num"
                type="number"
                min="1"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="9"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="theme" className="text-xs text-muted-foreground">Тема</Label>
              <Input
                id="theme"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Назва теми"
              />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="start" className="text-xs text-muted-foreground">Початок (необов&apos;язково)</Label>
              <Input id="start" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label htmlFor="end" className="text-xs text-muted-foreground">Кінець (необов&apos;язково)</Label>
              <Input id="end" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <Button type="submit" disabled={adding || !newNumber || !newTheme.trim()}>
              {adding ? "…" : "Додати"}
            </Button>
          </div>
        </form>
        {addError && <p className="text-sm text-destructive">{addError}</p>}
      </div>

      {/* Seasons list */}
      <div className="rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
        ) : seasons.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Сезонів немає</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 font-medium w-16">#</th>
                <th className="text-left py-2 px-4 font-medium">Тема / дати</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground w-20">
                  Альбоми
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{s.number}</td>
                  <td className="py-2.5 px-4">
                    {editingId === s.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editTheme}
                          onChange={(e) => setEditTheme(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Тема"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Початок</Label>
                            <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Кінець</Label>
                            <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="h-8 text-sm" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{s.theme}</span>
                        {formatRange(s.startDate, s.endDate) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatRange(s.startDate, s.endDate)}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">
                    {s._count?.albums ?? 0}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {editingId === s.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Скас.
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => saveEdit(s.id)}
                          disabled={saving}
                        >
                          {saving ? "…" : "Зберегти"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => startEdit(s)}
                      >
                        Ред.
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <p className="text-sm text-destructive p-4">{error}</p>}
      </div>
    </div>
  );
}
