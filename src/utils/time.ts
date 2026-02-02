export const ONLINE_MS = 10 * 60 * 1000; // 10 минут

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleString();
}

export function fmtAgo(msAgo: number) {
  const s = Math.floor(msAgo / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
