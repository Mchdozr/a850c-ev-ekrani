"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { APP_COLOR_IDS, LIMITS, newId, type DockApp, type HomeDesign } from "@/lib/design"
import type { ReaInspectResult } from "@/lib/rea"

export function ReaPanel({
  onChange,
  design,
}: {
  design: HomeDesign
  onChange: (design: HomeDesign) => void
}) {
  const [result, setResult] = useState<ReaInspectResult | null>(null)
  const [busy, setBusy] = useState(false)

  async function inspect(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const body = new FormData()
      body.set("apk", file)
      const response = await fetch("/api/rea/inspect", { method: "POST", body })
      const payload = (await response.json()) as ReaInspectResult
      setResult(payload)
      if (!payload.ok) toast.error(payload.message)
    } catch {
      const failure: ReaInspectResult = { ok: false, message: "İnceleme isteği ulaşmadı." }
      setResult(failure)
      toast.error(failure.message)
    } finally {
      setBusy(false)
    }
  }

  function adopt() {
    if (!result || !result.ok || result.activities.length === 0) return
    const apps: DockApp[] = result.activities.slice(0, LIMITS.apps).map((activity, index) => {
      const tail = activity.name.split(".").pop() ?? activity.name
      const colorId = APP_COLOR_IDS[index % APP_COLOR_IDS.length] ?? "bakir"
      return {
        id: newId(),
        name: tail.slice(0, LIMITS.appName),
        colorId,
      }
    })
    onChange({ ...design, apps })
    toast.success("Başlatıcı bileşenleri uygulama şeridine alındı.")
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>REA bu ekranda ne yaptı</AlertTitle>
        <AlertDescription>
          Ürün sayfası Chromium ile açıldı ve bir başlık belirdi (kanıt ev_a3cc7b6a). Metin
          istendiğinde sunucu Access Denied döndü (kanıt ev_514c7cb6); model adı bu kayıtlardan
          okunmadı. Televizyon bu makineye ADB ile bağlı değil. JADX JAR yok, bu yüzden yöntem
          gövdesi çözülmez. Seçtiğiniz APK çalıştırılmaz; yalnızca bildirimi okunur.
        </AlertDescription>
      </Alert>
      <Field>
        <FieldLabel htmlFor="rea-apk">Başlatıcı APK</FieldLabel>
        <Input
          id="rea-apk"
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          onChange={(event) => void inspect(event.target.files?.[0])}
        />
        <FieldDescription>
          HOME, LAUNCHER veya LEANBACK_LAUNCHER bileşenleri listelenir.
        </FieldDescription>
      </Field>
      {busy ? <p className="text-sm text-muted-foreground">REA paketi okuyor.</p> : null}
      {result && !result.ok ? (
        <Alert>
          <AlertTitle>İnceleme tamamlanmadı</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}
      {result && result.ok ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{result.packageName ?? "paket adı yok"}</Badge>
            {result.versionName ? <Badge variant="secondary">{result.versionName}</Badge> : null}
            <Badge variant="outline">{result.componentStatus ?? "bileşen durumu yok"}</Badge>
          </div>
          {result.evidenceId ? (
            <p className="text-xs break-all text-muted-foreground">Kanıt {result.evidenceId}</p>
          ) : null}
          {result.activities.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Ana ekran bileşeni yok</EmptyTitle>
                <EmptyDescription>
                  Bu pakette HOME, LAUNCHER veya LEANBACK_LAUNCHER kategorisi yok.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {result.activities.map((activity) => (
                <li key={activity.name} className="break-all">
                  {activity.name}
                </li>
              ))}
            </ul>
          )}
          <Button disabled={result.activities.length === 0} onClick={adopt}>
            Şeride al
          </Button>
          {result.limitations.length > 0 ? (
            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
              {result.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
