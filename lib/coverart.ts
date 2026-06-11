const USER_AGENT = "GalasRoulette/1.0 (music-roulette fan site; contact via github)";
const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org/release";

/**
 * Searches MusicBrainz for a release and returns the front cover image URL,
 * or null if none is found.
 *
 * Respects MusicBrainz rate limit of 1 req/sec — callers must manage pacing
 * when calling this in a loop (use the batch script, not direct calls).
 */
export async function fetchCoverUrl(
  artist: string,
  title: string
): Promise<string | null> {
  // 1. Search for the release on MusicBrainz
  const query = `artist:"${artist.replace(/"/g, "")}" release:"${title.replace(/"/g, "")}"`;
  const searchUrl = `${MB_BASE}/release/?query=${encodeURIComponent(query)}&limit=5&fmt=json`;

  let searchData: { releases?: Array<{ id: string }> };
  try {
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    searchData = await res.json();
  } catch {
    return null;
  }

  const releases = searchData.releases ?? [];
  if (releases.length === 0) return null;

  // 2. Try each top release until one has cover art
  for (const release of releases.slice(0, 3)) {
    const coverUrl = `${CAA_BASE}/${release.id}/front-500`;
    try {
      const coverRes = await fetch(coverUrl, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      if (coverRes.ok) {
        // Return the final URL after redirect (stable archive.org URL)
        return coverRes.url;
      }
    } catch {
      // Try next release
    }
  }

  return null;
}
