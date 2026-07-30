// Relative time formatting for the admin notification feed.
// Shows "just now" / "5 min ago" / "3 h ago" / "2 d ago" for recent events and
// falls back to an absolute locale date+time for anything older than a week.

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} h ago`;
  if (day < 7) return `${day} d ago`;

  return new Date(then).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
