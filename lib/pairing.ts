export const SESSION_KEY = "a850c-remote-session-v1";

export function validSession(value: string): boolean {
  return /^[a-f0-9]{32}$/.test(value);
}

export function sameRequestOrigin(origin: string, host: string): boolean {
  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.host === host;
  } catch { return false; }
}

export function pairingUrl(origin: string, session: string): string | null {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (!validSession(session) || !["http:", "https:"].includes(url.protocol) ||
        url.username || url.password || host === "localhost" || host.endsWith(".localhost") ||
        host === "0.0.0.0" || host === "[::]" || host === "[::1]" || /^127\./.test(host)) return null;
    return `${url.origin}/kumanda?session=${session}`;
  } catch {
    return null;
  }
}

let fallbackSession = "";
export function browserRemoteSession(): string {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved && validSession(saved)) return saved;
  } catch { /* Restricted storage still permits a temporary session. */ }
  if (!fallbackSession) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    fallbackSession = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  try { localStorage.setItem(SESSION_KEY, fallbackSession); } catch { /* Use memory. */ }
  return fallbackSession;
}
