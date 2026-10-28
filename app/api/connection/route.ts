import { networkInterfaces } from "node:os";
import { connection } from "next/server";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const port = url.port ? `:${url.port}` : "";
  const origins = Object.values(networkInterfaces()).flatMap((addresses) =>
    (addresses ?? []).filter((a) => a.family === "IPv4" && !a.internal &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address))
      .map((a) => `${url.protocol}//${a.address}${port}`));
  return Response.json({ origins: [...new Set(origins)] }, { headers: { "cache-control": "no-store" } });
}
