"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Participant {
  id: number;
  name: string;
  _count: { scores: number; reviews: number; albums: number };
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Delete state
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/participants");
    const data = await res.json();
    setParticipants(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      await load();
    } else {
      const data = await res.json();
      setError(data.error || "Помилка");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setDeleteError("");
    const res = await fetch(`/api/participants/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmingId(null);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Не вдалося видалити");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Учасники</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {participants.length} учасників
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-sm">Додати учасника</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="name" className="sr-only">Ім&apos;я</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ім'я учасника"
            />
          </div>
          <Button type="submit" disabled={saving || !newName.trim()}>
            {saving ? "…" : "Додати"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* List */}
      <div className="rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
        ) : participants.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Учасників немає</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 font-medium">Ім&apos;я</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground w-20">Оцінок</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground w-20">Рецензій</th>
                <th className="py-2 px-4 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-t align-middle">
                  <td className="py-2.5 px-4 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">
                    {p._count.scores}
                  </td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">
                    {p._count.reviews}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {confirmingId === p.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Видалити разом з {p._count.scores} оцінками
                          {p._count.reviews > 0 && ` та ${p._count.reviews} рецензіями`}?
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                        >
                          {deletingId === p.id ? "…" : "Так, видалити"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === p.id}
                          onClick={() => setConfirmingId(null)}
                        >
                          Скасувати
                        </Button>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setConfirmingId(p.id);
                          setDeleteError("");
                        }}
                      >
                        Видалити
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
    </div>
  );
}
