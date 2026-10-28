"use client";

import { useCallback, useEffect, useState } from "react";

import { AppMark } from "@/components/app-marks";
import {
  commandLabel,
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
  return status.command ? commandLabel(status.command) : "Televizyon bağlı değil";
}

export function KumandaRemote() {
  const [status, setStatus] = useState<LiveStatus>(INITIAL);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/kumanda", { cache: "no-store" });
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
      const response = await fetch("/api/kumanda", {
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
    <div className="grid min-h-dvh place-items-center bg-[#0B0F14] px-4 py-8 text-white">
      <div className="flex aspect-[9/16] w-full max-w-[26rem] flex-col gap-[4.4cqw] pb-[max(0.5rem,env(safe-area-inset-bottom))] [container-type:size]">
        <header className="flex flex-col gap-[1cqw]">
          <h1 className="font-sans text-[5.9cqw] leading-none font-semibold tracking-tight">
            TV Kumandası
          </h1>
          <p
            data-kumanda-status
            data-tone={status.kind === "error" ? "error" : "idle"}
            role="status"
            className={
              status.kind === "error"
                ? "flex min-h-[2rem] items-center gap-2 text-[3.7cqw] text-[#ffb4ab]"
                : "flex min-h-[2rem] items-center gap-2 text-[3.7cqw] font-semibold text-white"
            }
          >
            {status.kind === "error" ? null : (
              <span className="size-[0.7rem] rounded-full bg-[#35D07F]" aria-hidden="true" />
            )}
            {line}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-[4.4cqw]">
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

        <div className="mx-auto grid w-full max-w-[20rem] grid-cols-3 grid-rows-3 gap-[3cqw]">
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
      className="flex h-[19.3cqh] items-center justify-center gap-3 rounded-[40px] bg-[#202A36] text-[3.7cqw] font-semibold active:bg-white/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
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
      className={`flex h-[20cqw] items-center justify-center rounded-[48px] bg-[#202A36] text-[4.4cqw] font-semibold active:bg-white/[0.2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${className}`}
    >
      {label}
    </button>
  );
}
