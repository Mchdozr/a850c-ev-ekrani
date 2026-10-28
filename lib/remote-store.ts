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
};

const GLOBAL_KEY = "__a850cRemote";
const FRESH_MS = 20_000;
const CONNECTED_MS = 3_500;

function memory(): Memory {
  const root = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Memory };
  if (!root[GLOBAL_KEY]) {
    root[GLOBAL_KEY] = {
      seq: 0,
      recent: [],
      focusKey: null,
      tvSeenAt: 0,
    };
  }
  return root[GLOBAL_KEY];
}

function freshEntries(now: number): Entry[] {
  return memory().recent.filter((entry) => now - entry.at < FRESH_MS);
}

export function remoteSnapshot(): RemoteSnapshot {
  const now = Date.now();
  const recent = freshEntries(now);
  const last = recent[recent.length - 1] ?? null;
  const state = memory();
  return {
    ok: true,
    seq: state.seq,
    command: last?.command ?? null,
    recent: recent.map((entry) => ({ seq: entry.seq, command: entry.command })),
    focusKey: state.focusKey,
    connected: state.tvSeenAt > 0 && now - state.tvSeenAt < CONNECTED_MS,
  };
}

export function issueCommand(command: RemoteCommand): RemoteSnapshot {
  const state = memory();
  const now = Date.now();
  state.seq += 1;
  state.recent.push({ seq: state.seq, command, at: now });
  state.recent = state.recent
    .filter((entry) => now - entry.at < FRESH_MS)
    .slice(-24);
  return remoteSnapshot();
}

export function acknowledgeTv(focusKey: string | null): RemoteSnapshot {
  const state = memory();
  state.focusKey = focusKey;
  state.tvSeenAt = Date.now();
  return remoteSnapshot();
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
