// In-memory limiter — sufficient for this app's single-process deployment
// (one `next start` instance behind Nginx). State resets on restart.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length) attempts.set(key, recent);
  else attempts.delete(key);
  return recent.length >= MAX_ATTEMPTS;
}

export function recordFailure(key: string): void {
  const list = attempts.get(key) ?? [];
  list.push(Date.now());
  attempts.set(key, list);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
