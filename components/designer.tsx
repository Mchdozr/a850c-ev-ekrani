"use client";

import { useCallback, useState } from "react";

import { AppearancePanel } from "@/components/appearance-panel";
import { PickDialog } from "@/components/pick-dialog";
import { TvScreen } from "@/components/tv-screen";
import { useHomeDesign } from "@/components/use-home-design";
import { useTvRemote } from "@/components/use-tv-remote";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function Designer() {
  const { ready, design, loadNote, saveError, setDesign } = useHomeDesign();
  const [pickKey, setPickKey] = useState<string | null>(null);
  const confirm = useCallback((key: string) => {
    setPickKey(key);
  }, []);
  const { activeKey, setFocusKey } = useTvRemote(design, confirm);

  if (!ready || !design) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-16 w-full" />
        <div className="flex flex-col gap-4 lg:flex-row">
          <Skeleton className="aspect-video w-full lg:flex-1" />
          <Skeleton className="h-80 w-full lg:w-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-black">
      <div
        className="absolute inset-y-0 left-0 grid place-items-center right-[min(35vw,672px)]"
        aria-label="A 850 C ev ekranı önizlemesi"
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <TvScreen
            design={design}
            focusKey={activeKey}
            onActivate={(key) => {
              setFocusKey(key);
              setPickKey(key);
            }}
          />
        </div>
      </div>
      {loadNote || saveError ? (
        <div className="absolute top-4 left-4 z-30 max-w-sm">
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
      <AppearancePanel
        design={design}
        onChange={setDesign}
        className="absolute inset-y-0 right-0 z-20 w-[min(35vw,672px)]"
      />
      <PickDialog
        design={design}
        targetKey={pickKey}
        onOpenChange={(open) => {
          if (!open) {
            setPickKey(null);
          }
        }}
      />
    </div>
  );
}
