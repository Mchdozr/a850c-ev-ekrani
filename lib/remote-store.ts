import type { RemoteCommand, RemoteSnapshot } from "@/lib/remote";

type Entry = {
  seq: number;
  command: RemoteCommand;
  at: number;
};

type Memory = {
  seq: number;
  recent: Entry[];
  focusKey: string | null;
  tvSeenAt: number;
  usedAt: number;
};

const GLOBAL_KEY = "__a850cRemote";
const FRESH_MS = 20_000;
const CONNECTED_MS = 3_500;

function memory(session = "legacy"): Memory {
  const root = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Map<string, Memory> };
  const sessions = root[GLOBAL_KEY] ??= new Map();
  if (!sessions.has(session)) {
    // Bound idle pairing state in long-running development servers.
    for (const [key, state] of sessions) {
      if (Date.now() - state.usedAt > 3_600_000) sessions.delete(key);
    }
    if (sessions.size >= 256) sessions.delete(sessions.keys().next().value!);
    sessions.set(session, {
      seq: 0,
      recent: [],
      focusKey: null,
      tvSeenAt: 0,
      usedAt: Date.now(),
    });
  }
  const state = sessions.get(session)!;
  state.usedAt = Date.now();
  return state;
}

export function remoteSnapshot(session?: string): RemoteSnapshot {
  const now = Date.now();
  const state = memory(session);
  const recent = state.recent.filter((entry) => now - entry.at < FRESH_MS);
  const last = recent[recent.length - 1] ?? null;
  return {
    ok: true,
    seq: state.seq,
    command: last?.command ?? null,
    recent: recent.map((entry) => ({ seq: entry.seq, command: entry.command })),
    focusKey: state.focusKey,
    connected: state.tvSeenAt > 0 && now - state.tvSeenAt < CONNECTED_MS,
  };
}

export function issueCommand(command: RemoteCommand, session?: string): RemoteSnapshot {
  const state = memory(session);
  const now = Date.now();
  state.seq += 1;
  state.recent.push({ seq: state.seq, command, at: now });
  state.recent = state.recent
    .filter((entry) => now - entry.at < FRESH_MS)
    .slice(-24);
  return remoteSnapshot(session);
}

export function acknowledgeTv(focusKey: string | null, session?: string): RemoteSnapshot {
  const state = memory(session);
  state.focusKey = focusKey;
  state.tvSeenAt = Date.now();
  return remoteSnapshot(session);
}

export function cleanFocusKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 160) {
    return null;
  }
  if (!/^[a-z0-9:_-]+$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}
