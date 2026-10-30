import { spawn } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"

import { parseReaInspect, type ReaInspectResult } from "@/lib/rea"

const MAX_BYTES = 40 * 1024 * 1024

function reaBinary(): string {
  return process.env.REA_BIN ?? join(homedir(), ".local", "bin", "rea")
}

function runRea(apkPath: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(/* turbopackIgnore: true */ reaBinary(), ["inspect-android-package", apkPath, "--format", "json"], {
      env: {
        ...process.env,
        PATH: `${join(homedir(), ".local", "bin")}:${process.env.PATH ?? ""}`,
      },
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      reject(new Error("REA incelemesi 90 saniyede bitmedi."))
    }, 90_000)
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk
    })
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on("close", () => {
      clearTimeout(timer)
      resolve({ stdout, stderr })
    })
  })
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData()
  const file = form.get("apk")
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "APK dosyası seçilmedi." } satisfies ReaInspectResult, {
      status: 400,
    })
  }
  if (!file.name.toLowerCase().endsWith(".apk") || file.size === 0 || file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, message: "Yalnızca 40 MB altındaki bir .apk incelenir." } satisfies ReaInspectResult,
      { status: 400 },
    )
  }

  const directory = await mkdtemp(join(tmpdir(), "rea-apk-"))
  try {
    const apkPath = join(directory, "package.apk")
    await writeFile(apkPath, Buffer.from(await file.arrayBuffer()))
    const run = await runRea(apkPath)
    const text = run.stdout.trim()
    if (!text) {
      return Response.json(
        { ok: false, message: run.stderr.trim() || "REA çıktı vermedi." } satisfies ReaInspectResult,
        { status: 422 },
      )
    }
    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      return Response.json({ ok: false, message: "REA JSON döndürmedi." } satisfies ReaInspectResult, {
        status: 422,
      })
    }
    const parsed = parseReaInspect(payload)
    return Response.json(parsed, { status: parsed.ok ? 200 : 422 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "REA başlatılamadı."
    return Response.json({ ok: false, message } satisfies ReaInspectResult, { status: 500 })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
