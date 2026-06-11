"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Season { id: number; number: number; theme: string }
interface Album { id: number; artist: string; title: string }
interface Participant { id: number; name: string }
interface Review { id: number; participantId: number; text: string }

export default function AdminReviewsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // Per-participant editing state
  const [editingParticipantId, setEditingParticipantId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Add new review
  const [addingParticipantId, setAddingParticipantId] = useState<number | null>(null);
  const [addText, setAddText] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

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
    setSelectedAlbumId(null);
    setAlbums([]);
    fetch(`/api/albums?seasonId=${selectedSeasonId}`)
      .then((r) => r.json())
      .then((data) => {
        setAlbums(data);
        if (data.length > 0) setSelectedAlbumId(data[0].id);
      });
  }, [selectedSeasonId]);

  const loadReviews = useCallback(async (albumId: number) => {
    setLoading(true);
    setEditingParticipantId(null);
    setAddingParticipantId(null);
    const data: Review[] = await fetch(`/api/reviews?albumId=${albumId}`).then((r) => r.json());
    setReviews(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedAlbumId) return;
    loadReviews(selectedAlbumId);
  }, [selectedAlbumId, loadReviews]);

  // Edit existing review
  function startEdit(review: Review) {
    setEditingParticipantId(review.participantId);
    setEditText(review.text);
    setSaveError("");
    setAddingParticipantId(null);
  }

  async function saveEdit(reviewId: number) {
    if (!editText.trim()) return;
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText }),
    });
    if (res.ok) {
      setEditingParticipantId(null);
      if (selectedAlbumId) await loadReviews(selectedAlbumId);
    } else {
      const data = await res.json();
      setSaveError(data.error || "Помилка збереження");
    }
    setSaving(false);
  }

  async function handleDelete(reviewId: number) {
    await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (selectedAlbumId) await loadReviews(selectedAlbumId);
  }

  // Add new review for a participant
  function startAdd(participantId: number) {
    setAddingParticipantId(participantId);
    setAddText("");
    setAddError("");
    setEditingParticipantId(null);
  }

  async function handleAdd(participantId: number) {
    if (!addText.trim() || !selectedAlbumId) return;
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        albumId: selectedAlbumId,
        participantId,
        text: addText,
      }),
    });
    if (res.ok) {
      setAddingParticipantId(null);
      await loadReviews(selectedAlbumId);
    } else {
      const data = await res.json();
      setAddError(data.error || "Помилка");
    }
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Рецензії</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Виберіть сезон та альбом, щоб керувати рецензіями
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Сезон</Label>
          <select
            value={selectedSeasonId ?? ""}
            onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Сезон {s.number} — {s.theme}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Альбом</Label>
          <select
            value={selectedAlbumId ?? ""}
            onChange={(e) => setSelectedAlbumId(Number(e.target.value))}
            disabled={albums.length === 0}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[280px] disabled:opacity-50"
          >
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.artist} — {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews per participant */}
      {selectedAlbumId && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
          ) : (
            participants.map((p) => {
              const review = reviews.find((r) => r.participantId === p.id);
              const isEditing = editingParticipantId === p.id;
              const isAdding = addingParticipantId === p.id;

              return (
                <div key={p.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex gap-1">
                      {review && !isEditing && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => startEdit(review)}
                          >
                            Ред.
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDelete(review.id)}
                          >
                            Видал.
                          </Button>
                        </>
                      )}
                      {!review && !isAdding && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => startAdd(p.id)}
                        >
                          + Додати
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Existing review display */}
                  {review && !isEditing && (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {review.text}
                    </p>
                  )}

                  {/* Edit form */}
                  {isEditing && review && (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="text-sm"
                        autoFocus
                      />
                      {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(review.id)}
                          disabled={saving || !editText.trim()}
                        >
                          {saving ? "…" : "Зберегти"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingParticipantId(null)}
                          disabled={saving}
                        >
                          Скасувати
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Add form */}
                  {isAdding && (
                    <div className="space-y-2">
                      <Textarea
                        value={addText}
                        onChange={(e) => setAddText(e.target.value)}
                        rows={4}
                        placeholder="Текст рецензії…"
                        className="text-sm"
                        autoFocus
                      />
                      {addError && <p className="text-xs text-destructive">{addError}</p>}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAdd(p.id)}
                          disabled={adding || !addText.trim()}
                        >
                          {adding ? "…" : "Додати"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAddingParticipantId(null)}
                          disabled={adding}
                        >
                          Скасувати
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* No review placeholder */}
                  {!review && !isAdding && (
                    <p className="text-xs text-muted-foreground italic">Немає рецензії</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
