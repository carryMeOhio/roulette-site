"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScoreBadge } from "@/components/ScoreBadge";

interface Season { id: number; number: number; theme: string }
interface Album { id: number; artist: string; title: string }
interface Participant { id: number; name: string }
interface Score { id: number; participantId: number; value: number }

export default function AdminScoresPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [existingScores, setExistingScores] = useState<Score[]>([]);
  const [draft, setDraft] = useState<Record<number, string>>({});
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

  const loadScores = useCallback(async (albumId: number) => {
    setLoading(true);
    const scores: Score[] = await fetch(`/api/scores?albumId=${albumId}`).then((r) => r.json());
    setExistingScores(scores);
    // Initialise draft from existing scores
    const initial: Record<number, string> = {};
    for (const s of scores) {
      initial[s.participantId] = String(s.value);
    }
    setDraft(initial);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedAlbumId) return;
    loadScores(selectedAlbumId);
  }, [selectedAlbumId, loadScores]);

  function handleScoreChange(participantId: number, value: string) {
    setDraft((prev) => ({ ...prev, [participantId]: value }));
  }

  async function handleSave() {
    if (!selectedAlbumId) return;
    setSaving(true);
    setSavedMsg("");

    const scores = participants.map((p) => {
      const raw = draft[p.id];
      if (raw === undefined || raw === "") return { participantId: p.id, value: null };
      const n = parseFloat(raw);
      if (isNaN(n)) return { participantId: p.id, value: null };
      return { participantId: p.id, value: n };
    });

    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: selectedAlbumId, scores }),
    });

    await loadScores(selectedAlbumId);
    setSavedMsg("Збережено ✓");
    setTimeout(() => setSavedMsg(""), 2000);
    setSaving(false);
  }

  function handleClearAll() {
    setDraft({});
  }

  const filledCount = Object.values(draft).filter((v) => v !== "").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Оцінки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Виберіть сезон та альбом, введіть оцінки 0–10
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

      {/* Score entry table */}
      {selectedAlbumId && (
        <div className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Завантаження…</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">Учасник</th>
                    <th className="text-left py-2 px-4 font-medium w-32">Оцінка (0–10)</th>
                    <th className="text-left py-2 px-4 font-medium w-20">Поточна</th>
                    <th className="text-left py-2 px-4 font-medium w-20">Попередня</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const existing = existingScores.find((s) => s.participantId === p.id);
                    const draftVal = draft[p.id] ?? "";
                    const draftNum = draftVal !== "" ? parseFloat(draftVal) : null;
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 px-4 font-medium">{p.name}</td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={draftVal}
                            onChange={(e) => handleScoreChange(p.id, e.target.value)}
                            placeholder="—"
                            className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </td>
                        <td className="py-2 px-4">
                          {draftNum !== null && !isNaN(draftNum) ? (
                            <ScoreBadge score={draftNum} size="sm" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {existing ? (
                            <ScoreBadge score={existing.value} size="sm" />
                          ) : (
                            <span className="text-muted-foreground text-xs">немає</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Збереження…" : `Зберегти (${filledCount}/${participants.length})`}
            </Button>
            <Button variant="outline" onClick={handleClearAll} disabled={saving}>
              Очистити всі
            </Button>
            {savedMsg && (
              <span className="text-sm text-green-600 font-medium">{savedMsg}</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Порожнє поле = видалити оцінку. Значення від 0 до 10 (крок 0.5).
          </p>
        </div>
      )}
    </div>
  );
}
