export const REMOTE_COMMANDS = [
  "up",
  "down",
  "left",
  "right",
  "enter",
  "youtube",
  "netflix",
] as const;

export type RemoteCommand = (typeof REMOTE_COMMANDS)[number];

export type RemoteEntry = {
  seq: number;
  command: RemoteCommand;
};

export type RemoteSnapshot = {
  ok: true;
  seq: number;
  command: RemoteCommand | null;
  recent: RemoteEntry[];
  focusKey: string | null;
  connected: boolean;
};

export function isRemoteCommand(value: unknown): value is RemoteCommand {
  return (
    typeof value === "string" &&
    (REMOTE_COMMANDS as readonly string[]).includes(value)
  );
}

export function commandLabel(command: RemoteCommand): string {
  switch (command) {
    case "up":
      return "Yukarı";
    case "down":
      return "Aşağı";
    case "left":
      return "Sol";
    case "right":
      return "Sağ";
    case "enter":
      return "Tamam";
    case "youtube":
      return "YouTube";
    case "netflix":
      return "Netflix";
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
}

export function readSnapshot(value: unknown): RemoteSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.ok !== true || typeof record.seq !== "number") {
    return null;
  }
  const command =
    record.command == null
      ? null
      : isRemoteCommand(record.command)
        ? record.command
        : null;
  const recent: RemoteEntry[] = [];
  if (Array.isArray(record.recent)) {
    for (const item of record.recent) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const entry = item as Record<string, unknown>;
      if (typeof entry.seq !== "number" || !isRemoteCommand(entry.command)) {
        continue;
      }
      recent.push({ seq: entry.seq, command: entry.command });
    }
  }
  return {
    ok: true,
    seq: record.seq,
    command,
    recent,
    focusKey: typeof record.focusKey === "string" ? record.focusKey : null,
    connected: record.connected === true,
  };
}
