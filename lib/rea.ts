export type ReaActivity = {
  name: string
  categories: string[]
}

export type ReaInspectResult =
  | {
      ok: true
      evidenceId: string | null
      packageName: string | null
      versionName: string | null
      componentStatus: string | null
      activities: ReaActivity[]
      limitations: string[]
    }
  | { ok: false; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isLauncher(categories: string[]): boolean {
  return categories.some(
    (category) =>
      category.endsWith("LEANBACK_LAUNCHER") ||
      category.endsWith(".HOME") ||
      category.endsWith(".LAUNCHER"),
  )
}

export function parseReaInspect(payload: unknown): ReaInspectResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "REA çıktısı okunamadı." }
  }
  if (typeof payload.code === "string" && typeof payload.message === "string") {
    return { ok: false, message: payload.message }
  }
  const result = isRecord(payload.normalized_result) ? payload.normalized_result : null
  if (!result) {
    return { ok: false, message: "REA kanıt kaydı bileşen listesi taşımıyor." }
  }
  const limitations = Array.isArray(result.limitations)
    ? result.limitations.filter((item): item is string => typeof item === "string")
    : []
  const components = isRecord(result.components) ? result.components : null
  if (components && Array.isArray(components.limitations)) {
    for (const item of components.limitations) {
      if (typeof item === "string") limitations.push(item)
    }
  }
  const activities: ReaActivity[] = []
  const items = components && Array.isArray(components.items) ? components.items : []
  for (const item of items) {
    if (!isRecord(item)) continue
    if (item.kind !== "activity" && item.kind !== "activity-alias") continue
    const categories = Array.isArray(item.categories)
      ? item.categories.filter((entry): entry is string => typeof entry === "string")
      : []
    if (!isLauncher(categories)) continue
    if (typeof item.name !== "string") continue
    activities.push({ name: item.name, categories })
  }
  return {
    ok: true,
    evidenceId: typeof payload.evidence_id === "string" ? payload.evidence_id : null,
    packageName: typeof result.package_name === "string" ? result.package_name : null,
    versionName: typeof result.version_name === "string" ? result.version_name : null,
    componentStatus: components && typeof components.status === "string" ? components.status : null,
    activities,
    limitations,
  }
}
