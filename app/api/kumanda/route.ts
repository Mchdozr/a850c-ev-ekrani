import { connection } from "next/server";

import { isRemoteCommand } from "@/lib/remote";
import { validSession, sameRequestOrigin } from "@/lib/pairing";
import {
  acknowledgeTv,
  cleanFocusKey,
  issueCommand,
  remoteSnapshot,
} from "@/lib/remote-store";

const headers = {
  "cache-control": "no-store, no-cache, must-revalidate",
};

export async function GET(request: Request) {
  await connection();
  const session = new URL(request.url).searchParams.get("session") ?? undefined;
  if (session !== undefined && !validSession(session)) return Response.json({ ok: false }, { status: 400, headers });
  return Response.json(remoteSnapshot(session), { headers });
}

export async function POST(request: Request) {
  await connection();
  const session = new URL(request.url).searchParams.get("session") ?? undefined;
  const origin = request.headers.get("origin");
  if (origin && !sameRequestOrigin(origin, request.headers.get("host") ?? new URL(request.url).host)) return Response.json({ ok: false }, { status: 403, headers });
  if (session !== undefined && !validSession(session)) return Response.json({ ok: false }, { status: 400, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ ok: false }, { status: 415, headers });
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) return Response.json({ ok: false }, { status: 413, headers });
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { ok: false, message: "Komut okunamadı." },
      { status: 400, headers },
    );
  }
  if (!body || typeof body !== "object") {
    return Response.json(
      { ok: false, message: "Komut okunamadı." },
      { status: 400, headers },
    );
  }
  const record = body as {
    role?: unknown;
    command?: unknown;
    focusKey?: unknown;
  };
  if (record.role === "tv") {
    return Response.json(acknowledgeTv(cleanFocusKey(record.focusKey), session), {
      headers,
    });
  }
  if (!isRemoteCommand(record.command)) {
    return Response.json(
      { ok: false, message: "Bu komut yok." },
      { status: 400, headers },
    );
  }
  return Response.json(issueCommand(record.command, session), { headers });
}
