"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { PickDialog } from "@/components/pick-dialog";
import { TvScreen } from "@/components/tv-screen";
import { useHomeDesign } from "@/components/use-home-design";
import { useTvRemote } from "@/components/use-tv-remote";
import { Skeleton } from "@/components/ui/skeleton";
import { PhonePairing } from "@/components/phone-pairing";

export function TvStage() {
  const router = useRouter();
  const { ready, design } = useHomeDesign();
  const [pickKey, setPickKey] = useState<string | null>(null);
  const confirm = useCallback((key: string) => {
    setPickKey(key);
  }, []);
  const leave = useCallback(() => {
    router.push("/");
  }, [router]);
  const { activeKey, setFocusKey } = useTvRemote(design, confirm, leave, true);

  if (!ready || !design) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Skeleton className="aspect-video w-full max-w-5xl" />
      </div>
    );
  }

  return (
    <div className="relative grid min-h-dvh place-items-center bg-background">
      <div
        className="relative overflow-hidden"
        style={{
          width: "min(100vw, calc(100dvh * 16 / 9))",
          height: "min(100dvh, calc(100vw * 9 / 16))",
        }}
        aria-label="A 850 C tam ekran"
      >
        <TvScreen
          design={design}
          focusKey={activeKey}
          onActivate={(key) => {
            setFocusKey(key);
            setPickKey(key);
          }}
        />
      </div>
      <div data-appearance-panel className="absolute right-6 bottom-5 z-10 opacity-65 transition hover:opacity-100 focus-within:opacity-100">
        <PhonePairing />
      </div>
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
