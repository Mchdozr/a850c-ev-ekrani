import { connection } from "next/server";

import { isRemoteCommand } from "@/lib/remote";
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
  request.headers.get("accept");
  return Response.json(remoteSnapshot(), { headers });
}

export async function POST(request: Request) {
  await connection();
  let body: unknown;
  try {
    body = await request.json();
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
    return Response.json(acknowledgeTv(cleanFocusKey(record.focusKey)), {
      headers,
    });
  }
  if (!isRemoteCommand(record.command)) {
    return Response.json(
      { ok: false, message: "Bu komut yok." },
      { status: 400, headers },
    );
  }
  return Response.json(issueCommand(record.command), { headers });
}
