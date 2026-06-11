"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Season {
  id: number;
  number: number;
  theme: string;
  _count?: { albums: number };
}

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTheme, setEditTheme] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New season form
  const [newNumber, setNewNumber] = useState("");
  const [newTheme, setNewTheme] = useState("");
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
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTheme("");
  }

  async function saveEdit(id: number) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/seasons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: editTheme }),
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
      body: JSON.stringify({ number: Number(newNumber), theme: newTheme.trim() }),
    });
    if (res.ok) {
      setNewNumber("");
      setNewTheme("");
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
        <form onSubmit={handleAdd} className="flex gap-2 items-end">
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
          <Button type="submit" disabled={adding || !newNumber || !newTheme.trim()}>
            {adding ? "…" : "Додати"}
          </Button>
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
                <th className="text-left py-2 px-4 font-medium">Тема</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground w-20">
                  Альбоми
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{s.number}</td>
                  <td className="py-2.5 px-4">
                    {editingId === s.id ? (
                      <Input
                        value={editTheme}
                        onChange={(e) => setEditTheme(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{s.theme}</span>
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
