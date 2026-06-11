"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Season { id: number; number: number; theme: string }
interface Participant { id: number; name: string }
interface Album {
  id: number;
  artist: string;
  title: string;
  isWinner: boolean;
  coverUrl: string | null;
  submittedBy: { id: number; name: string } | null;
}

export default function AdminAlbumsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Add form state
  const [newArtist, setNewArtist] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubmittedBy, setNewSubmittedBy] = useState("");
  const [newIsWinner, setNewIsWinner] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editArtist, setEditArtist] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSubmittedBy, setEditSubmittedBy] = useState("");
  const [editIsWinner, setEditIsWinner] = useState(false);
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Cover fetch
  const [fetchingCoverId, setFetchingCoverId] = useState<number | null>(null);
  const [coverMsg, setCoverMsg] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/seasons").then((r) => r.json()),
      fetch("/api/participants").then((r) => r.json()),
    ]).then(([s, p]) => {
      setSeasons(s);
      setParticipants(p);
      if (s.length > 0) setSelectedSeasonId(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) return;
    setLoadingAlbums(true);
    setEditingId(null);
    fetch(`/api/albums?seasonId=${selectedSeasonId}`)
      .then((r) => r.json())
      .then((data) => {
        setAlbums(data);
        setLoadingAlbums(false);
      });
  }, [selectedSeasonId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSeasonId || !newArtist.trim() || !newTitle.trim()) return;
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId: selectedSeasonId,
        artist: newArtist.trim(),
        title: newTitle.trim(),
        submittedById: newSubmittedBy ? Number(newSubmittedBy) : null,
        isWinner: newIsWinner,
      }),
    });
    if (res.ok) {
      setNewArtist("");
      setNewTitle("");
      setNewSubmittedBy("");
      setNewIsWinner(false);
      const data = await fetch(`/api/albums?seasonId=${selectedSeasonId}`).then((r) => r.json());
      setAlbums(data);
    } else {
      const data = await res.json();
      setAddError(data.error || "Помилка");
    }
    setAdding(false);
  }

  function startEdit(a: Album) {
    setEditingId(a.id);
    setEditArtist(a.artist);
    setEditTitle(a.title);
    setEditSubmittedBy(a.submittedBy?.id.toString() ?? "");
    setEditIsWinner(a.isWinner);
    setEditCoverUrl(a.coverUrl ?? "");
    setSaveError("");
  }

  async function saveEdit(id: number) {
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/albums/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist: editArtist.trim(),
        title: editTitle.trim(),
        submittedById: editSubmittedBy ? Number(editSubmittedBy) : null,
        isWinner: editIsWinner,
        coverUrl: editCoverUrl.trim() || null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      const data = await fetch(`/api/albums?seasonId=${selectedSeasonId}`).then((r) => r.json());
      setAlbums(data);
    } else {
      const data = await res.json();
      setSaveError(data.error || "Помилка збереження");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    await fetch(`/api/albums/${id}`, { method: "DELETE" });
    setDeletingId(null);
    const data = await fetch(`/api/albums?seasonId=${selectedSeasonId}`).then((r) => r.json());
    setAlbums(data);
  }

  async function handleFetchCover(id: number) {
    setFetchingCoverId(id);
    setCoverMsg((prev) => ({ ...prev, [id]: "" }));
    const res = await fetch(`/api/albums/${id}/cover`, { method: "POST" });
    if (res.ok) {
      setCoverMsg((prev) => ({ ...prev, [id]: "Знайдено" }));
      const data = await fetch(`/api/albums?seasonId=${selectedSeasonId}`).then((r) => r.json());
      setAlbums(data);
    } else {
      const data = await res.json();
      setCoverMsg((prev) => ({ ...prev, [id]: data.error || "Не знайдено" }));
    }
    setFetchingCoverId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Альбоми</h1>
      </div>

      {/* Season selector */}
      <div className="flex items-center gap-3">
        <Label htmlFor="season-select" className="shrink-0 text-sm font-medium">
          Сезон:
        </Label>
        <select
          id="season-select"
          value={selectedSeasonId ?? ""}
          onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              Сезон {s.number} — {s.theme}
            </option>
          ))}
        </select>
      </div>

      {/* Add album form */}
      {selectedSeasonId && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Додати альбом</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="artist" className="text-xs text-muted-foreground">Виконавець</Label>
                <Input
                  id="artist"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="Artist Name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs text-muted-foreground">Альбом</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Album Title"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="submitted-by" className="text-xs text-muted-foreground">
                  Загадав
                </Label>
                <select
                  id="submitted-by"
                  value={newSubmittedBy}
                  onChange={(e) => setNewSubmittedBy(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— невідомо —</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsWinner}
                    onChange={(e) => setNewIsWinner(e.target.checked)}
                    className="rounded"
                  />
                  🏆 Переможець
                </label>
                <Button
                  type="submit"
                  disabled={adding || !newArtist.trim() || !newTitle.trim()}
                >
                  {adding ? "…" : "Додати"}
                </Button>
              </div>
            </div>
          </form>
          {addError && <p className="text-sm text-destructive">{addError}</p>}
        </div>
      )}

      {/* Albums list */}
      <div className="rounded-lg border overflow-hidden">
        {loadingAlbums ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
        ) : albums.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Альбомів у цьому сезоні немає
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Виконавець / Альбом</th>
                  <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Загадав</th>
                  <th className="text-center py-2 px-3 font-medium w-10">🏆</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody>
                {albums.map((a) => (
                  <tr key={a.id} className="border-t">
                    {editingId === a.id ? (
                      <>
                        <td className="py-2 px-3" colSpan={2}>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={editArtist}
                                onChange={(e) => setEditArtist(e.target.value)}
                                placeholder="Виконавець"
                                className="h-8 text-sm"
                              />
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Альбом"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editSubmittedBy}
                                onChange={(e) => setEditSubmittedBy(e.target.value)}
                                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="">— невідомо —</option>
                                {participants.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <Input
                                value={editCoverUrl}
                                onChange={(e) => setEditCoverUrl(e.target.value)}
                                placeholder="Cover URL (необов'язково)"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={editIsWinner}
                            onChange={(e) => setEditIsWinner(e.target.checked)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setEditingId(null)}
                              disabled={saving}
                            >
                              Скас.
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => saveEdit(a.id)}
                              disabled={saving}
                            >
                              {saving ? "…" : "Зберегти"}
                            </Button>
                          </div>
                          {saveError && (
                            <p className="text-xs text-destructive mt-1">{saveError}</p>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3">
                          <div className="font-medium">{a.artist}</div>
                          <div className="text-muted-foreground text-xs">{a.title}</div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground hidden md:table-cell">
                          {a.submittedBy?.name ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {a.isWinner && "🏆"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1 justify-end flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => startEdit(a)}
                            >
                              Ред.
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 text-xs ${a.coverUrl ? "text-green-600" : ""}`}
                              onClick={() => handleFetchCover(a.id)}
                              disabled={fetchingCoverId === a.id}
                              title={a.coverUrl ? "Оновити обкладинку" : "Завантажити обкладинку"}
                            >
                              {fetchingCoverId === a.id ? "…" : a.coverUrl ? "Обкл. ✓" : "Обкл."}
                            </Button>
                            <Button
                              size="sm"
                              variant={deletingId === a.id ? "destructive" : "ghost"}
                              className="h-7 text-xs"
                              onClick={() => handleDelete(a.id)}
                            >
                              {deletingId === a.id ? "Так?" : "Видал."}
                            </Button>
                          </div>
                          {coverMsg[a.id] && (
                            <p className={`text-xs mt-1 text-right ${coverMsg[a.id] === "Знайдено" ? "text-green-600" : "text-muted-foreground"}`}>
                              {coverMsg[a.id]}
                            </p>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
