"use client";

import { useCallback, useState } from "react";
import { TvMinimal } from "lucide-react";

import { AppearancePanel } from "@/components/appearance-panel";
import { PhonePairing } from "@/components/phone-pairing";
import { PickDialog } from "@/components/pick-dialog";
import { TvScreen } from "@/components/tv-screen";
import { useHomeDesign } from "@/components/use-home-design";
import { useTvRemote } from "@/components/use-tv-remote";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { panelLayoutLabel, wallpaperCss } from "@/lib/design";

export function Designer() {
  const { ready, design, loadNote, saveError, setDesign } = useHomeDesign();
  const [pickKey, setPickKey] = useState<string | null>(null);
  const confirm = useCallback((key: string) => {
    setPickKey(key);
  }, []);
  const { activeKey, setFocusKey } = useTvRemote(design, confirm);

  if (!ready || !design) {
    return (
      <div className="mx-auto flex min-h-dvh w-full flex-col gap-6 bg-[#0b111c] p-6">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <div className="flex flex-1 flex-col items-center gap-6 lg:flex-row">
          <Skeleton className="aspect-video w-full rounded-3xl lg:flex-1" />
          <Skeleton className="h-96 w-full rounded-3xl lg:h-full lg:w-[35vw]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-[#0a101b] text-white lg:h-dvh lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -inset-24 scale-110 opacity-40 blur-[90px] transition-[background] duration-700 motion-reduce:transition-none"
          style={{ background: wallpaperCss(design.wallpaper) }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a101b]/35 via-[#0a101b]/75 to-[#0a101b]/90" />
      </div>

      <header
        data-appearance-panel
        className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] shadow-[inset_0_1px_0_#ffffff15] backdrop-blur-xl">
            <TvMinimal className="size-5 text-[#dbe6f6]" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl leading-tight font-semibold tracking-tight">
              Ev ekranı
            </h1>
            <p className="mt-1 text-[11px] font-medium tracking-[0.16em] text-[#bdcce0]/55 uppercase">
              A 850 C · Tasarım stüdyosu
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="flex items-center gap-2 text-xs text-white/55"
            role="status"
          >
            <span
              className={`size-1.5 rounded-full ${saveError ? "bg-amber-300" : "bg-[#9dc8be]"}`}
              aria-hidden="true"
            />
            {saveError ? "Kayıt bekliyor" : "Bu tarayıcıya kaydedilir"}
          </span>
          <PhonePairing />
        </div>
      </header>

      {loadNote || saveError ? (
        <div className="relative z-10 mx-5 mb-4 grid shrink-0 gap-2 sm:mx-7 lg:max-w-2xl">
          {loadNote ? (
            <Alert>
              <AlertTitle>Kayıt okunamadı</AlertTitle>
              <AlertDescription>{loadNote}</AlertDescription>
            </Alert>
          ) : null}
          {saveError ? (
            <Alert variant="destructive">
              <AlertTitle>Kaydedilemedi</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      <main className="relative grid flex-1 gap-5 px-4 pb-4 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_clamp(380px,35vw,672px)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:px-6 lg:pb-6">
        <section
          className="flex min-w-0 flex-col justify-center py-3 lg:px-3 lg:py-6"
          aria-label="A 850 C ev ekranı önizlemesi"
        >
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-[#c8d5e7]/65 uppercase">
              <span
                className="size-1.5 rounded-full bg-[#b7d4cd]"
                aria-hidden="true"
              />
              Canlı önizleme
            </p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
              {panelLayoutLabel(design.layout)} · 16:9
            </span>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-[clamp(12px,1.4vw,26px)] border border-white/20 bg-black shadow-[0_40px_100px_#00000070,0_0_0_5px_#ffffff03]">
            <TvScreen
              design={design}
              focusKey={activeKey}
              onActivate={(key) => {
                setFocusKey(key);
                setPickKey(key);
              }}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-white/35">
            <p>Yön tuşlarıyla gezin · Enter ile seçin</p>
            <p>Görünümü ayarlar panelinden düzenleyin</p>
          </div>
        </section>
        <AppearancePanel
          design={design}
          onChange={setDesign}
          className="min-h-[760px] lg:h-full lg:min-h-0"
        />
      </main>
      <PickDialog
        design={design}
        targetKey={pickKey}
        onOpenChange={(open) => {
          if (!open) setPickKey(null);
        }}
      />
    </div>
  );
}
