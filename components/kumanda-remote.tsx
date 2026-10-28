"use client";

import { useCallback, useEffect, useState } from "react";

import { AppMark } from "@/components/app-marks";
import { browserRemoteSession, validSession } from "@/lib/pairing";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  isRemoteCommand,
  readSnapshot,
  type RemoteCommand,
} from "@/lib/remote";

type LiveStatus = {
  kind: "loading" | "live" | "error";
  connected: boolean;
  command: RemoteCommand | null;
  message: string | null;
};

const INITIAL: LiveStatus = {
  kind: "loading",
  connected: false,
  command: null,
  message: null,
};

function endpoint(): string {
  const query = new URLSearchParams(window.location.search);
  if (query.get("legacy") === "1") return "/api/kumanda";
  const session = query.get("session") ?? browserRemoteSession();
  if (!validSession(session)) throw new Error("Geçersiz eşleştirme bağlantısı.");
  return `/api/kumanda?session=${session}`;
}

function statusLine(status: LiveStatus): string {
  if (status.kind === "error" && status.message) {
    return status.message;
  }
  if (status.kind === "loading") {
    return "Bağlantı aranıyor…";
  }
  if (status.connected) {
    return "Bağlı";
  }
  return "Tarayıcı ekranı bağlı değil";
}

export function KumandaRemote() {
  const [status, setStatus] = useState<LiveStatus>(INITIAL);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(endpoint(), { cache: "no-store" });
      if (!response.ok) {
        setStatus((current) =>
          current.kind === "error"
            ? current
            : {
                kind: "error",
                connected: false,
                command: current.command,
                message: "Durum okunamadı.",
              },
        );
        return;
      }
      const snapshot = readSnapshot(await response.json());
      if (!snapshot) {
        setStatus((current) => ({
          kind: "error",
          connected: false,
          command: current.command,
          message: "Durum okunamadı.",
        }));
        return;
      }
      setStatus((current) => {
        if (current.kind === "error" && current.message?.startsWith("Komut")) {
          return current;
        }
        return {
          kind: "live",
          connected: snapshot.connected,
          command: snapshot.command,
          message: null,
        };
      });
    } catch {
      setStatus((current) =>
        current.kind === "error" && current.message?.startsWith("Komut")
          ? current
          : {
              kind: "error",
              connected: false,
              command: current.command,
              message: "Durum okunamadı.",
            },
      );
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer = 0;
    const run = () => {
      void refresh().finally(() => {
        if (!stopped) {
          timer = window.setTimeout(run, 1000);
        }
      });
    };
    run();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const send = useCallback(async (command: RemoteCommand) => {
    try {
      const response = await fetch(endpoint(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ command }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Komut iletilemedi.";
        setStatus((current) => ({
          kind: "error",
          connected: current.connected,
          command: current.command,
          message,
        }));
        return;
      }
      const snapshot = readSnapshot(payload);
      setStatus({
        kind: "live",
        connected: snapshot?.connected ?? false,
        command:
          snapshot && isRemoteCommand(snapshot.command)
            ? snapshot.command
            : command,
        message: null,
      });
    } catch {
      setStatus((current) => ({
        kind: "error",
        connected: false,
        command: current.command,
        message: "Komut iletilemedi. Sunucu yanıt vermedi.",
      }));
    }
  }, []);

  const line = statusLine(status);

  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_20%_0%,#29405a_0%,#111b28_38%,#090e16_80%)] px-6 py-8 text-white">
      <div className="flex w-full max-w-[26rem] flex-col gap-8 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <header className="flex flex-col gap-[1cqw]">
          <p className="mb-3 text-xs font-medium tracking-[0.18em] text-white/40 uppercase">Tarayıcı önizlemesi</p>
          <h1 className="font-sans text-4xl leading-none font-semibold tracking-tight">
            Kumandan hazır.
          </h1>
          <p
            data-kumanda-status
            data-tone={status.kind === "error" ? "error" : "idle"}
            role="status"
            className={
              status.kind === "error"
                ? "mt-2 flex min-h-8 items-center gap-2 text-sm text-[#ffb4ab]"
                : "mt-2 flex min-h-8 items-center gap-2 text-sm text-white/70"
            }
          >
            {status.kind === "error" ? null : (
              <span className={`size-2 rounded-full ${status.connected ? "bg-[#35D07F] shadow-[0_0_12px_#35D07F66]" : "bg-white/30"}`} aria-hidden="true" />
            )}
            {line}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <ShortcutButton
            label="YouTube"
            mark="youtube"
            onPress={() => void send("youtube")}
          />
          <ShortcutButton
            label="Netflix"
            mark="netflix"
            onPress={() => void send("netflix")}
          />
        </div>

        <div className="mx-auto grid w-full max-w-[21rem] grid-cols-3 grid-rows-3 gap-3">
          <PadButton
            label="Yukarı"
            className="col-start-2 row-start-1"
            onPress={() => void send("up")}
          />
          <PadButton
            label="Sol"
            className="col-start-1 row-start-2"
            onPress={() => void send("left")}
          />
          <PadButton
            label="Tamam"
            className="col-start-2 row-start-2 rounded-full bg-[#202A36]"
            onPress={() => void send("enter")}
          />
          <PadButton
            label="Sağ"
            className="col-start-3 row-start-2"
            onPress={() => void send("right")}
          />
          <PadButton
            label="Aşağı"
            className="col-start-2 row-start-3"
            onPress={() => void send("down")}
          />
        </div>
        <p className="mx-auto max-w-xs text-center text-xs leading-relaxed text-white/40">Bu kumanda eşleştirilen /tv önizlemesini yönetir. TV uygulamasını yönetmek için TV’deki Telefonla bağlan QR kodunu okutun.</p>
      </div>
    </div>
  );
}

function ShortcutButton({
  label,
  mark,
  onPress,
}: {
  label: string;
  mark: "youtube" | "netflix";
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-[28px] border border-white/15 bg-white/[0.07] text-sm font-semibold shadow-lg backdrop-blur-xl transition active:scale-95 active:bg-white/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
    >
      <span className="size-10 overflow-hidden rounded-[30%]">
        <AppMark kind={mark} letter={label.slice(0, 1)} swatch="#111" ink="#fff" />
      </span>
      {label}
    </button>
  );
}

function PadButton({
  label,
  className,
  onPress,
}: {
  label: string;
  className: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={`flex aspect-square min-h-16 items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.07] text-base font-semibold backdrop-blur-xl transition active:scale-95 active:bg-white/[0.2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${className}`}
    >
      {label === "Yukarı" ? <ChevronUp size={28} /> : label === "Aşağı" ? <ChevronDown size={28} /> : label === "Sol" ? <ChevronLeft size={28} /> : label === "Sağ" ? <ChevronRight size={28} /> : label}
    </button>
  );
}
