"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBadge } from "@/components/ScoreBadge";

interface Season { id: number; number: number; theme: string }
interface Album { id: number; artist: string; title: string }
interface Participant { id: number; name: string }
interface Score { id: number; participantId: number; value: number }
interface Review { id: number; participantId: number; text: string }

export default function AdminEntriesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [existingScores, setExistingScores] = useState<Score[]>([]);
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);
  const [scoreDraft, setScoreDraft] = useState<Record<number, string>>({});
  const [reviewDraft, setReviewDraft] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

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

  const loadEntries = useCallback(async (albumId: number) => {
    setLoading(true);
    const [scores, reviews]: [Score[], Review[]] = await Promise.all([
      fetch(`/api/scores?albumId=${albumId}`).then((r) => r.json()),
      fetch(`/api/reviews?albumId=${albumId}`).then((r) => r.json()),
    ]);
    setExistingScores(scores);
    setExistingReviews(reviews);
    const sd: Record<number, string> = {};
    for (const s of scores) sd[s.participantId] = String(s.value);
    setScoreDraft(sd);
    const rd: Record<number, string> = {};
    for (const r of reviews) rd[r.participantId] = r.text;
    setReviewDraft(rd);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedAlbumId) return;
    loadEntries(selectedAlbumId);
  }, [selectedAlbumId, loadEntries]);

  async function handleSaveAll() {
    if (!selectedAlbumId) return;
    setSaving(true);
    setSavedMsg("");

    // 1. Scores — one batch request ("" / invalid → null → deletes the score).
    const scores = participants.map((p) => {
      const raw = scoreDraft[p.id];
      if (raw === undefined || raw === "") return { participantId: p.id, value: null };
      const n = parseFloat(raw);
      return { participantId: p.id, value: isNaN(n) ? null : n };
    });
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: selectedAlbumId, scores }),
    });

    // 2. Reviews — only the changed ones: upsert new text, delete emptied ones.
    const reviewOps: Promise<unknown>[] = [];
    for (const p of participants) {
      const existing = existingReviews.find((r) => r.participantId === p.id);
      const draftText = (reviewDraft[p.id] ?? "").trim();
      const originalText = (existing?.text ?? "").trim();
      if (draftText === originalText) continue;
      if (draftText === "" && existing) {
        reviewOps.push(fetch(`/api/reviews/${existing.id}`, { method: "DELETE" }));
      } else if (draftText !== "") {
        reviewOps.push(
          fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ albumId: selectedAlbumId, participantId: p.id, text: draftText }),
          })
        );
      }
    }
    await Promise.all(reviewOps);

    await loadEntries(selectedAlbumId);
    setSavedMsg("Збережено ✓");
    setTimeout(() => setSavedMsg(""), 2500);
    setSaving(false);
  }

  const scoreCount = participants.filter((p) => (scoreDraft[p.id] ?? "") !== "").length;
  const reviewCount = participants.filter((p) => (reviewDraft[p.id] ?? "").trim() !== "").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Оцінки та рецензії</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Виберіть сезон та альбом — вводьте оцінки (0–10) і рецензії для кожного
          учасника, потім збережіть усе разом.
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

      {/* Per-participant entries */}
      {selectedAlbumId && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
          ) : (
            <>
              <div className="space-y-3">
                {participants.map((p) => {
                  const draftVal = scoreDraft[p.id] ?? "";
                  const draftNum = draftVal !== "" ? parseFloat(draftVal) : null;
                  const existingScore = existingScores.find((s) => s.participantId === p.id);
                  return (
                    <div key={p.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-sm">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Оцінка</Label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={draftVal}
                            onChange={(e) =>
                              setScoreDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            placeholder="—"
                            className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {draftNum !== null && !isNaN(draftNum) ? (
                            <ScoreBadge score={draftNum} size="sm" />
                          ) : existingScore ? (
                            <span className="text-xs text-muted-foreground">
                              було {existingScore.value} (очиститься)
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Textarea
                        value={reviewDraft[p.id] ?? ""}
                        onChange={(e) =>
                          setReviewDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        rows={2}
                        placeholder="Рецензія (необов'язково)…"
                        className="text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-4 flex items-center gap-3 rounded-lg border bg-background/90 backdrop-blur px-3 py-2.5 shadow-sm">
                <Button onClick={handleSaveAll} disabled={saving}>
                  {saving ? "Збереження…" : "Зберегти все"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {scoreCount} оцінок · {reviewCount} рецензій
                </span>
                {savedMsg && (
                  <span className="text-sm text-green-600 font-medium">{savedMsg}</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Порожнє поле оцінки або рецензії = видалити. Оцінка 0–10 (крок 0.5).
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
